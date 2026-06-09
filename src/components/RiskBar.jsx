// src/components/RiskBar.jsx
// 横向风险条，标注低/中/高危区间（10% / 20% 分界）。
import { levelMeta } from '../lib/uiTokens';

export default function RiskBar({ percent, level, animate = true }) {
  const lm = levelMeta(level);
  const CAP = 40; // 展示标尺上限
  const pos = (Math.min(Math.max(percent, 0), CAP) / CAP) * 100;
  const trans = animate ? 'cubic-bezier(.22,1,.36,1)' : 'none';
  return (
    <div className="select-none">
      <div className="relative h-3.5 w-full overflow-hidden rounded-full">
        {/* 区间底色 */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-emerald-100" style={{ width: '25%' }} />
          <div className="h-full bg-amber-100" style={{ width: '25%' }} />
          <div className="h-full bg-rose-100" style={{ width: '50%' }} />
        </div>
        {/* 填充 */}
        <div className={`absolute inset-y-0 left-0 rounded-full ${lm.bar}`} style={{ width: `${pos}%`, transition: `width .9s ${trans}` }} />
        {/* 指示点 */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-slate-700 shadow-md"
          style={{ left: `${pos}%`, transition: `left .9s ${trans}` }}
        />
      </div>
      <div className="relative mt-1.5 h-4 text-[10px] font-semibold text-slate-400">
        <span className="absolute -translate-x-1/2" style={{ left: '25%' }}>10%</span>
        <span className="absolute -translate-x-1/2" style={{ left: '50%' }}>20%</span>
        <span className="absolute left-0 text-emerald-500">低危</span>
        <span className="absolute right-0 text-rose-500">高危</span>
      </div>
    </div>
  );
}
