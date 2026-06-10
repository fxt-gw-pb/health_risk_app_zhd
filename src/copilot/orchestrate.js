// src/copilot/orchestrate.js — 把后端流式/抽取接入 store 的编排（含降级回退）。
import { extractValue, streamAnswer } from './api';
import { OUTCOMES } from '../kernel';

const newId = () => (globalThis.crypto?.randomUUID?.() || `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`);

// 从报告 + 结局构造给 AI 的风险背景（只传等级与 Top5 因子标签，不传可重算风险的原始值）
export function riskContextFromReport(report, oid) {
  const o = OUTCOMES[oid];
  const r = report.results[oid];
  const top5 = [...r.contributions]
    .filter((c) => !c.skipped)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5)
    .map((c) => ({ label: c.label, sign: c.contribution >= 0 ? 'up' : 'down' }));
  return { disease: o.name, level: r.level, top5 };
}

// 报告里「为什么会这样」：优先流式 RAG，后端不可用回退确定性 buildWhy
export async function askWhy(dispatch, report, oid) {
  const id = newId();
  const userText = `为什么我的${OUTCOMES[oid].name}风险是这样？`;
  dispatch({ type: 'AI_START', id, userText });
  const riskContext = riskContextFromReport(report, oid);
  try {
    let got = false;
    await streamAnswer(
      { question: userText, riskContext },
      (text, replace) => { got = true; dispatch({ type: 'AI_DELTA', id, text, replace }); },
      (items) => dispatch({ type: 'AI_SOURCES', id, items }),
    );
    if (!got) dispatch({ type: 'AI_FALLBACK_WHY', id, oid });
    else dispatch({ type: 'AI_DONE', id });
  } catch {
    dispatch({ type: 'AI_FALLBACK_WHY', id, oid });
  }
}

// 报告后自由问答
export async function askQuestion(dispatch, report, question) {
  const id = newId();
  dispatch({ type: 'AI_START', id, userText: question });
  const riskContext = report?.primary ? riskContextFromReport(report, report.primary) : null;
  try {
    let got = false;
    await streamAnswer(
      { question, riskContext },
      (text, replace) => { got = true; dispatch({ type: 'AI_DELTA', id, text, replace }); },
      (items) => dispatch({ type: 'AI_SOURCES', id, items }),
    );
    if (!got) dispatch({ type: 'AI_DELTA', id, text: '（暂时无法生成回答，请稍后再试。）' });
    dispatch({ type: 'AI_DONE', id });
  } catch {
    dispatch({ type: 'AI_DELTA', id, text: '抱歉，AI 服务暂时不可用，请稍后再试。' });
    dispatch({ type: 'AI_DONE', id });
  }
}

// 自由文本作答一个问诊问题：确定性快路 → LLM 抽取 → 失败追问
export async function submitAnswerText(dispatch, v, text) {
  const raw = text.trim();
  if (raw === '') return;

  if (v.type === 'select') {
    const opt = v.options.find((o) => String(o.value) === raw || o.label === raw || raw.includes(o.label));
    if (opt) return dispatch({ type: 'ANSWER', varId: v.id, value: opt.value, display: opt.label });
  } else {
    const n = Number(raw);
    if (!Number.isNaN(n) && (v.min == null || n >= v.min) && (v.max == null || n <= v.max)) {
      return dispatch({ type: 'ANSWER', varId: v.id, value: n, display: `${raw}${v.unit || ''}` });
    }
  }

  const res = await extractValue(text, v);
  if (res.ok) return dispatch({ type: 'ANSWER', varId: v.id, value: res.value, display: text });
  if (res.unavailable) {
    return dispatch({ type: 'INTAKE_CLARIFY', userText: text,
      clarify: v.type === 'select' ? '请点选下面的选项。' : '请直接输入一个数值，或点「跳过」。' });
  }
  return dispatch({ type: 'INTAKE_CLARIFY', userText: text, clarify: res.clarify || '我没太理解，可以换种说法，或直接选择/输入数值吗？' });
}
