// src/components/RiskDashboard.jsx
import { Pencil, Plus, CheckCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { OUTCOMES, getExclusionReason } from '../lib/riskEngine';
import { ACCENT, OUTCOME_UI, STEP_META } from '../lib/uiTokens';
import { usedCount } from '../utils/formatters';
import RiskCard from './RiskCard';
import DiagnosticAlert from './DiagnosticAlert';
import DiseaseDetail from './DiseaseDetail';

export default function RiskDashboard({
  results, currentLayer, inputs, diagnosticAlerts,
  activeOutcome, setActiveOutcome, onNextLayer, onReset, onEdit,
}) {
  const outcomeList = Object.values(OUTCOMES);
  const active = OUTCOMES[activeOutcome];
  const activeUi = OUTCOME_UI[active.id];
  const activeResult = results[activeOutcome];
  const activeExclReason = getExclusionReason(active, inputs, diagnosticAlerts);
  const ActiveIcon = active.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 anim-fade-up">
      {/* 状态条 */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">当前评估层级</div>
            <div className="text-base font-black text-slate-800">第 {currentLayer} 层 · {STEP_META[currentLayer - 1].title}</div>
          </div>
          <div className="h-9 w-px bg-slate-100" />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">已使用指标</div>
            <div className="tnum text-base font-black text-slate-800">{usedCount(currentLayer)} 项</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <Pencil size={15} /> 修改第 {currentLayer} 层
          </button>
          {currentLayer < 3 ? (
            <button onClick={onNextLayer} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl active:scale-95">
              <Plus size={15} /> 继续补充检查指标
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600"><CheckCircle size={15} /> 已完成全部三层</span>
          )}
          <button onClick={onReset} title="清空数据重新评估" className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500">
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <DiagnosticAlert alerts={diagnosticAlerts} />

      {/* 三张风险卡片 */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-800"><LayoutDashboard size={20} className="text-blue-500" /> 三种结局风险概览</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {outcomeList.map((o) => {
            const reason = getExclusionReason(o, inputs, diagnosticAlerts);
            return (
              <RiskCard
                key={o.id}
                outcome={o}
                result={results[o.id]}
                excluded={reason !== null}
                exclusionReason={reason}
                selected={activeOutcome === o.id}
                onSelect={() => setActiveOutcome(o.id)}
              />
            );
          })}
        </div>
      </div>

      {/* 选中结局的详情 */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-800">
          <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${ACCENT[activeUi.accent].grad} text-white`}><ActiveIcon size={15} /></span>
          {activeUi.short} · 详细解读
        </h2>
        <DiseaseDetail outcome={active} result={activeResult} currentLayer={currentLayer} excluded={activeExclReason !== null} exclusionReason={activeExclReason} />
      </div>

      <p className="pt-2 text-center text-[11px] text-slate-400">点击上方任意卡片可切换查看对应疾病的详细解读</p>
    </div>
  );
}
