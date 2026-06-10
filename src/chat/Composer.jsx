// src/chat/Composer.jsx
import { useState } from 'react';
import { Send, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useStore } from '../app/store';
import { validateInput, computeSportMet } from '../kernel';
import { BY_ID } from '../intake/questionFlow';

function SkipBtn({ onClick }) {
  return (
    <button onClick={onClick} className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600">
      跳过
    </button>
  );
}

function NumberComposer({ pending, dispatch }) {
  const v = BY_ID[pending.varId];
  const [val, setVal] = useState('');
  const [err, setErr] = useState(null);

  const send = () => {
    if (val === '') return;
    const e = validateInput(v, val);
    if (e) { setErr(e); return; }
    dispatch({ type: 'ANSWER', varId: pending.varId, value: val, display: `${val}${pending.unit || ''}` });
  };

  return (
    <div>
      {err && <p className="mb-1.5 px-1 text-xs font-medium text-rose-500">{err}</p>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number" inputMode="decimal" autoFocus
            placeholder={pending.displayMean != null ? `参考均值 ${pending.displayMean}` : '请输入数值'}
            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-700 outline-none transition focus:border-[#4F8CFF] focus:bg-white"
            value={val}
            onChange={(e) => { setVal(e.target.value); setErr(null); }}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            onWheel={(e) => e.target.blur()}
          />
          {pending.unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{pending.unit}</span>}
        </div>
        <SkipBtn onClick={() => dispatch({ type: 'SKIP', varId: pending.varId })} />
        <button onClick={send} disabled={val === ''}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md transition active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function SelectComposer({ pending, dispatch }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending.options.map((o) => (
        <button key={o.value}
          onClick={() => dispatch({ type: 'ANSWER', varId: pending.varId, value: o.value, display: o.label })}
          className="rounded-full border-2 border-[#4F8CFF]/30 bg-[#4F8CFF]/5 px-4 py-2.5 text-sm font-bold text-[#3B7BEA] transition hover:bg-[#4F8CFF]/10 active:scale-95">
          {o.label}
        </button>
      ))}
      <SkipBtn onClick={() => dispatch({ type: 'SKIP', varId: pending.varId })} />
    </div>
  );
}

function SportComposer({ dispatch }) {
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const met = computeSportMet(high, low);
  const box = 'w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-3 py-3 text-[15px] font-medium text-slate-700 outline-none transition focus:border-[#4F8CFF] focus:bg-white';
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input type="number" inputMode="decimal" placeholder="高强度" className={box} value={high}
            min={0} onChange={(e) => setHigh(e.target.value)} onWheel={(e) => e.target.blur()} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">小时/周</span>
        </div>
        <div className="relative">
          <input type="number" inputMode="decimal" placeholder="低强度" className={box} value={low}
            min={0} onChange={(e) => setLow(e.target.value)} onWheel={(e) => e.target.blur()} />
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
          className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40"
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
        // 主操作（filled）：唯一选项，或「继续补充」；次操作（outline）：并列时的「看报告」
        const primary = single || o.id === 'next';
        return (
          <button key={o.id} onClick={() => dispatch({ type: 'CHOICE', id: o.id })}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
              primary ? 'text-white shadow-md' : 'border-2 border-slate-200 text-slate-600'}`}
            style={primary ? { background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' } : undefined}>
            {o.label} <ChevronRight size={16} />
          </button>
        );
      })}
    </div>
  );
}

function PostReport({ dispatch }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs leading-snug text-slate-400">想知道「为什么会这样」？点报告里的按钮即可。AI 自由问答将在下一步接入。</p>
      <button onClick={() => dispatch({ type: 'RESET' })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
        <RotateCcw size={14} /> 重新评估
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
        {p.type === 'number' && <NumberComposer key={p.varId} pending={p} dispatch={dispatch} />}
        {p.type === 'select' && <SelectComposer key={p.varId} pending={p} dispatch={dispatch} />}
        {p.type === 'sport' && <SportComposer key={p.varId} dispatch={dispatch} />}
        {p.type === 'choice' && <ChoiceComposer pending={p} dispatch={dispatch} />}
        {p.type === 'postreport' && <PostReport dispatch={dispatch} />}
      </div>
    </div>
  );
}
