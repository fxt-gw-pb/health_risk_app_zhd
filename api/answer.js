// api/answer.js — POST（SSE 流式）：分层解读 / 「为什么」/ 自由问答。
// 护栏由系统 Prompt 承载；出口对累计文本做禁项扫描，命中即替换并结束。
// P4 检索为空（通用保守回答）；P5 会注入 BM25 检索到的知识块。
import { readJson } from './_lib/http.js';
import { chatStream, hasKey } from './_lib/deepseek.js';
import { buildSystemPrompt, scanForbidden, SAFE_REPLACE } from './_lib/safety.js';
import { retrieve, diseaseScopeOf } from './_lib/retrieve.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  const { messages = [], riskContext = null, question = '', chunks = [] } = await readJson(req);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  if (!hasKey()) {
    send({ type: 'delta', text: '（后端未配置 DeepSeek 密钥，暂时无法生成解释。）' });
    send({ type: 'done' });
    return res.end();
  }

  // BM25-lite 检索：查询 = 用户问题 + 最近用户消息 + 疾病 + Top5 因子标签
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const queryText = [question, lastUser, riskContext?.disease, ...((riskContext?.top5 || []).map((f) => f.label))].filter(Boolean).join(' ');
  const scope = diseaseScopeOf(riskContext?.disease || queryText);
  let retrieved = (chunks && chunks.length) ? chunks : retrieve(queryText, { diseaseScope: scope, k: 5 });
  if (!retrieved.length) retrieved = retrieve(queryText, { k: 5 }); // 兜底：不限疾病再检索

  const system = buildSystemPrompt(riskContext, retrieved);
  const userMsgs = messages.length ? messages : [{ role: 'user', content: question }];

  try {
    const upstream = await chatStream({ system, messages: userMsgs });
    if (!upstream.ok || !upstream.body) {
      send({ type: 'delta', text: '（生成失败，请稍后再试。）' });
      send({ type: 'done' });
      return res.end();
    }
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let acc = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content || '';
          if (!delta) continue;
          acc += delta;
          if (scanForbidden(acc)) {
            send({ type: 'replace', text: SAFE_REPLACE });
            send({ type: 'done' });
            return res.end();
          }
          send({ type: 'delta', text: delta });
        } catch { /* 忽略心跳/非 JSON 行 */ }
      }
    }
    if (retrieved.length) {
      send({ type: 'sources', items: retrieved.map((r) => ({
        title: r.title, year: r.year, org: r.organization_or_journal, url: r.source_url,
      })) });
    }
    send({ type: 'done' });
    res.end();
  } catch {
    send({ type: 'delta', text: '（生成出错，请稍后再试。）' });
    send({ type: 'done' });
    res.end();
  }
}
