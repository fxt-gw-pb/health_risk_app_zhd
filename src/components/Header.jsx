// src/components/Header.jsx
import { Check } from 'lucide-react';
import Logo from './Logo';

export default function Header({ screen, currentLayer, onHome, onStart }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <button onClick={onHome} className="flex items-center gap-2.5">
          <Logo size={36} />
          <div className="text-left leading-tight">
            <div className="text-[15px] font-black tracking-tight grad-text">多结局慢性病风险预测</div>
            <div className="text-[10px] font-medium text-slate-400">房山家系队列 · Cox 风险模型</div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {screen !== 'landing' && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {[1, 2, 3].map((l) => (
                <span
                  key={l}
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors ${
                    l < currentLayer
                      ? 'bg-emerald-100 text-emerald-600'
                      : l === currentLayer
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {l < currentLayer ? <Check size={14} strokeWidth={3} /> : l}
                </span>
              ))}
            </div>
          )}
          {screen === 'landing' ? (
            <button onClick={onStart} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
              开始评估
            </button>
          ) : (
            <button onClick={onHome} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
              首页
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
