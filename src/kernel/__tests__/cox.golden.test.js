// ⚠️ ════════════════════════════════════════════════════════════════════
// ⚠️  GOLDEN 基线测试 — 锁定医学内核输出（第一原则：模型输出 100% 不变）
// ⚠️ ════════════════════════════════════════════════════════════════════
//
// 本测试对一组固定 fixture 快照 calcCoxRisk / riskLevel / getExclusionReason /
// checkDiagnostics / getHealthAdvice 的输出。AI Health Copilot 重构全程必须保持
// 通过——任何使快照变化的改动都意味着医学计算被动了，应当被拒绝。
//
// 快照文件：./__snapshots__/cox.golden.test.js.snap
// 严禁用 `vitest -u` 盲目更新快照来「修复」失败；除非确有经评审的内核变更。
// ════════════════════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest';
import {
  OUTCOMES,
  VARIABLES,
  calcCoxRisk,
  getExclusionReason,
  isOutcomeExcluded,
  checkDiagnostics,
  getHealthAdvice,
  riskLevel,
} from '../index.js';

// ---- 代表性输入向量（覆盖：全均值 / 低危 / 高危 / 触发诊断阈值）----
const FIXTURES = {
  // 全部留空 → 各变量取人群均值 → LP=0 → Risk = 1 − S₀
  emptyAllMeans: {},

  lowRisk: {
    age: 30, sex: 0, bmi: 21, waist: 75, sleephour: 8, sithour: 2, sport_total: 30,
    smoke: 1, drink: 1, dm2_family: 0, ht_family: 0, stroke_family: 0,
    ht_prevalent: 0, cvd_prevalent: 0, t2d_prevalent: 0,
    druglipo: 0, drugdiab: 0, drughyper: 0,
    sbp: 110, dbp: 70, fbg: 5.0, hba1c: 5.2,
    tc: 4.5, hdl: 1.6, ldl: 2.0, tg: 0.9, apoa: 1.4,
    abi: 1.1, bapwv: 1300, cca_imt: 0.6,
  },

  // 高危但所有指标都低于诊断阈值（不触发排除，纯测高风险数值）
  highRiskNoDiagnosis: {
    age: 68, sex: 1, bmi: 31, waist: 105, sleephour: 5, sithour: 8, sport_total: 2,
    smoke: 3, drink: 3, dm2_family: 1, ht_family: 1, stroke_family: 1,
    ht_prevalent: 0, cvd_prevalent: 0, t2d_prevalent: 0,
    druglipo: 0, drugdiab: 0, drughyper: 0,
    sbp: 135, dbp: 88, fbg: 6.8, hba1c: 6.3,
    tc: 6.0, hdl: 0.8, ldl: 4.0, tg: 2.5, apoa: 1.0,
    abi: 0.85, bapwv: 2200, cca_imt: 1.4,
  },

  // 指标达到诊断阈值 → checkDiagnostics 命中高血压 + 糖尿病，对应结局应被排除
  diagnosticTrigger: {
    age: 60, sex: 1, bmi: 27, waist: 95,
    sbp: 150, dbp: 92, fbg: 7.5, hba1c: 7.0,
    drughyper: 1, drugdiab: 1,
  },
};

const OUTCOME_IDS = ['t2d', 'cvd', 'ht'];
const LAYERS = [1, 2, 3];

// 复用 ModelTransparencyPanel 的 Top5 口径：剔除 skipped，按 |贡献| 降序
function top3(contributions) {
  return [...contributions]
    .filter((c) => !c.skipped)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((c) => ({ id: c.id, contribution: c.contribution.toFixed(8) }));
}

function snapshotForFixture(inputs) {
  const out = {};
  for (const oid of OUTCOME_IDS) {
    const outcome = OUTCOMES[oid];
    out[oid] = { byLayer: {} };
    for (const layer of LAYERS) {
      const r = calcCoxRisk(outcome, VARIABLES, inputs, layer);
      out[oid].byLayer[layer] = {
        value: r.riskPercent.toFixed(4),
        level: riskLevel(r.riskPercent),
        linearPredictor: r.linearPredictor.toFixed(8),
        baselineSurv: r.baselineSurv,
        top3: top3(r.contributions),
        advice: getHealthAdvice(layer, riskLevel(r.riskPercent), oid),
      };
    }
  }
  return out;
}

describe('医学内核 golden 基线', () => {
  for (const [name, inputs] of Object.entries(FIXTURES)) {
    it(`calcCoxRisk 输出锁定 — ${name}`, () => {
      expect(snapshotForFixture(inputs)).toMatchSnapshot();
    });
  }

  it('checkDiagnostics 诊断命中锁定', () => {
    const result = {};
    for (const [name, inputs] of Object.entries(FIXTURES)) {
      result[name] = checkDiagnostics(inputs).map((a) => ({
        condition: a.condition,
        name: a.name,
        outcomeToExclude: a.outcomeToExclude,
        triggeredBy: a.triggeredBy,
        department: a.department,
      }));
    }
    expect(result).toMatchSnapshot();
  });

  it('getExclusionReason / isOutcomeExcluded 锁定', () => {
    const result = {};
    for (const [name, inputs] of Object.entries(FIXTURES)) {
      const alerts = checkDiagnostics(inputs);
      result[name] = {};
      for (const oid of OUTCOME_IDS) {
        const reason = getExclusionReason(OUTCOMES[oid], inputs, alerts);
        result[name][oid] = {
          excluded: isOutcomeExcluded(OUTCOMES[oid], inputs, alerts),
          // reason 可能是 null / 'self_report' / 诊断 alert 对象
          reason:
            reason && typeof reason === 'object'
              ? { condition: reason.condition, outcomeToExclude: reason.outcomeToExclude }
              : reason,
        };
      }
    }
    expect(result).toMatchSnapshot();
  });

  it('风险分级阈值未漂移（高危>20 / 中危>10 / 低危）', () => {
    expect([
      riskLevel(0), riskLevel(9.99), riskLevel(10), riskLevel(10.01),
      riskLevel(20), riskLevel(20.01), riskLevel(100),
    ]).toEqual(['低危', '低危', '低危', '中危', '中危', '高危', '高危']);
  });

  it('全均值输入下 LP=0、Risk=1−S₀（中心化正确性）', () => {
    for (const oid of OUTCOME_IDS) {
      const outcome = OUTCOMES[oid];
      const r = calcCoxRisk(outcome, VARIABLES, {}, 3);
      expect(Number(r.linearPredictor.toFixed(10))).toBe(0);
      const expected = (1 - outcome.baselineSurvival) * 100;
      expect(r.riskPercent).toBeCloseTo(expected, 10);
    }
  });
});
