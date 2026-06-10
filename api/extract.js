// api/extract.js — POST：把用户口语化回答抽取为该指标的数值/选项。
// 仅做自然语言理解；范围校验仍以前端冻结内核 validateInput 为准（双保险）。
import { readJson, sendJson } from './_lib/http.js';
import { chatJSON, hasKey } from './_lib/deepseek.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  if (!hasKey()) return sendJson(res, 503, { ok: false, error: 'no_api_key' });

  const { text, varSpec } = await readJson(req);
  if (!text || !varSpec) return sendJson(res, 400, { ok: false, error: 'bad_request' });

  const isSelect = varSpec.type === 'select';
  const optLines = isSelect
    ? '选项：' + (varSpec.options || []).map((o) => `${o.value}=${o.label}`).join('，')
    : `单位：${varSpec.unit || '无'}；合理范围：${varSpec.min ?? '不限'}~${varSpec.max ?? '不限'}`;

  const system = '你是一个严格的信息抽取器。只输出 JSON，不要解释。';
  const user =
    `请从用户的口语化回答中，抽取「${varSpec.label}」对应的值。\n` +
    `字段类型：${isSelect ? '单选' : '数值'}。${optLines}\n` +
    `用户回答："${text}"\n` +
    `输出 JSON：{"ok": 布尔, "value": ${isSelect ? '选项的数字 value' : '数值'} 或 null, "clarify": 当无法确定时的一句追问，否则 null}。` +
    `数值题只返回数字本身（不带单位）；选项题只返回选项对应的数字 value；无法判断时 ok=false 并给出 clarify。`;

  try {
    const raw = await chatJSON({ system, user, max_tokens: 120 });
    const parsed = JSON.parse(raw);
    let value = parsed.value;

    if (value === null || value === undefined || parsed.ok === false) {
      return sendJson(res, 200, { ok: false, clarify: parsed.clarify || '抱歉，我没太理解，可以直接选择或输入数值吗？' });
    }
    if (isSelect) {
      const ok = (varSpec.options || []).some((o) => String(o.value) === String(value));
      if (!ok) return sendJson(res, 200, { ok: false, clarify: '请选择其中一个选项。' });
    } else {
      value = Number(value);
      if (Number.isNaN(value)) return sendJson(res, 200, { ok: false, clarify: '请告诉我一个具体数值。' });
      if (varSpec.min != null && value < varSpec.min) return sendJson(res, 200, { ok: false, clarify: `这个数值偏低，正常应不小于 ${varSpec.min}。` });
      if (varSpec.max != null && value > varSpec.max) return sendJson(res, 200, { ok: false, clarify: `这个数值偏高，正常应不大于 ${varSpec.max}。` });
    }
    return sendJson(res, 200, { ok: true, value });
  } catch {
    return sendJson(res, 200, { ok: false, clarify: '抱歉，我没太理解，可以直接选择或输入数值吗？' });
  }
}
