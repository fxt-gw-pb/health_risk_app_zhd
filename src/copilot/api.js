// src/copilot/api.js — 前端调用后端代理的薄封装。
// 后端不可用时调用方应回退到确定性流程（应用始终可用）。
//
// 接口地址可配置（VITE_API_BASE）：
//   · 空（默认）= 同源 /api/*  —— Vercel（含后端）/ 本地 dev 用这个
//   · 设为后端绝对地址 = 跨域调用 —— GitHub Pages + 国内 SCF/FC 后端用这个
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

// 自由文本 → 指标值。返回 {ok, value} 或 {ok:false, clarify}
export async function extractValue(text, varSpec) {
  try {
    const r = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, varSpec }),
    });
    if (!r.ok) return { ok: false, unavailable: true };
    return await r.json();
  } catch {
    return { ok: false, unavailable: true };
  }
}

// 流式解释 / 问答。onDelta(text, isReplace) 增量回调；onSources(items) 参考来源回调。
// 返回 Promise（done 时 resolve）。
export async function streamAnswer({ messages, riskContext, question, chunks }, onDelta, onSources) {
  const r = await fetch(`${API_BASE}/api/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, riskContext, question, chunks }),
  });
  if (!r.ok || !r.body) throw new Error('answer_unavailable');
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const blocks = buf.split('\n\n');
    buf = blocks.pop();
    for (const block of blocks) {
      const line = block.trim();
      if (!line.startsWith('data:')) continue;
      try {
        const j = JSON.parse(line.slice(5).trim());
        if (j.type === 'delta') onDelta(j.text, false);
        else if (j.type === 'replace') onDelta(j.text, true);
        else if (j.type === 'sources') onSources?.(j.items || []);
        else if (j.type === 'done') return;
      } catch { /* skip */ }
    }
  }
}
