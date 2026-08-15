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
  2: '接下来是血压、血糖、血脂和当前用药情况。有近期检查报告就按报告原值和题目标注的单位填写；没有、单位不同或看不懂时可以跳过，不要猜填。',
  3: '最后是血管检查指标（ABI、baPWV、CCA-IMT）。做过相关检查就按最近一次报告填写；没做过或报告里找不到对应项目可以跳过。',
};

// 逐题提示语（口语化）。括号内统一说明作答口径、测量方法和单位，避免基层用户猜测。
export const QUESTION_PROMPTS = {
  age: '请问您现在多少周岁？（按身份证出生日期计算，填已满的整岁；单位：岁）',
  sex: '您的性别是？（本模型按生理性别计算，请按身份证上登记的男/女选择）',
  bmi: '请填写您近期的身高和体重，我来帮您计算 BMI。（身高：脱鞋直立测量，单位 cm；体重：脱鞋并去掉厚重外衣测量，单位 kg；不清楚可以跳过）',
  waist: '您的腰围是多少？（站立、正常呼气末，在最下方肋骨与髋骨上缘之间的中点水平绕一周；软尺贴身但不勒紧，单位 cm）',
  sleephour: '过去一个月，您平均每晚实际睡着多久？（不含躺在床上但没睡着的时间；单位小时，如 7 小时 30 分填 7.5）',
  sithour: '过去一周，您清醒时平均每天坐着或靠着多久？（包括坐着工作、看电视、玩手机、打牌和乘车；不含睡觉；单位小时，如 3 小时 30 分填 3.5）',
  sport_total: '过去 6 个月的典型一周，您专门锻炼的高强度、低强度运动各有多少小时？（不含工作劳动和家务；高强度：呼吸心跳明显加快、只能说短句，如跑步、快速爬坡、快速骑车、打篮球；中等强度：呼吸心跳加快但仍可交谈，如快走、广场舞、一般速度骑车；低强度：呼吸心跳变化很小，如慢走、舒缓太极、拉伸。现有模型只收集高、低强度两栏，中等强度不要并入这两栏；30 分钟填 0.5 小时）',
  smoke: '您目前的吸烟情况是？（从不吸烟：一生累计未满 100 支；已戒烟：累计满 100 支但近 30 天未吸；目前吸烟：累计满 100 支且近 30 天仍吸，包括偶尔吸）',
  drink: '您目前的饮酒情况是？（白酒、啤酒、葡萄酒和自酿酒都算；偶尔饮酒：平均每周少于 1 次；经常饮酒：平均每周至少 1 次）',
  dm2_family: '您的父母、同胞兄弟姐妹或子女中，有人被医生明确诊断过糖尿病吗？（只算上述一级亲属；仅听说血糖偏高但未确诊的不算）',
  ht_family: '您的父母、同胞兄弟姐妹或子女中，有人被医生明确诊断过高血压吗？（只算上述一级亲属；偶尔一次血压高但未确诊的不算）',
  stroke_family: '您的父母、同胞兄弟姐妹或子女中，有人被医生明确诊断过脑卒中吗？（脑卒中包括脑梗死、脑出血，俗称“中风”；只算上述一级亲属）',
  ht_prevalent: '您本人是否曾被医生明确诊断为高血压？（即使目前血压已控制正常或正在服药，也选“是”；仅偶尔一次血压高但未确诊的选“否”）',
  cvd_prevalent: '您本人是否曾被医生明确诊断为心脑血管病？（如冠心病、心绞痛、心肌梗死、脑卒中/中风；即使目前病情稳定也选“是”）',
  t2d_prevalent: '您本人是否曾被医生明确诊断为糖尿病？（单次血糖偏高但未确诊的不算；仅在姊娠期出现且产后已恢复的妊娠糖尿病不算；正在用药或血糖已控制正常也选“是”）',
  sbp: '请填最近一次规范静息血压的收缩压（高压）。（测量前安静坐 5 分钟；同次连续测量 2–3 次时填平均值；正在服药也填实测值；单位 mmHg）',
  dbp: '请填与上一题同一组静息血压的舒张压（低压）。（同次连续测量 2–3 次时填平均值；不要填心率或脉压；单位 mmHg）',
  fbg: '请填最近一次空腹静脉血糖的检查结果。（至少 8 小时未进食后抽血；按报告中“空腹血糖/葡萄糖”的实测值填写；单位必须是 mmol/L，不要填餐后或随机血糖）',
  hba1c: '请填最近一次糖化血红蛋白（HbA1c）的检查结果。（该检查无需空腹；按报告实测值填写，单位 %；不要填“平均血糖”）',
  tc: '请从最近一次血脂化验单中填写总胆固醇（TC）。（填实测值，不要填参考范围；单位必须是 mmol/L）',
  hdl: '请从最近一次血脂化验单中填写高密度脂蛋白胆固醇（HDL-C，俗称“好胆固醇”）。（填实测值，不要填参考范围；单位必须是 mmol/L）',
  ldl: '请从最近一次血脂化验单中填写低密度脂蛋白胆固醇（LDL-C，俗称“坏胆固醇”）。（填实测值，不要填参考范围；单位必须是 mmol/L）',
  tg: '请从最近一次血脂化验单中填写甘油三酯（TG）。（填实测值，不要填参考范围；单位必须是 mmol/L）',
  apoa: '请从最近一次化验单中填写载脂蛋白 A（报告可能写 ApoA 或 ApoA1）。（填实测值，单位必须是 g/L；不要错填载脂蛋白 B 或脂蛋白(a)）',
  druglipo: '您目前是否正在按医嘱使用调节血脂的药物？（如他汀类、贝特类或依折麦布等；只看目前是否正在用，不按剂量判断；保健品不算）',
  drugdiab: '您目前是否正在按医嘱使用降低血糖的药物？（口服降糖药和胰岛素都算；只看目前是否正在用，不按剂量判断）',
  drughyper: '您目前是否正在按医嘱使用降压药？（单种或复方降压药都算；即使服药后血压已正常，也选“正在使用”）',
  abi: '请从最近一次血管检查报告中填写踝臂指数（ABI）。（ABI 是踝部与上臂收缩压的比值，无单位；填左右两侧的平均值，如报告已给平均值则直接照填；不要填踝部血压）',
  bapwv: '请从最近一次动脉硬化检查报告中填写肱-踝脉搏波传导速度（baPWV）。（填左右两侧的平均值，如报告已给平均值则直接照填；单位必须是 cm/s；不要填其他类型的 PWV）',
  cca_imt: '请从最近一次颈动脉超声报告中填写颈总动脉内-中膜厚度（CCA-IMT）。（优先填报告标注的双侧平均值；单位必须是 mm；不要填颈动脉斑块厚度、内径或狭窄率）',
};

// 身高(cm) + 体重(kg) → BMI。仅为收集输入时的换算便利，不参与任何风险计算；
// 无效输入返回 null（与 computeSportMet 同风格）。
export function computeBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!(h > 0) || !(w > 0)) return null;
  const m = h / 100;
  return w / (m * m);
}

// BMI 中文分类（中国成人标准，仅用于友好告知，不影响模型取值）
export function bmiCategory(bmi) {
  if (bmi == null) return '';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

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
