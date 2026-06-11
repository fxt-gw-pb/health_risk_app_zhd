// src/chat/LayerSummaryCard.jsx
import { Lightbulb } from 'lucide-react';
import { layerTitle } from '../intake/questionFlow';
import { AiAvatar } from './MessageBubble';

export default function LayerSummaryCard({ layer, text }) {
  return (
    <div className="msg-in flex items-end gap-2">
      <AiAvatar />
      <div className="max-w-[88%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-premium ring-1 ring-slate-100/80">
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(120deg,#22D3EE,#4F8CFF)' }}>
          <Lightbulb size={13} /> 阶段小结 · {layerTitle(layer)}
        </div>
        <p className="px-4 py-3 text-[15px] leading-relaxed text-slate-700">{text}</p>
      </div>
    </div>
  );
}
