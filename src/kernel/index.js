// ⚠️ ════════════════════════════════════════════════════════════════════
// ⚠️  MEDICAL KERNEL — 医学计算内核统一入口（FROZEN）
// ⚠️ ════════════════════════════════════════════════════════════════════
//
// 这是医学计算内核对外的【唯一】导入面。AI Health Copilot 升级后，所有新代码
// （问诊编排、Chat、Health Report、后端）一律从 `@/kernel`（src/kernel）导入，
// 不直接 reach 进 riskConfig / lib / utils 的物理文件。
//
// 第一原则：保留全部医学计算逻辑。本入口只做「再导出」，不含任何计算或改写。
// 受 golden 测试锁定（./__tests__/cox.golden.test.js）——重构全程必须保持通过，
// 逐位证明模型输出与原版 100% 一致。AI 仅负责引导/解释/科普，绝不参与风险计算。
//
// 冻结清单（任何改动都必须先更新 golden 基线并经评审）：
//   · OUTCOMES（betas / means / baselineSurvival / cIndex）
//   · VARIABLES（变量定义与系数）
//   · calcCoxRisk        Risk(t) = 1 − S₀^exp(LP),  LP = Σ βᵢ·(xᵢ − x̄ᵢ)
//   · getExclusionReason / isOutcomeExcluded
//   · DIAGNOSTIC_RULES / checkDiagnostics
//   · getHealthAdvice / MODEL_META
//   · validateInput      输入范围校验
//   · riskLevel          风险分级阈值（高危 >20% / 中危 >10% / 低危）
//   · usedCount / computeSportMet / SPORT_MET_WEIGHTS
// ════════════════════════════════════════════════════════════════════════

// ---- 配置与模型元数据 ----
export {
  OUTCOMES,
  VARIABLES,
  DIAGNOSTIC_RULES,
  checkDiagnostics,
  getHealthAdvice,
  MODEL_META,
} from '../riskConfig';

// ---- Cox 预测引擎 ----
export {
  calcCoxRisk,
  getExclusionReason,
  isOutcomeExcluded,
  SPORT_MET_WEIGHTS,
} from '../lib/riskEngine';

// ---- 输入校验 ----
export { validateInput } from '../lib/validation';

// ---- 展示/换算（含风险分级阈值）----
export { riskLevel, usedCount, computeSportMet } from '../utils/formatters';
