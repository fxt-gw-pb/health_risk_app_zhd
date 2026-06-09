// src/components/ModelTransparencyPanel.jsx
import { useState } from 'react';
import { FlaskConical, ChevronUp, ChevronDown, BarChart3, Sigma } from 'lucide-react';
import { MODEL_META } from '../riskConfig';

export default function ModelTransparencyPanel({ outcome, result, currentLayer }) {
  const [expanded, setExpanded] = useState(false);
  const contribs = result.contributions || [];
  const sorted = [...contribs].filter((c) => !c.skipped).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const top5 = sorted.slice(0, 5);
  const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.contribution)), 0.01);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between p-5 transition hover:bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-black text-slate-700">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-500"><FlaskConical size={16} /></span>
          模型透明度
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
          {expanded ? '收起' : '展开'} {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-slate-100 p-5 anim-fade-up">
          {/* 研究信息 */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: '队列来源', v: MODEL_META.cohortName, d: `N=${outcome.sampleSize.toLocaleString()} · 事件 ${outcome.events}` },
              { k: '随访窗口', v: MODEL_META.followUpYears, d: `预测 ${outcome.predictionYears} 年 · Tier${outcome.modelTier}` },
              { k: '当前判别度', v: outcome.cIndex[currentLayer].toFixed(3), d: `第 ${currentLayer} 层 C-index` },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{x.k}</div>
                <div className="mt-0.5 text-base font-black text-slate-700">{x.v}</div>
                <div className="text-[11px] text-slate-400">{x.d}</div>
              </div>
            ))}
          </div>

          {/* C-index 逐层 */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-500"><BarChart3 size={13} /> 模型判别力 C-index（逐层）</div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((t) => (
                <div key={t} className={`rounded-xl p-2.5 text-center ${t === currentLayer ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-slate-50'}`}>
                  <div className="text-[10px] text-slate-400">第 {t} 层</div>
                  <div className={`tnum text-base font-black ${t === currentLayer ? 'text-blue-700' : 'text-slate-700'}`}>{outcome.cIndex[t].toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 变量贡献度 Top 5 */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-500"><BarChart3 size={13} /> 变量贡献度 Top 5</div>
            <div className="space-y-2">
              {top5.map((c) => {
                const pct = (Math.abs(c.contribution) / maxAbs) * 100;
                const positive = c.contribution >= 0;
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-right font-medium text-slate-500">{c.label}</span>
                    <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${positive ? 'bg-gradient-to-r from-rose-300 to-rose-500' : 'bg-gradient-to-r from-emerald-300 to-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`tnum w-14 shrink-0 text-right font-bold ${positive ? 'text-rose-600' : 'text-emerald-600'}`}>{positive ? '+' : ''}{c.contribution.toFixed(3)}</span>
                  </div>
                );
              })}
              {top5.length === 0 && <p className="text-xs text-slate-400">当前所有指标均处于人群均值附近，贡献度接近 0。</p>}
            </div>
            <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />升高风险</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />降低风险</span>
            </p>
          </div>

          {/* 公式 */}
          <div className="rounded-2xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300">
            <div className="mb-2 flex items-center gap-1.5 font-sans text-[11px] font-bold text-slate-400"><Sigma size={13} /> 风险计算公式</div>
            <div>Risk({outcome.predictionYears}y) = 1 − S₀^exp(LP)</div>
            <div className="text-slate-400">S₀ = <span className="text-cyan-300">{result.baselineSurv?.toFixed(6)}</span></div>
            <div className="text-slate-400">LP = Σβᵢ(xᵢ − x̄ᵢ) = <span className="text-cyan-300">{result.linearPredictor?.toFixed(4)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
