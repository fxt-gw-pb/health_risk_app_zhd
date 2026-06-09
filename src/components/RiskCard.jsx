// src/components/RiskCard.jsx
import { AlertTriangle, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { ACCENT, OUTCOME_UI, levelMeta } from '../lib/uiTokens';
import RiskBar from './RiskBar';

export default function RiskCard({ outcome, result, excluded, exclusionReason, selected, onSelect }) {
  const ui = OUTCOME_UI[outcome.id];
  const ac = ACCENT[ui.accent];
  const lm = levelMeta(result.level);
  const OutcomeIcon = outcome.icon;

  return (
    <button
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-3xl border-2 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
        selected ? `${ac.border} ring-4 ${ac.ring}` : 'border-slate-100'
      }`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 opacity-[0.06] ${ac.text}`}><OutcomeIcon size={120} /></div>

      <div className="relative flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${ac.grad} text-white shadow-lg`}><OutcomeIcon size={22} /></span>
        <div>
          <div className="text-[15px] font-black text-slate-800">{ui.short}</div>
          <div className="whitespace-nowrap text-[11px] font-medium text-slate-400">未来 {outcome.predictionYears} 年新发风险</div>
        </div>
      </div>

      {excluded ? (
        <div className="relative mt-5">
          <div className="flex items-center gap-2">
            {exclusionReason === 'self_report' ? <Info size={18} className="text-slate-400" /> : <AlertTriangle size={18} className="text-amber-500" />}
            <span className={`text-lg font-black ${exclusionReason === 'self_report' ? 'text-slate-500' : 'text-amber-600'}`}>
              {exclusionReason === 'self_report' ? '已诊断' : '疑似已患'}
            </span>
          </div>
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium leading-relaxed text-slate-500">新发风险预测不适用，详见下方说明。</p>
        </div>
      ) : (
        <div className="relative mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div className={`tnum text-5xl font-black tracking-tight ${lm.text}`}>{result.value}<span className="text-2xl">%</span></div>
            <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${lm.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${lm.dot}`} />{result.level}
            </span>
          </div>
          <RiskBar percent={parseFloat(result.value)} level={result.level} />
        </div>
      )}

      <div className={`relative mt-4 flex items-center justify-center gap-1 text-xs font-bold transition ${selected ? ac.text : 'text-slate-400 group-hover:text-slate-600'}`}>
        {selected ? '正在查看详情' : '查看详情'} {selected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
    </button>
  );
}
