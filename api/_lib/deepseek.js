// api/_lib/deepseek.js — DeepSeek（OpenAI 兼容）调用封装。
// 密钥只从环境变量读取（本地 .env / Vercel 环境变量），绝不出现在前端或代码里。
const BASE = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// 透明支持 HTTP(S) 代理（企业网络 / 受限环境）。无代理 env 时完全 no-op，
// 不影响本机 / Vercel 直连。Node 的 fetch(undici) 默认不读 *_proxy 环境变量，故显式接入。
if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) {
  try {
    const { setGlobalDispatcher, EnvHttpProxyAgent } = await import('undici');
    setGlobalDispatcher(new EnvHttpProxyAgent());
  } catch { /* undici 不可用则忽略，回退默认直连 */ }
}

export function hasKey() {
  return !!process.env.DEEPSEEK_API_KEY;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  };
}

// 非流式 + JSON 模式（用于结构化抽取）
export async function chatJSON({ system, user, max_tokens = 160 }) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens,
      stream: false,
    }),
  });
  if (!r.ok) throw new Error(`deepseek ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? '';
}

// 流式（用于解释 / 问答），返回上游 fetch Response 以便透传 SSE
export async function chatStream({ system, messages, max_tokens = 800, temperature = 0.3 }) {
  return fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature,
      max_tokens,
      stream: true,
    }),
  });
}
