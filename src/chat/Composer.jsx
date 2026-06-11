// src/chat/Composer.jsx — 底部输入区。问诊支持自由文本（→ extract，确定性兜底）+ 快捷选项；
// 报告后开放自由问答（流式 RAG）。全部带"后端不可用→回退"降级。
import { useState } from 'react';
import { Send, ChevronRight, RotateCcw, Sparkles, Loader2, PlusCircle } from 'lucide-react';
import { useStore } from '../app/store';
import { computeSportMet } from '../kernel';
import { BY_ID, layerTitle } from '../intake/questionFlow';
import { submitAnswerText, askQuestion } from '../copilot/orchestrate';

function SkipBtn({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600 disabled:opacity-40">
      跳过
    </button>
  );
}

function SendBtn({ onClick, disabled, busy }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="btn-sheen grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md shadow-blue-500/30 transition active:scale-95 disabled:opacity-40"
      style={{ background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' }}>
      {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
    </button>
  );
}

// 问诊问题：自由文本 + （select 显示快捷 chips / number 显示单位）+ 跳过
function QuestionComposer({ pending, dispatch }) {
  const v = BY_ID[pending.varId];
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (text.trim() === '' || sending) return;
    setSending(true);
    await submitAnswerText(dispatch, v, text);
    setSending(false);
    setText('');
  };

  return (
    <div className="space-y-2">
      {v.type === 'select' && (
        <div className="flex flex-wrap gap-2">
          {v.options.map((o) => (
            <button key={o.value}
              onClick={() => dispatch({ type: 'ANSWER', varId: v.id, value: o.value, display: o.label })}
              className="rounded-full border-2 border-[#4F8CFF]/30 bg-[#4F8CFF]/5 px-3.5 py-2 text-sm font-bold text-[#3B7BEA] transition hover:bg-[#4F8CFF]/10 active:scale-95">
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text" inputMode="text"
            placeholder={v.type === 'select' ? '或直接打字回答…' : (v.displayMean != null ? `输入数值（参考 ${v.displayMean}）或直接描述` : '输入数值或直接描述…')}
            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 outline-none transition focus:border-[#4F8CFF] focus:bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          {v.unit && v.type !== 'select' && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{v.unit}</span>
          )}
        </div>
        <SkipBtn onClick={() => dispatch({ type: 'SKIP', varId: v.id })} disabled={sending} />
        <SendBtn onClick={send} disabled={text.trim() === '' || sending} busy={sending} />
      </div>
    </div>
  );
}

function SportComposer({ dispatch }) {
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const met = computeSportMet(high, low);
  const box = 'w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-3 py-3 text-base font-medium text-slate-700 outline-none transition focus:border-[#4F8CFF] focus:bg-white';
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input type="number" inputMode="decimal" placeholder="高强度" className={box} value={high} min={0}
            onChange={(e) => setHigh(e.target.value)} onWheel={(e) => e.target.blur()} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">小时/周</span>
        </div>
        <div className="relative">
          <input type="number" inputMode="decimal" placeholder="低强度" className={box} value={low} min={0}
            onChange={(e) => setLow(e.target.value)} onWheel={(e) => e.target.blur()} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">小时/周</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="flex flex-1 items-center gap-1.5 rounded-xl bg-[#4F8CFF]/5 px-3 py-2 text-xs font-medium text-[#3B7BEA]">
          <Sparkles size={13} />
          {met != null ? `自动换算 ≈ ${met.toFixed(1)} MET·h/周` : '高 / 低强度任填一项，自动换算'}
        </p>
        <SkipBtn onClick={() => dispatch({ type: 'SKIP', varId: 'sport_total' })} />
        <button onClick={() => dispatch({ type: 'SPORT', high, low })} disabled={met == null}
          className="btn-sheen rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/30 transition active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' }}>
          完成
        </button>
      </div>
    </div>
  );
}

function ChoiceComposer({ pending, dispatch }) {
  const single = pending.options.length === 1;
  return (
    <div className="flex flex-col gap-2">
      {pending.options.map((o) => {
        const primary = single || o.id === 'next';
        return (
          <button key={o.id} onClick={() => dispatch({ type: 'CHOICE', id: o.id })}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
              primary ? 'btn-sheen text-white shadow-float' : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-[#4F8CFF]/40 hover:text-[#3B7BEA]'}`}
            style={primary ? { background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' } : undefined}>
            {o.label} <ChevronRight size={16} />
          </button>
        );
      })}
    </div>
  );
}

// 报告后：继续补充下一层指标 + 自由问答（流式 RAG）+ 重新评估
function PostReport({ state, dispatch }) {
  const [text, setText] = useState('');
  const canRefine = state.currentLayer < 3;   // 还有更精细的指标可以补充
  const send = () => {
    if (text.trim() === '' || state.busy) return;
    askQuestion(dispatch, state.report, text.trim());
    setText('');
  };
  return (
    <div className="space-y-2.5">
      {/* 继续补充下一层指标——报告之后仍能回到问诊，让评估更准 */}
      {canRefine && (
        <button onClick={() => dispatch({ type: 'CHOICE', id: 'next' })} disabled={state.busy}
          className="btn-sheen flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-float transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#22D3EE,#4F8CFF)' }}>
          <PlusCircle size={17} /> 继续补充「{layerTitle(state.currentLayer + 1)}」让评估更准
        </button>
      )}
      <div className="flex items-center gap-2">
        <input type="text" placeholder={state.busy ? 'AI 正在回答…' : '还有什么健康问题想问我？'}
          className="w-full flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 outline-none transition focus:border-[#4F8CFF] focus:bg-white disabled:opacity-60"
          value={text} disabled={state.busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} />
        <SendBtn onClick={send} disabled={text.trim() === '' || state.busy} busy={state.busy} />
      </div>
      <button onClick={() => dispatch({ type: 'RESET' })} disabled={state.busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
        <RotateCcw size={13} /> 重新评估
      </button>
    </div>
  );
}

export default function Composer() {
  const { state, dispatch } = useStore();
  const p = state.pending;
  if (!p) return null;
  return (
    <div className="safe-b shrink-0 border-t border-slate-200/70 bg-white/90 px-4 pt-3 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl">
        {p.type === 'number' && <QuestionComposer key={p.varId} pending={p} dispatch={dispatch} />}
        {p.type === 'select' && <QuestionComposer key={p.varId} pending={p} dispatch={dispatch} />}
        {p.type === 'sport' && <SportComposer key={p.varId} dispatch={dispatch} />}
        {p.type === 'choice' && <ChoiceComposer pending={p} dispatch={dispatch} />}
        {p.type === 'postreport' && <PostReport state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
