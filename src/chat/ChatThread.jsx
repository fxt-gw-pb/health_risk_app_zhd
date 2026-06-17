// src/chat/ChatThread.jsx
import { useEffect, useRef } from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { useStore } from '../app/store';
import MessageBubble, { AiAvatar } from './MessageBubble';
import LayerSummaryCard from './LayerSummaryCard';
import FormattedText from './FormattedText';
import HealthReport from '../report/HealthReport';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5">
      {[0, 160, 320].map((d) => (
        <i key={d} className="h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: `${d}ms`, background: 'linear-gradient(135deg,#22D3EE,#4F8CFF)' }} />
      ))}
    </span>
  );
}

function SourcesList({ items }) {
  const seen = new Set();
  const uniq = items.filter((s) => (seen.has(s.title) ? false : (seen.add(s.title), true)));
  return (
    <div className="mt-2.5 border-t border-slate-100 pt-2">
      <div className="mb-1 text-[10px] font-bold text-slate-400">参考来源</div>
      <div className="flex flex-col gap-1">
        {uniq.map((s, i) => {
          const ext = s.url && !s.url.startsWith('internal:');
          const inner = (
            <span className="flex items-start gap-1 text-[11px] leading-snug text-slate-500">
              <span className="text-[#4F8CFF]">[{i + 1}]</span>
              <span>{s.title}{s.year ? `（${s.year}）` : ''}</span>
            </span>
          );
          return ext
            ? <a key={i} href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{inner}</a>
            : <div key={i}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

function AiStreamMessage({ msg }) {
  const empty = !msg.text && msg.streaming;
  return (
    <div className="msg-in flex items-end gap-2">
      <AiAvatar pulse={msg.streaming} />
      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] text-slate-700 shadow-premium ring-1 ring-slate-100/80">
        {empty ? <TypingDots /> : <FormattedText text={msg.text} />}
        {msg.streaming && msg.text ? <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#4F8CFF] align-middle" /> : null}
        {msg.sources?.length ? <SourcesList items={msg.sources} /> : null}
      </div>
    </div>
  );
}

// 答题确认条：把刚纳入模型的取值轻量回显（口语化输入被 AI 理解后尤其有用）
function ConfirmChip({ text }) {
  return (
    <div className="msg-in flex justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-600 ring-1 ring-emerald-100">
        <Check size={12} strokeWidth={3} /> {text}
      </span>
    </div>
  );
}

// 确定性「为什么」回退消息（后端不可用时仍可用）
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
              <span className="leading-relaxed text-slate-600"><b className="text-slate-800">{f.label}</b>{f.note ? ` —— ${f.note}` : ''}</span>
            </div>
          ))}
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-500">{msg.advice}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatThread() {
  const { state } = useStore();
  const bottomRef = useRef(null);
  const last = state.messages[state.messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.messages.length, last?.text]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-5">
      {state.messages.map((m) => {
        if (m.kind === 'answer') return <MessageBubble key={m.id} role="user" text={m.text} muted={m.muted} />;
        if (m.kind === 'confirm') return <ConfirmChip key={m.id} text={m.text} />;
        if (m.kind === 'layer_summary') return <LayerSummaryCard key={m.id} layer={m.layer} text={m.text} />;
        if (m.kind === 'ai_stream') return <AiStreamMessage key={m.id} msg={m} />;
        if (m.kind === 'why') return <WhyMessage key={m.id} msg={m} />;
        if (m.kind === 'report') return <HealthReport key={m.id} report={m.report} />;
        return <MessageBubble key={m.id} role={m.role} text={m.text} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
