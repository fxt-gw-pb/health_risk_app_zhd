// src/chat/MessageBubble.jsx
import { Sparkles } from 'lucide-react';

export function AiAvatar({ size = 30 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-white shadow-sm"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#4F8CFF,#7DD3FC)' }}
    >
      <Sparkles size={size * 0.5} />
    </span>
  );
}

export default function MessageBubble({ role, text, muted }) {
  if (role === 'user') {
    return (
      <div className="msg-in flex justify-end">
        <div
          className={`max-w-[82%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] font-medium leading-relaxed shadow-sm ${
            muted ? 'bg-slate-100 text-slate-400' : 'text-white'
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
      <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-100">
        {text}
      </div>
    </div>
  );
}
