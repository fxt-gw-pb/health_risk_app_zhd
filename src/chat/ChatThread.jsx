// src/chat/ChatThread.jsx
import { useEffect, useRef } from 'react';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../app/store';
import MessageBubble, { AiAvatar } from './MessageBubble';
import LayerSummaryCard from './LayerSummaryCard';
import HealthReport from '../report/HealthReport';

function WhyMessage({ msg }) {
  return (
    <div className="msg-in flex items-end gap-2">
      <AiAvatar />
      <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2 text-xs font-bold text-[#3B7BEA]">
          <HelpCircle size={13} /> {msg.title}
        </div>
        <div className="space-y-2.5 px-4 py-3">
          {msg.factors.map((f, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className={`mt-0.5 ${f.dir === 'up' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {f.dir === 'up' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              </span>
              <span className="leading-relaxed text-slate-600">
                <b className="text-slate-800">{f.label}</b>
                {f.note ? ` —— ${f.note}` : ''}
              </span>
            </div>
          ))}
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-500">{msg.advice}</p>
          <p className="text-[11px] text-slate-400">接入知识库后，这里会给出更详细的循证科普与来源引用。</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatThread() {
  const { state } = useStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.messages.length]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-5">
      {state.messages.map((m) => {
        if (m.kind === 'answer') return <MessageBubble key={m.id} role="user" text={m.text} muted={m.muted} />;
        if (m.kind === 'layer_summary') return <LayerSummaryCard key={m.id} layer={m.layer} text={m.text} />;
        if (m.kind === 'why') return <WhyMessage key={m.id} msg={m} />;
        if (m.kind === 'report') return <HealthReport key={m.id} />;
        return <MessageBubble key={m.id} role={m.role} text={m.text} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
