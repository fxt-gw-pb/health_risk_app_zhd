// src/intake/__tests__/flow.test.js
// 问诊编排逻辑的烟雾测试（纯逻辑，不依赖 React/浏览器）。
import { describe, it, expect } from 'vitest';
import {
  LAYER_VARS, nextVarId, buildLayerSummary, buildReport, buildWhy,
} from '../questionFlow';

describe('问题调度 nextVarId', () => {
  it('按层内顺序返回首个未作答题', () => {
    expect(nextVarId(1, {}, {})).toBe(LAYER_VARS[1][0]); // age
  });
  it('已填写则跳过该题', () => {
    expect(nextVarId(1, { age: '50' }, {})).toBe(LAYER_VARS[1][1]); // sex
  });
  it('显式跳过也算已处理', () => {
    expect(nextVarId(1, { age: '50' }, { sex: true })).toBe(LAYER_VARS[1][2]); // bmi
  });
  it('整层处理完返回 null', () => {
    const inputs = {}; const skipped = {};
    for (const id of LAYER_VARS[3]) skipped[id] = true;
    expect(nextVarId(3, inputs, skipped)).toBeNull();
  });
});

describe('分层定性解读 buildLayerSummary', () => {
  it('返回非空字符串且不泄露风险数值（无 %）', () => {
    const inputs = { age: '68', bmi: '31', smoke: '3', sbp: '135' };
    const txt = buildLayerSummary(inputs, 1);
    expect(typeof txt).toBe('string');
    expect(txt.length).toBeGreaterThan(0);
    expect(txt).not.toMatch(/%/);
  });
});

describe('风险报告 buildReport', () => {
  it('三结局都给出 value/level，primary 为最高危的可预测结局', () => {
    const inputs = {
      age: '68', sex: '1', bmi: '31', waist: '105', smoke: '3',
      sbp: '135', dbp: '88', fbg: '6.8', hba1c: '6.3', ldl: '4.0', hdl: '0.8',
    };
    const r = buildReport(inputs, 2);
    for (const oid of ['t2d', 'cvd', 'ht']) {
      expect(r.results[oid]).toHaveProperty('value');
      expect(['高危', '中危', '低危']).toContain(r.results[oid].level);
    }
    expect(['t2d', 'cvd', 'ht']).toContain(r.primary);
    expect(typeof r.summary).toBe('string');
  });

  it('指标达诊断阈值 → 对应结局被排除、命中诊断提示', () => {
    const inputs = { sbp: '150', dbp: '92', fbg: '7.5', hba1c: '7.0' };
    const r = buildReport(inputs, 2);
    expect(r.exclusions.ht).not.toBeNull();
    expect(r.exclusions.t2d).not.toBeNull();
    expect(r.exclusions.cvd).toBeNull();
    expect(r.alerts.map((a) => a.condition).sort()).toEqual(['ht', 't2d']);
  });
});

describe('为什么 buildWhy', () => {
  it('返回 Top5 因素与方向', () => {
    const w = buildWhy({ age: '70', bmi: '32', smoke: '3' }, 1, 'ht');
    expect(w.factors.length).toBeGreaterThan(0);
    expect(w.factors.length).toBeLessThanOrEqual(5);
    expect(['up', 'down']).toContain(w.factors[0].dir);
    expect(typeof w.advice).toBe('string');
  });
});
