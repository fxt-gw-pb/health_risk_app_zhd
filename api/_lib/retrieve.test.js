// api/_lib/retrieve.test.js — BM25-lite 检索烟雾测试（纯逻辑，无网络）。
import { describe, it, expect } from 'vitest';
import { retrieve, diseaseScopeOf, CHUNK_COUNT } from './retrieve.js';

describe('BM25-lite 检索', () => {
  it('知识库已加载（238 块）', () => {
    expect(CHUNK_COUNT).toBe(238);
  });

  it('疾病名 → disease_scope 映射', () => {
    expect(diseaseScopeOf('高血压')).toBe('hypertension');
    expect(diseaseScopeOf('新发糖尿病')).toBe('diabetes');
    expect(diseaseScopeOf('心血管病')).toBe('cardiovascular');
    expect(diseaseScopeOf('你好')).toBeNull();
  });

  it('「高血压 减盐 饮食」召回高血压相关块', () => {
    const hits = retrieve('高血压 减盐 饮食 吃什么', { diseaseScope: 'hypertension', k: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(5);
    // 命中块应属于高血压范围，且带溯源
    expect(hits[0].disease_scope).toContain('hypertension');
    expect(hits[0]).toHaveProperty('source_url');
    expect(hits[0]).toHaveProperty('year');
  });

  it('「运动 身体活动 每周多少分钟」能召回身体活动建议', () => {
    const hits = retrieve('运动 身体活动 每周多少分钟 中等强度', { k: 5 });
    const joined = hits.map((h) => h.text).join('');
    expect(joined).toMatch(/150|分钟|身体活动|运动/);
  });

  it('空查询返回空', () => {
    expect(retrieve('', { k: 5 })).toEqual([]);
  });
});
