// src/lib/riskEngine.js
// ──────────────────────────────────────────────────────────────
// Cox 比例风险预测引擎。
// ⚠️ 本文件中的算法系从原 App.jsx 中“原样搬运”，未改动任何计算逻辑：
//    Risk(t) = 1 − S₀(t)^exp(LP),  LP = Σ βᵢ·(xᵢ − x̄ᵢ)
//    缺失指标 → 使用队列人群均值（中心化后贡献为零）。
// 诊断阈值检测（checkDiagnostics）仍由 riskConfig.js 提供，此处再导出以便统一引用。
// ──────────────────────────────────────────────────────────────
import { OUTCOMES, VARIABLES, checkDiagnostics } from '../riskConfig';

export { OUTCOMES, VARIABLES, checkDiagnostics };

// 运动量 MET 权重（高/低强度），用于自动换算
export const SPORT_MET_WEIGHTS = { high: 8.0, low: 3.3 };

// ---- Cox 模型预测函数 ----
// LP = Σ βᵢ·(xᵢ - x̄ᵢ)，Risk = 1 - S₀^exp(LP)
export function calcCoxRisk(outcome, variables, inputs, maxLayer) {
  let linearPredictor = 0;
  const contributions = [];

  variables.forEach((v) => {
    if (v.layer > maxLayer) return;

    const beta = v.betas?.[outcome.id] ?? 0;
    if (beta === 0) {
      contributions.push({ id: v.id, label: v.label, beta: 0, contribution: 0, skipped: true });
      return;
    }

    const mean = v.means?.[outcome.id] ?? 0;
    let val = parseFloat(inputs[v.id]);
    if (isNaN(val)) val = mean; // 未填写则用人群均值，贡献=0

    const centered = val - mean;
    const contrib = beta * centered;
    linearPredictor += contrib;

    contributions.push({ id: v.id, label: v.label, beta, value: val, centered, contribution: contrib, skipped: false });
  });

  const baselineSurv = outcome.baselineSurvival;
  const risk = 1 - Math.pow(baselineSurv, Math.exp(linearPredictor));
  const riskPercent = Math.max(0, Math.min(1, risk)) * 100;

  return { riskPercent, contributions, linearPredictor, baselineSurv };
}

// ---- 判断结局是否因既往疾病/诊断阈值而排除 ----
// 返回: null=不排除, 'self_report'=用户自报, {alert object}=指标达到诊断标准
export function getExclusionReason(outcome, inputs, diagnosticAlerts) {
  if (outcome.excludeIfPrevalent && parseFloat(inputs[outcome.excludeIfPrevalent]) === 1) {
    return 'self_report';
  }
  const alert = diagnosticAlerts.find((a) => a.outcomeToExclude === outcome.id);
  if (alert) return alert;
  return null;
}

export function isOutcomeExcluded(outcome, inputs, diagnosticAlerts = []) {
  return getExclusionReason(outcome, inputs, diagnosticAlerts) !== null;
}
