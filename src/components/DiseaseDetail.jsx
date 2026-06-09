// src/components/DiseaseDetail.jsx
import { AlertTriangle, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { ACCENT, OUTCOME_UI, levelMeta } from '../lib/uiTokens';
import { MODEL_META } from '../riskConfig';
import { usedCount } from '../utils/formatters';
import RiskBar from './RiskBar';
import HealthAdviceCard from './HealthAdviceCard';
import ModelTransparencyPanel from './ModelTransparencyPanel';

export default function DiseaseDetail({ outcome, result, currentLayer, excluded, exclusionReason }) {
  const ui = OUTCOME_UI[outcome.id];
  const ac = ACCENT[ui.accent];
  const OutcomeIcon = outcome.icon;
  const lm = levelMeta(result.level);
  const LevelIcon = result.level === '高危' ? AlertTriangle : result.level === '中危' ? Activity : CheckCircle;

  return (
    <div className="space-y-5 anim-fade-up">
      {/* 详情头部 */}
      <div className={`relative overflow-hidden rounded-3xl border ${ac.border} ${ac.soft} p-7`}>
        <div className={`pointer-events-none absolute -right-8 -top-8 opacity-10 ${ac.text}`}><OutcomeIcon size={170} /></div>
        <div className="relative">
          <div className={`text-xs font-black uppercase tracking-widest ${ac.text} opacity-80`}>{outcome.predictionYears} 年{outcome.name}预测</div>

          {excluded ? (
            exclusionReason === 'self_report' ? (
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-500">已诊断</div>
                <p className="mt-2 max-w-md text-sm text-slate-500">您已确诊{ui.short}，新发风险预测不适用，请关注其他结局的评估结果。</p>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-2"><AlertTriangle size={24} className="text-amber-500" /><span className="text-2xl font-black text-amber-600">疑似已患</span></div>
                <p className="mt-3 text-sm font-medium text-slate-600">您的以下指标已达到 <strong>{exclusionReason.name}</strong> 诊断标准：</p>
                <ul className="mt-2 space-y-1">
                  {exclusionReason.triggeredBy.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-bold text-rose-600"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{t}</li>
                  ))}
                </ul>
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-700">{exclusionReason.message}</p>
              </div>
            )
          ) : (
            <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
              <div className={`tnum text-6xl font-black tracking-tighter ${lm.text}`}>{result.value}<span className="text-3xl">%</span></div>
              <div className="mb-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold shadow-sm ${lm.chip}`}>
                  <LevelIcon size={15} />{result.level}风险
                </span>
                <div className="mt-1.5 text-[11px] text-slate-500">基于第 {currentLayer} 层 · 共 {usedCount(currentLayer)} 项指标</div>
              </div>
            </div>
          )}
          {!excluded && <div className="mt-4"><RiskBar percent={parseFloat(result.value)} level={result.level} /></div>}
        </div>
      </div>

      {!excluded && <HealthAdviceCard advice={result.advice} />}
      {!excluded && <ModelTransparencyPanel outcome={outcome} result={result} currentLayer={currentLayer} />}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/70 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-amber-700">
          本工具基于{MODEL_META.cohortName} Cox 比例风险模型，仅供健康风险参考，<strong>不替代临床诊断</strong>。如有不适请及时就医。
        </p>
      </div>
    </div>
  );
}
