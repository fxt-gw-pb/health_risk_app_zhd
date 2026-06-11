// src/chat/MessageBubble.jsx
import { HeartPulse } from 'lucide-react';

// 医疗 / 健康主题的 AI 头像：青→蓝渐变徽章 + 心率脉冲符号 +（可选）在线脉冲环。
// pulse=true 时外环呼吸扩散，用于「AI 正在思考 / 输出」状态。
export function AiAvatar({ size = 32, pulse = false }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {pulse && <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-pulse-ring" />}
      <span
        className="relative grid h-full w-full place-items-center rounded-full text-white ring-1 ring-white/50 shadow-md shadow-cyan-500/30"
        style={{ background: 'linear-gradient(135deg,#22D3EE 0%,#38BDF8 45%,#4F8CFF 100%)' }}
      >
        <HeartPulse size={Math.round(size * 0.52)} strokeWidth={2.4} />
      </span>
    </span>
  );
}

export default function MessageBubble({ role, text, muted }) {
  if (role === 'user') {
    return (
      <div className="msg-in flex justify-end">
        <div
          className={`max-w-[82%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] font-medium leading-relaxed ${
            muted ? 'bg-slate-100 text-slate-400' : 'text-white shadow-float'
          }`}
          style={muted ? undefined : { background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' }}
        >
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="msg-in flex items-end gap-2">
      <AiAvatar />
      <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] leading-relaxed text-slate-700 shadow-premium ring-1 ring-slate-100/80">
        {text}
      </div>
    </div>
  );
}
