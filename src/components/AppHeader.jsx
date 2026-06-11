// src/components/AppHeader.jsx
import { Sparkles, Check, RotateCcw } from 'lucide-react';
import { useStore } from '../app/store';

export default function AppHeader() {
  const { state, dispatch } = useStore();
  const showReset = state.messages.length > 0;
  return (
    <header className="shrink-0 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full text-white shadow-sm" style={{ background: 'linear-gradient(135deg,#4F8CFF,#7DD3FC)' }}>
            <Sparkles size={16} />
          </span>
          <div className="leading-tight">
            <div className="text-[14px] font-black text-slate-800">健康风险助手</div>
            <div className="text-[10px] text-slate-400">慢病风险 · 生活方式</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((l) => (
              <span key={l} className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold transition ${
                l < state.currentLayer ? 'bg-emerald-100 text-emerald-600'
                  : l === state.currentLayer ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
                style={l === state.currentLayer ? { background: '#4F8CFF' } : undefined}>
                {l < state.currentLayer ? <Check size={12} strokeWidth={3} /> : l}
              </span>
            ))}
          </div>
          {showReset && (
            <button onClick={() => dispatch({ type: 'RESET' })} title="重新开始"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
