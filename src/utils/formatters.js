// ⚠️ FROZEN MEDICAL KERNEL — 风险分级阈值(20/10) 与换算，禁止修改（入口 src/kernel/index.js）
// src/utils/formatters.js
// 纯展示/换算辅助函数。
import { VARIABLES } from '../riskConfig';
import { SPORT_MET_WEIGHTS } from '../lib/riskEngine';

// 风险百分比 → 等级（阈值未改：高危 >20% / 中危 10-20% / 低危 <10%）
export const riskLevel = (percent) => (percent > 20 ? '高危' : percent > 10 ? '中危' : '低危');

// 截至某层级已纳入的指标数量
export const usedCount = (layer) => VARIABLES.filter((v) => v.layer <= layer).length;

// 运动量高/低强度 → MET·h/周（自动换算逻辑，从原 App.jsx 搬运）
export function computeSportMet(highHours, lowHours) {
  const h = parseFloat(highHours);
  const l = parseFloat(lowHours);
  const hasH = highHours !== '' && highHours !== undefined && !isNaN(h) && h >= 0;
  const hasL = lowHours !== '' && lowHours !== undefined && !isNaN(l) && l >= 0;
  if (!hasH && !hasL) return null;
  return (hasH ? h * SPORT_MET_WEIGHTS.high : 0) + (hasL ? l * SPORT_MET_WEIGHTS.low : 0);
}
