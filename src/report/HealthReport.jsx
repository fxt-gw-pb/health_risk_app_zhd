// src/report/HealthReport.jsx
// chat 线程内嵌的 Health Report：一句话总结 + 三疾病卡片 + 为什么 + Top5 + 透明度。
// 全部数据来自内核（store.report = buildReport(...)），本组件不做任何计算。
import { useState } from 'react';
import {
  FileText, AlertTriangle, Info, HelpCircle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, FlaskConical, ShieldAlert,
} from 'lucide-react';
import { useStore } from '../app/store';
import { askWhy } from '../copilot/orchestrate';
import { OUTCOMES, MODEL_META } from '../kernel';
import { ACCENT, OUTCOME_UI, levelMeta } from '../lib/uiTokens';
import RiskBar from '../components/RiskBar';

const OIDS = ['t2d', 'cvd', 'ht'];

function MiniRiskCard({ oid, result, exclusion, selected, onSelect }) {
  const ui = OUTCOME_UI[oid];
  const ac = ACCENT[ui.accent];
  const Icon = OUTCOMES[oid].icon;
  const excluded = exclusion != null;
  const lm = levelMeta(result.level);
  return (
    <button onClick={onSelect}
      className={`flex flex-col items-start rounded-2xl border-2 bg-white p-3 text-left transition active:scale-[0.98] ${
        selected ? `${ac.border} ring-2 ${ac.ring}` : 'border-slate-100'}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${ac.grad} text-white`}><Icon size={16} /></span>
      <span className="mt-2 text-[13px] font-bold text-slate-700">{ui.short}</span>
      {excluded ? (
        <span className={`mt-1 text-sm font-black ${exclusion === 'self_report' ? 'text-slate-400' : 'text-amber-600'}`}>
          {exclusion === 'self_report' ? '已诊断' : '疑似已患'}
        </span>
      ) : (
        <>
          <span className={`tnum mt-0.5 text-2xl font-black ${lm.text}`}>{result.value}<span className="text-sm">%</span></span>
          <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${lm.chip}`}>{result.level}</span>
        </>
      )}
    </button>
  );
}

function ContributionChart({ contributions }) {
  const sorted = [...contributions].filter((c) => !c.skipped).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 5);
  const max = Math.max(...sorted.map((c) => Math.abs(c.contribution)), 0.01);
  if (sorted.length === 0) return <p className="text-xs text-slate-400">当前各指标均接近人群均值，贡献度接近 0。</p>;
  return (
    <div className="space-y-2.5">
      {sorted.map((c) => {
        const pos = c.contribution >= 0;
        const pct = (Math.abs(c.contribution) / max) * 100;
        return (
          <div key={c.id} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-right text-xs font-medium text-slate-500">{c.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pos ? 'linear-gradient(90deg,#fda4af,#f43f5e)' : 'linear-gradient(90deg,#6ee7b7,#10b981)' }} />
            </div>
            <span className={`tnum w-7 shrink-0 text-right text-xs font-bold ${pos ? 'text-rose-500' : 'text-emerald-500'}`}>{pos ? <TrendingUp size={13} className="inline" /> : <TrendingDown size={13} className="inline" />}</span>
          </div>
        );
      })}
      <p className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />升高风险</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />降低风险</span>
      </p>
    </div>
  );
}

function Transparency({ oid, result, layer }) {
  const [open, setOpen] = useState(false);
  const o = OUTCOMES[oid];
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-50">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-600">
        <span className="flex items-center gap-2"><FlaskConical size={15} className="text-indigo-400" /> 模型透明度</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div>
            <div className="mb-1.5 text-[11px] font-bold text-slate-400">判别力 C-index（逐层）</div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((t) => (
                <div key={t} className={`rounded-xl p-2 text-center ${t === layer ? 'bg-[#4F8CFF]/10 ring-1 ring-[#4F8CFF]/30' : 'bg-white'}`}>
                  <div className="text-[10px] text-slate-400">第 {t} 层</div>
                  <div className={`tnum text-sm font-black ${t === layer ? 'text-[#3B7BEA]' : 'text-slate-600'}`}>{o.cIndex[t].toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            <div>Risk({o.predictionYears}y) = 1 − S₀^exp(LP)</div>
            <div className="text-slate-400">S₀ = <span className="text-cyan-300">{result.baselineSurv?.toFixed(6)}</span></div>
            <div className="text-slate-400">LP = <span className="text-cyan-300">{result.linearPredictor?.toFixed(4)}</span></div>
          </div>
          <p className="text-[11px] text-slate-400">{MODEL_META.cohortName} · 随访 {MODEL_META.followUpYears} · N={o.sampleSize.toLocaleString()} / 事件 {o.events}</p>
        </div>
      )}
    </div>
  );
}

export default function HealthReport() {
  const { state, dispatch } = useStore();
  const report = state.report;
  const firstSelectable = report.primary || OIDS.find((o) => !report.exclusions[o]) || 't2d';
  const [sel, setSel] = useState(firstSelectable);
  const ui = OUTCOME_UI[sel];
  const ac = ACCENT[sel === report.primary ? ui.accent : ui.accent];
  const result = report.results[sel];
  const exclusion = report.exclusions[sel];

  return (
    <div className="msg-in overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100">
      {/* 一句话总结 */}
      <div className="px-5 py-5 text-white" style={{ background: 'linear-gradient(135deg,#4F8CFF,#7DD3FC)' }}>
        <div className="flex items-center gap-1.5 text-xs font-bold opacity-90"><FileText size={14} /> 你的健康风险报告</div>
        <p className="mt-2 text-[17px] font-black leading-snug">{report.summary}</p>
      </div>

      <div className="space-y-5 p-4">
        {/* 诊断提示 */}
        {report.alerts.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700"><AlertTriangle size={15} /> 就医提醒</div>
            {report.alerts.map((a) => (
              <p key={a.condition} className="mt-1.5 text-[13px] leading-relaxed text-amber-700">{a.message}</p>
            ))}
          </div>
        )}

        {/* 三疾病卡片 */}
        <div className="grid grid-cols-3 gap-2">
          {OIDS.map((oid) => (
            <MiniRiskCard key={oid} oid={oid} result={report.results[oid]} exclusion={report.exclusions[oid]}
              selected={sel === oid} onSelect={() => setSel(oid)} />
          ))}
        </div>

        {/* 选中结局详情 */}
        <div className={`rounded-2xl border ${ac.border} ${ac.soft} p-4`}>
          <div className="text-xs font-black uppercase tracking-wide opacity-70" style={{ color: '#3B7BEA' }}>
            {OUTCOMES[sel].predictionYears} 年{OUTCOMES[sel].name}
          </div>
          {exclusion ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {exclusion === 'self_report'
                ? `您已确诊${ui.short}，新发风险预测不适用，请关注其他结局并遵医嘱管理。`
                : `您的部分指标已达${ui.short}诊断标准，建议尽快就医确认。`}
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-end gap-3">
                <div className={`tnum text-4xl font-black ${levelMeta(result.level).text}`}>{result.value}<span className="text-xl">%</span></div>
                <span className={`mb-1.5 rounded-full px-3 py-1 text-xs font-bold ${levelMeta(result.level).chip}`}>{result.level}风险</span>
              </div>
              <div className="mt-3"><RiskBar percent={result.valueNum} level={result.level} /></div>
              <p className="mt-3 rounded-xl bg-white/70 p-3 text-[13px] leading-relaxed text-slate-600">{result.advice}</p>
              <button onClick={() => askWhy(dispatch, report, sel)} disabled={state.busy}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#4F8CFF] px-4 py-2 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50">
                <HelpCircle size={15} /> 为什么会这样？
              </button>
            </>
          )}
        </div>

        {/* Top5 贡献度 */}
        {!exclusion && (
          <div className="rounded-2xl border border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-600"><Info size={14} className="text-[#4F8CFF]" /> 影响因素 Top 5</div>
            <ContributionChart contributions={result.contributions} />
          </div>
        )}

        {/* 透明度 */}
        {!exclusion && <Transparency oid={sel} result={result} layer={report.layer} />}

        {/* 免责声明 */}
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-amber-700">
            本报告基于{MODEL_META.cohortName} Cox 比例风险模型，仅供健康风险参考，<b>不替代临床诊断</b>。如有不适请及时就医。
          </p>
        </div>
      </div>
    </div>
  );
}
