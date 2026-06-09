// src/components/Stepper.jsx
import { Check } from 'lucide-react';
import { STEP_META } from '../lib/uiTokens';

export default function Stepper({ current, maxReached, onJump }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-1">
        {STEP_META.map((s) => {
          const done = s.n < current;
          const active = s.n === current;
          const reachable = s.n <= maxReached;
          return (
            <button
              key={s.n}
              disabled={!reachable}
              onClick={() => reachable && onJump(s.n)}
              className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : done
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : reachable
                      ? 'text-slate-500 hover:bg-slate-50'
                      : 'cursor-not-allowed text-slate-300'
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                  active ? 'bg-white/20 text-white' : done ? 'bg-emerald-500 text-white' : reachable ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-300'
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : s.n}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{s.title}</span>
                <span className={`hidden truncate text-[11px] leading-tight sm:block ${active ? 'text-blue-50/80' : 'opacity-70'}`}>{s.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
