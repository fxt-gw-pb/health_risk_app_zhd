// src/components/HealthAdviceCard.jsx
import { Sparkles } from 'lucide-react';

export default function HealthAdviceCard({ advice }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-base font-black text-slate-800">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Sparkles size={16} /></span>
        健康建议
      </h4>
      <p className="text-[15px] leading-relaxed text-slate-600">{advice}</p>
    </div>
  );
}
