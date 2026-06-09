// src/components/LandingPage.jsx
import {
  ArrowRight, ShieldCheck, ShieldAlert, Layers, Stethoscope, Activity, FlaskConical,
  FileText, BarChart3, ClipboardList, Gauge, ChevronRight,
} from 'lucide-react';
import { ACCENT, levelMeta } from '../lib/uiTokens';
import { MODEL_META } from '../riskConfig';

/* 右侧抽象“风险报告卡”图形（示意数据，仅用于首页展示） */
function HeroGraphic() {
  const rows = [
    { name: '新发糖尿病', accent: 'emerald', pct: 7.4, level: '低危' },
    { name: '新发心血管病', accent: 'blue', pct: 16.2, level: '中危' },
    { name: '新发高血压', accent: 'rose', pct: 24.8, level: '高危' },
  ];
  return (
    <div className="relative">
      <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-cyan-200/40 blur-2xl" />
      <div className="absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl" />
      <div className="relative rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl floaty">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText size={16} className="text-blue-500" /> 风险评估报告
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-400">未来 5 年</span>
        </div>
        <div className="space-y-4">
          {rows.map((r, i) => {
            const lm = levelMeta(r.level);
            const ac = ACCENT[r.accent];
            const pos = (Math.min(r.pct, 40) / 40) * 100;
            return (
              <div key={i}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <span className={`h-2 w-2 rounded-full ${ac.dot}`} />
                    {r.name}
                  </span>
                  <span className={`tnum font-black ${lm.text}`}>{r.pct}%</span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${lm.bar}`} style={{ width: `${pos}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-50/70 p-3 text-[11px] font-medium text-blue-700">
          <ShieldCheck size={15} /> 纯浏览器本地计算 · 数据不上传
        </div>
      </div>
      <div className="floaty-2 absolute -right-3 top-8 hidden rounded-2xl border border-white bg-white px-3 py-2 shadow-xl md:block">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <BarChart3 size={14} className="text-cyan-500" /> C-index 最高 0.75
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  const Icon = icon;
  const ac = ACCENT[accent];
  return (
    <div className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${ac.grad} text-white shadow-lg`}>
        <Icon size={22} />
      </div>
      <h3 className="mb-1.5 text-base font-bold text-slate-800">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

export default function LandingPage({ onStart }) {
  const stats = [
    { k: 'C-index', v: '最高 0.75', d: '第三层模型判别度' },
    { k: '队列来源', v: '房山家系', d: '2016—2024 长期随访' },
    { k: '随访规模', v: '数千人', d: '流行病学家系队列' },
    { k: '数据隐私', v: '100% 本地', d: '浏览器计算·不上传' },
  ];
  const flow = [
    { t: '填写基础信息', d: '年龄、BMI、生活方式等', icon: ClipboardList },
    { t: '查看初步风险', d: '三种结局即时预测', icon: Gauge },
    { t: '补充检查指标', d: '血液 / 血管影像', icon: FlaskConical },
    { t: '获得精细报告', d: '解释 · 建议 · 透明度', icon: FileText },
  ];
  return (
    <main className="anim-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-cyan-50/40 to-[#f6f9fc]" />
        <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="anim-fade-up">
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-blue-100 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 基于 Cox 比例风险模型
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight text-slate-900 md:text-[44px]">
              多结局慢性病<br />
              <span className="grad-text">风险预测</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-500">
              基于房山家系队列与 Cox 比例风险模型，预测未来 5 年
              <span className="font-semibold text-slate-700">糖尿病、心血管疾病和高血压</span>风险。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-500/30 transition hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
              >
                开始评估 <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#how" className="inline-flex items-center gap-1.5 rounded-full px-5 py-3.5 text-base font-semibold text-slate-600 transition hover:bg-white">
                了解流程
              </a>
            </div>
            <div className="mt-7 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> 数据不上传</span>
              <span className="flex items-center gap-1.5"><Layers size={14} className="text-blue-500" /> 三层渐进式</span>
              <span className="flex items-center gap-1.5"><Stethoscope size={14} className="text-cyan-500" /> 科普参考</span>
            </div>
          </div>
          <div className="anim-pop">
            <HeroGraphic />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-sm md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-5 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.k}</div>
              <div className="mt-1 text-xl font-black grad-text">{s.v}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">一个可信、透明的健康风险工具</h2>
          <p className="mt-3 text-sm text-slate-500">能填多少算多少 —— 留空指标自动用队列人群均值估算</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard accent="blue" icon={Layers} title="三层渐进式评估" desc="基础信息 → 血液检查 → 血管影像，信息越多，预测越精细。每一层都可单独出结果。" />
          <FeatureCard accent="emerald" icon={Activity} title="多结局风险预测" desc="同时预测未来 5 年新发糖尿病、心血管疾病与高血压三种结局，分层提示高 / 中 / 低危。" />
          <FeatureCard accent="rose" icon={FlaskConical} title="模型透明可解释" desc="公开 C-index、Cox 公式与各变量贡献度，并在指标达诊断标准时提示就医，不做黑箱预测。" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
          <h2 className="mb-8 text-center text-xl font-black tracking-tight text-slate-900 md:text-2xl">四步获得你的风险报告</h2>
          <div className="grid gap-5 md:grid-cols-4">
            {flow.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="relative">
                  <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-white p-5 ring-1 ring-slate-100">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white">{i + 1}</span>
                      <Icon size={20} className="text-blue-400" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">{f.t}</div>
                    <div className="mt-1 text-xs text-slate-500">{f.d}</div>
                  </div>
                  {i < flow.length - 1 && (
                    <ChevronRight size={20} className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA + 免责声明 */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 px-8 py-12 text-center shadow-2xl shadow-blue-500/30">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/10" />
          <h2 className="relative text-2xl font-black text-white md:text-3xl">用几分钟，了解你的 5 年慢病风险</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-blue-50/90">无需注册，所有计算在你的浏览器本地完成。</p>
          <button
            onClick={onStart}
            className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg transition hover:scale-[1.03] active:scale-95"
          >
            立即开始评估 <ArrowRight size={19} />
          </button>
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl items-start justify-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/70 p-4">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-700">
            本工具仅用于健康风险评估和科普参考，不能替代医生诊断或临床决策。如有不适或健康疑问，请及时就医。
            （模型来源：{MODEL_META.cohortName}，{MODEL_META.followUpYears}）
          </p>
        </div>
      </section>
    </main>
  );
}
