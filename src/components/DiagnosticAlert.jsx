// src/components/DiagnosticAlert.jsx
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function DiagnosticAlert({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-amber-200 bg-amber-50">
      <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-100/60 px-5 py-3 text-sm font-black text-amber-800">
        <ShieldAlert size={18} /> 检测到以下指标达到诊断标准
      </div>
      <div className="space-y-2 p-5">
        {alerts.map((a, i) => (
          <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-black text-amber-800">{a.name}</span>
            {a.triggeredBy.map((t, j) => (
              <span key={j} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">{t}</span>
            ))}
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
              <ArrowRight size={12} /> 建议前往{a.department}就诊
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
