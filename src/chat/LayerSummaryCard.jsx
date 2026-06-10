// src/chat/LayerSummaryCard.jsx
import { Lightbulb } from 'lucide-react';
import { layerTitle } from '../intake/questionFlow';
import { AiAvatar } from './MessageBubble';

export default function LayerSummaryCard({ layer, text }) {
  return (
    <div className="msg-in flex items-end gap-2">
      <AiAvatar />
      <div className="max-w-[88%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-blue-100">
        <div className="flex items-center gap-1.5 border-b border-blue-50 bg-blue-50/60 px-4 py-2 text-xs font-bold text-[#3B7BEA]">
          <Lightbulb size={13} /> 阶段小结 · {layerTitle(layer)}
        </div>
        <p className="px-4 py-3 text-[15px] leading-relaxed text-slate-700">{text}</p>
      </div>
    </div>
  );
}
