// 用系统 Chrome 驱动本地 dev server，移动端视口逐页截图。
import puppeteer from '/Users/fpb/research/医创赛/health_risk_app_zhd/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5199/health_risk_app_zhd/';
const OUT = '/Users/fpb/research/医创赛/health_risk_app_zhd/宣传材料/截图';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-proxy-server', '--hide-scrollbars', '--force-color-profile=srgb', '--no-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const shot = async (name, full = false) => {
  await sleep(850); // 等淡入动画与自动滚动结束
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('📸', name);
};

// 在浏览器内按文本点击 button，返回是否命中
const clickText = (re) => page.evaluate((reStr) => {
  const rx = new RegExp(reStr);
  const b = [...document.querySelectorAll('button')].find((x) => rx.test(x.textContent.trim()));
  if (b) { b.click(); return true; }
  return false;
}, re.source);

// 读取底部输入区当前状态
const composer = () => page.evaluate(() => {
  const root = document.querySelector('.safe-b');
  if (!root) return { type: 'none' };
  const hasBmi = !!root.querySelector('input[placeholder*="身高"]');
  const hasSport = !!root.querySelector('input[placeholder*="高强度"]');
  const text = root.querySelector('input[type="text"]');
  const chips = [...root.querySelectorAll('button')]
    .filter((b) => b.className.includes('bg-[#4F8CFF]/5'))
    .map((b) => b.textContent.trim());
  const choice = [...root.querySelectorAll('button')]
    .map((b) => b.textContent.trim())
    .filter((t) => /继续补充|风险报告/.test(t));
  return { hasBmi, hasSport, hasText: !!text, chips, choice };
});

const typeNumber = async (val) => {
  const sel = '.safe-b input[type="text"]';
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, String(val));
  await page.keyboard.press('Enter');
  await sleep(500);
};
const clickFirstChip = async () => {
  await page.evaluate(() => {
    const root = document.querySelector('.safe-b');
    const chip = [...root.querySelectorAll('button')]
      .find((b) => b.className.includes('bg-[#4F8CFF]/5'));
    chip?.click();
  });
  await sleep(500);
};
const fillTwo = async (ph1, v1, ph2, v2) => {
  await page.type(`.safe-b input[placeholder*="${ph1}"]`, String(v1));
  await page.type(`.safe-b input[placeholder*="${ph2}"]`, String(v2));
  await sleep(400);
};

// ── 1. 首页（整页长图）──
await page.goto(URL, { waitUntil: 'networkidle2' });
await page.waitForSelector('button');
await shot('01_welcome', true);

// ── 2. 进入问诊：助手介绍 + 免责 + 第一题 ──
await clickText(/开始评估/);
await page.waitForSelector('.safe-b input');
await shot('02_chat_intro');

// 答年龄(number) → 性别(select)
await typeNumber(45);

// ── 3. 选择题（性别快捷选项）──
await shot('03_select_question');
await clickFirstChip(); // 选「男」→ BMI

// ── 4. BMI 自动换算（填好后展示实时预览）──
await page.waitForSelector('.safe-b input[placeholder*="身高"]');
await fillTwo('身高', 170, '体重', 65);
await shot('04_bmi_autocalc');
await clickText(/完成/); // 提交 BMI → 确认条 + 腰围题
await sleep(600);

// ── 5. 答题确认反馈（“已记录 · BMI ≈ …”）──
await shot('05_confirm_feedback');

// ── 快进剩余第一层 ──
await typeNumber(85);   // 腰围
await typeNumber(7);    // 睡眠
await typeNumber(6);    // 静坐
// 运动（sport 双输入）
await page.waitForSelector('.safe-b input[placeholder*="高强度"]');
await fillTwo('高强度', 2, '低强度', 3);
await clickText(/完成/);
await sleep(600);
// 其余均为选择题：循环点第一项，直到出现“看报告/继续补充”分支
for (let i = 0; i < 12; i++) {
  const s = await composer();
  if (s.choice.length) break;
  if (s.hasBmi) { await fillTwo('身高', 170, '体重', 65); await clickText(/完成/); await sleep(500); continue; }
  if (s.hasSport) { await fillTwo('高强度', 2, '低强度', 3); await clickText(/完成/); await sleep(500); continue; }
  if (s.chips.length) { await clickFirstChip(); continue; }
  if (s.hasText) { await typeNumber(5); continue; }
  await sleep(400);
}

// ── 6. 本层定性解读 + 分支选项 ──
await shot('06_layer_summary');

// ── 7. 风险报告 ──
await clickText(/直接看风险报告|生成我的风险报告/);
await page.waitForFunction(() => document.body.innerText.includes('你的健康风险报告'), { timeout: 8000 });
await sleep(700);
// 把报告卡片顶部对齐到可视区顶部，截“手机屏”样式
await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')];
  const el = all.find((d) => d.textContent.trim().startsWith('你的健康风险报告'));
  el?.scrollIntoView({ block: 'start' });
});
await shot('07_report');

// 7b. 整份报告长图（打破 fixed 布局让 fullPage 展开）
await page.addStyleTag({ content: '.fixed{position:static !important;height:auto !important} main{overflow:visible !important;height:auto !important} .no-scrollbar{overflow:visible !important}' });
await sleep(500);
await shot('07b_report_full', true);

// ── 8. 自由聊天入口（重新载入，点“不想答题”）──
await page.goto(URL, { waitUntil: 'networkidle2' });
await page.waitForSelector('button');
await clickText(/不想答题/);
await page.waitForFunction(() => document.body.innerText.includes('开始健康评估'), { timeout: 8000 });
await shot('08_free_chat');

await browser.close();
console.log('✅ done');
