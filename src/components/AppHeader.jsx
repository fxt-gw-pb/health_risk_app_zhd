// src/components/AppHeader.jsx
import { Check, RotateCcw } from 'lucide-react';
import { useStore } from '../app/store';
import { AiAvatar } from '../chat/MessageBubble';

export default function AppHeader() {
  const { state, dispatch } = useStore();
  const showReset = state.messages.length > 0;
  return (
    <header className="glass shrink-0 border-b border-white/50">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          {/* 医疗主题头像：AI 输出时呼吸脉冲 */}
          <AiAvatar size={32} pulse={state.busy} />
          <div className="leading-tight">
            <div className="text-[14px] font-black tracking-tight text-slate-800">健康风险助手</div>
            <div className="text-[10px] font-medium text-slate-400">慢病风险 · 生活方式</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 三层进度：当前层青→蓝渐变 + 放大，已完成层打勾，带连接线 */}
          <div className="flex items-center">
            {[1, 2, 3].map((l, i) => (
              <span key={l} className="flex items-center">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                  l < state.currentLayer ? 'bg-emerald-100 text-emerald-600'
                    : l === state.currentLayer ? 'scale-110 text-white shadow-sm shadow-blue-400/50'
                      : 'bg-slate-100 text-slate-400'}`}
                  style={l === state.currentLayer ? { background: 'linear-gradient(135deg,#22D3EE,#4F8CFF)' } : undefined}>
                  {l < state.currentLayer ? <Check size={12} strokeWidth={3} /> : l}
                </span>
                {i < 2 && <span className={`mx-1 h-px w-3 rounded-full transition-colors ${l < state.currentLayer ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </span>
            ))}
          </div>
          {showReset && (
            <button onClick={() => dispatch({ type: 'RESET' })} title="重新开始"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-90">
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
