// src/chat/MessageBubble.jsx

// 品牌 Logo（智评慢病：蓝青心形＋脉冲）。放在 public/，用 BASE_URL 适配 Pages 子路径。
const LOGO = import.meta.env.BASE_URL + 'logo.png';

// AI 头像：白底圆形承载品牌 Logo +（可选）在线脉冲环。
// pulse=true 时外环呼吸扩散，用于「AI 正在思考 / 输出」状态。
export function AiAvatar({ size = 32, pulse = false }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {pulse && <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-pulse-ring" />}
      <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80 shadow-md shadow-cyan-500/20">
        <img src={LOGO} alt="智评慢病" className="h-[80%] w-[80%] object-contain" />
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
