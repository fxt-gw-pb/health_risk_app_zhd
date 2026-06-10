// api/_lib/retrieve.js — BM25-lite 检索（零依赖，离线可用）。
// 针对中文：ASCII 词 + CJK 一元/二元 gram 分词；238 块规模冷启动构建索引耗时可忽略。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CHUNKS = JSON.parse(readFileSync(join(__dir, '..', 'rag', 'chunks.json'), 'utf-8'));

// 疾病中文名 → disease_scope 标签
const DISEASE_MAP = [
  [/糖尿病|血糖|t2d/i, 'diabetes'],
  [/高血压|血压|ht\b/i, 'hypertension'],
  [/心血管|冠心|心脏|中风|卒中|cvd/i, 'cardiovascular'],
];
export function diseaseScopeOf(text) {
  if (!text) return null;
  for (const [re, tag] of DISEASE_MAP) if (re.test(text)) return tag;
  return null;
}

function tokenize(s) {
  if (!s) return [];
  s = s.toLowerCase();
  const toks = [];
  for (const m of s.matchAll(/[a-z0-9]+/g)) toks.push(m[0]);          // ASCII 词/数字
  for (const run of s.match(/[一-鿿]+/g) || []) {             // CJK 连续段
    for (let i = 0; i < run.length; i++) {
      toks.push(run[i]);                                              // 一元
      if (i + 1 < run.length) toks.push(run[i] + run[i + 1]);         // 二元
    }
  }
  return toks;
}

// ---- 构建 BM25 索引（模块加载时一次）----
const K1 = 1.5, B = 0.75;
const docs = CHUNKS.map((c) => {
  const tf = new Map();
  for (const t of tokenize(`${c.title} ${c.heading_path} ${c.text}`)) tf.set(t, (tf.get(t) || 0) + 1);
  let len = 0; for (const v of tf.values()) len += v;
  return { c, tf, len };
});
const avgdl = docs.reduce((s, d) => s + d.len, 0) / (docs.length || 1);
const df = new Map();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
const N = docs.length;
const idf = (t) => {
  const n = df.get(t) || 0;
  return Math.log(1 + (N - n + 0.5) / (n + 0.5));
};

// 检索：返回 TopK 块（可按 disease_scope 过滤）
export function retrieve(query, { diseaseScope = null, k = 5 } = {}) {
  const qterms = [...new Set(tokenize(query))];
  if (qterms.length === 0) return [];
  const pool = diseaseScope ? docs.filter((d) => d.c.disease_scope?.includes(diseaseScope)) : docs;
  const scored = pool.map((d) => {
    let score = 0;
    for (const t of qterms) {
      const f = d.tf.get(t);
      if (!f) continue;
      score += idf(t) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.len / avgdl)));
    }
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, k).map(({ d, score }) => ({
    title: d.c.title,
    text: d.c.text,
    source_url: d.c.source_url,
    organization_or_journal: d.c.organization_or_journal,
    year: d.c.year,
    disease_scope: d.c.disease_scope,
    score: Number(score.toFixed(3)),
  }));
}

export const CHUNK_COUNT = N;
