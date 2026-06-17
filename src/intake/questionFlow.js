// src/intake/questionFlow.js
// ───────────────────────────────────────────────────────────────────────
// 确定性问诊流：从冻结内核的 VARIABLES 派生「逐题对话」的顺序、提示语，
// 以及分层定性解读 / 风险报告 / 「为什么」的构建逻辑。
//
// 关键约束：本文件不做任何风险计算，全部调用 @/kernel 的 calcCoxRisk 等；
// 分层解读不输出任何风险数值（满足「不要提前输出风险值」）。
// ───────────────────────────────────────────────────────────────────────
import {
  OUTCOMES,
  VARIABLES,
  calcCoxRisk,
  getExclusionReason,
  checkDiagnostics,
  getHealthAdvice,
  riskLevel,
} from '../kernel';
import { STEP_META } from '../lib/uiTokens';

export const BY_ID = Object.fromEntries(VARIABLES.map((v) => [v.id, v]));
const VAR_LABEL = Object.fromEntries(VARIABLES.map((v) => [v.id, v.label]));
const OUTCOME_IDS = ['t2d', 'cvd', 'ht'];

// 不可改变因素（解读时单独说明）
const IMMUTABLE = new Set(['age', 'sex', 'dm2_family', 'ht_family', 'stroke_family']);

// 每层问题顺序（与原 FormWizard 分组一致，仅 UI 顺序，不影响计算）
export const LAYER_VARS = {
  1: ['age', 'sex', 'bmi', 'waist', 'sleephour', 'sithour', 'sport_total',
      'smoke', 'drink', 'dm2_family', 'ht_family', 'stroke_family',
      'ht_prevalent', 'cvd_prevalent', 't2d_prevalent'],
  2: ['sbp', 'dbp', 'fbg', 'hba1c', 'tc', 'hdl', 'ldl', 'tg', 'apoa',
      'druglipo', 'drugdiab', 'drughyper'],
  3: ['abi', 'bapwv', 'cca_imt'],
};

// 助手自我介绍 + 边界声明（开场必现，结构化问诊与自由问答共用）
export const ASSISTANT_INTRO =
  '您好，我是您的健康生活方式助手 🌿 我可以帮您评估慢病风险、解读体检指标、给出生活方式建议；但我不提供疾病诊断或治疗方案，所有回答仅供参考、不能替代医生，如有不适请及时就医。';

// 自由问答开场引导（讲清：可直接提问，随时也能开始正式评估）
export const FREECHAT_GUIDE =
  '您可以直接问我健康、饮食、运动等生活方式方面的问题。想做一次完整的风险评估时，点下面的「开始健康评估」就可以～';

// 每层开场白（第 1 层讲清「先答题→再自由提问」的流程）
export const LAYER_INTRO = {
  1: '我们先用几个简单问题了解您的基本信息和生活方式，答完就能看到您的风险评估、并自由向我提问。每一题都可以点「跳过」，跳过的我会用人群平均值来估算 🙂',
  2: '接下来是一些血液检查指标 —— 有体检报告就照着填，没有可以跳过。',
  3: '最后是血管影像学检查（ACI / 脉搏波 / 颈动脉内中膜厚度）。做过的话填一下，评估会更准。',
};

// 逐题提示语（口语化）
export const QUESTION_PROMPTS = {
  age: '请问您今年多大年纪？（岁）',
  sex: '您的性别是？',
  bmi: '您的 BMI 大概是多少？（体重kg ÷ 身高m²，不清楚可以跳过）',
  waist: '您的腰围大约多少厘米？',
  sleephour: '您平均每天睡几个小时？',
  sithour: '您平均每天静坐多长时间？（小时）',
  sport_total: '平时运动情况怎么样？每周高强度、低强度运动各多少小时？（任填一项即可，我来换算）',
  smoke: '您目前的吸烟情况是？',
  drink: '您目前的饮酒情况是？',
  dm2_family: '直系亲属里有人得过糖尿病吗？',
  ht_family: '直系亲属里有人得过高血压吗？',
  stroke_family: '直系亲属里有人得过脑卒中（中风）吗？',
  ht_prevalent: '您本人被医生确诊过高血压吗？',
  cvd_prevalent: '您本人被确诊过心血管病（如冠心病、心梗）吗？',
  t2d_prevalent: '您本人被确诊过糖尿病吗？',
  sbp: '收缩压（高压）大概多少？（mmHg）',
  dbp: '舒张压（低压）大概多少？（mmHg）',
  fbg: '空腹血糖是多少？（mmol/L）',
  hba1c: '糖化血红蛋白 HbA1c 是多少？（%）',
  tc: '总胆固醇 TC 是多少？（mmol/L）',
  hdl: '高密度脂蛋白 HDL-C（"好胆固醇"）是多少？（mmol/L）',
  ldl: '低密度脂蛋白 LDL-C（"坏胆固醇"）是多少？（mmol/L）',
  tg: '甘油三酯 TG 是多少？（mmol/L）',
  apoa: '载脂蛋白 A（ApoA）是多少？（g/L）',
  druglipo: '目前在使用调脂药吗？',
  drugdiab: '目前在使用降糖药吗？',
  drughyper: '目前在使用降压药吗？',
  abi: '踝臂指数 ABI 是多少？（正常 ≥ 0.9）',
  bapwv: '脉搏波传导速度 baPWV 是多少？（cm/s）',
  cca_imt: '颈动脉内中膜厚度 CCA-IMT 是多少？（mm，正常 < 1.0）',
};

// 「我听懂了什么」——把刚纳入模型的取值回显成一句人话（用于答题后的确认气泡）。
// select 把数字 value 映射回选项中文；number 拼上单位。返回 null 时不显示确认。
export function answerEcho(varId, value) {
  const v = BY_ID[varId];
  if (!v || value === undefined || value === null || value === '') return null;
  if (v.type === 'select') {
    const opt = (v.options || []).find((o) => String(o.value) === String(value));
    return `已记录 · ${v.label}：${opt ? opt.label : value}`;
  }
  return `已记录 · ${v.label}：${value}${v.unit || ''}`;
}

// 下一道未作答（未填且未跳过）的题
export function nextVarId(layer, inputs, skipped) {
  for (const id of LAYER_VARS[layer]) {
    const answered = inputs[id] !== undefined && inputs[id] !== '';
    if (!answered && !skipped[id]) return id;
  }
  return null;
}

export function layerTitle(layer) {
  return STEP_META[layer - 1]?.title ?? `第 ${layer} 层`;
}

// 分层定性解读（绝不含风险数值）
export function buildLayerSummary(inputs, layer) {
  const alerts = checkDiagnostics(inputs);
  const agg = {};
  for (const oid of OUTCOME_IDS) {
    if (getExclusionReason(OUTCOMES[oid], inputs, alerts)) continue;
    const { contributions } = calcCoxRisk(OUTCOMES[oid], VARIABLES, inputs, layer);
    for (const c of contributions) {
      if (!c.skipped && c.contribution > 0) agg[c.id] = (agg[c.id] || 0) + c.contribution;
    }
  }
  const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  if (top.length === 0) {
    return '目前你填写的指标都在人群平均水平附近，没有特别突出的风险来源。继续补充指标，我可以评估得更准确。';
  }
  const labels = top.map((id) => VAR_LABEL[id] || id);
  let txt = `根据目前的信息，${labels.join('、')}对你的风险影响相对较大。`;
  if (top.some((id) => IMMUTABLE.has(id))) {
    txt += '其中像年龄、家族史这类无法改变，但可以通过管理体重、运动和饮食等可改变因素来降低整体风险。';
  }
  if (layer < 3) txt += '继续补充更精细的指标后，我会给出更准确的评估。';
  return txt;
}

function topFactorLabels(contributions, n = 2) {
  return [...contributions]
    .filter((c) => !c.skipped && c.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, n)
    .map((c) => VAR_LABEL[c.id] || c.label);
}

function summaryLine(results, exclusions, primary) {
  if (!primary) {
    return '您填写的部分指标已达到疾病诊断标准，建议尽快就医确认。本工具暂不对这些结局做新发风险预测。';
  }
  const o = OUTCOMES[primary];
  const lvl = results[primary].level;
  const word = lvl === '高危' ? '偏高' : lvl === '中危' ? '中等' : '较低';
  const factors = topFactorLabels(results[primary].contributions);
  const fpart = factors.length ? `主要与${factors.join('、')}有关。` : '';
  return `您的未来 ${o.predictionYears} 年${o.name}风险${word}。${fpart}`;
}

// 生成风险报告所需的全部数据（计算全部来自内核）
export function buildReport(inputs, layer) {
  const alerts = checkDiagnostics(inputs);
  const results = {};
  const exclusions = {};
  for (const oid of OUTCOME_IDS) {
    const o = OUTCOMES[oid];
    const r = calcCoxRisk(o, VARIABLES, inputs, layer);
    const level = riskLevel(r.riskPercent);
    results[oid] = {
      value: r.riskPercent.toFixed(1),
      valueNum: r.riskPercent,
      level,
      advice: getHealthAdvice(layer, level, oid),
      contributions: r.contributions,
      linearPredictor: r.linearPredictor,
      baselineSurv: r.baselineSurv,
    };
    exclusions[oid] = getExclusionReason(o, inputs, alerts);
  }
  const candidates = OUTCOME_IDS.filter((oid) => !exclusions[oid]);
  const primary = candidates.sort((a, b) => results[b].valueNum - results[a].valueNum)[0] || null;
  return { results, exclusions, alerts, primary, layer, summary: summaryLine(results, exclusions, primary) };
}

// 「为什么会这样」——确定性版本（接入 DeepSeek + RAG 后将升级为知识库科普）
const WHY_NOTES = {
  age: '年龄增长会使血管弹性下降，是不可改变的风险因素，但可通过控制其他因素降低整体风险。',
  bmi: 'BMI 偏高与胰岛素抵抗、血压升高相关；减重 5%~10% 即可明显改善代谢指标。',
  waist: '腰围反映腹型肥胖，与糖尿病、心血管风险关系密切。',
  sbp: '收缩压长期偏高会损伤血管；减少钠盐、规律运动、控制体重有助于降低。',
  dbp: '舒张压偏高同样增加心脑血管负担。',
  fbg: '空腹血糖偏高提示糖代谢异常，需关注饮食结构与体重。',
  hba1c: '糖化血红蛋白反映近 2~3 个月平均血糖水平。',
  ldl: 'LDL-C（"坏胆固醇"）偏高与动脉粥样硬化相关；减少饱和脂肪、增加膳食纤维有帮助。',
  hdl: 'HDL-C（"好胆固醇"）偏低不利于血脂健康，规律有氧运动可帮助提升。',
  tg: '甘油三酯偏高与高糖高脂饮食、饮酒相关。',
  tc: '总胆固醇偏高需结合 LDL / HDL 综合判断。',
  smoke: '吸烟是心血管病最重要的可改变危险因素之一，戒烟可显著降低风险。',
  drink: '过量饮酒会升高血压与心血管风险，没有"安全"的饮酒量。',
  sport_total: '规律身体活动是保护因素；每周 150 分钟以上中等强度运动可降低多种慢病风险。',
  sleephour: '睡眠过短或过长都可能与代谢异常相关，一般建议 7~8 小时。',
  sithour: '久坐时间越长慢病风险越高，建议每小时起身活动。',
  dm2_family: '糖尿病家族史提示遗传易感性较高，属不可改变因素，但建议更早、更规律筛查。',
};

export function buildWhy(inputs, layer, oid) {
  const o = OUTCOMES[oid];
  const r = calcCoxRisk(o, VARIABLES, inputs, layer);
  const factors = [...r.contributions]
    .filter((c) => !c.skipped)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5)
    .map((c) => ({
      label: VAR_LABEL[c.id] || c.label,
      dir: c.contribution >= 0 ? 'up' : 'down',
      note: WHY_NOTES[c.id] || '',
    }));
  return {
    oid,
    title: `为什么我的${o.name}风险是这样？`,
    factors,
    advice: getHealthAdvice(layer, riskLevel(r.riskPercent), oid),
  };
}
