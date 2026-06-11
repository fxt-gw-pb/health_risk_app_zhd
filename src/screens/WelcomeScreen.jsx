// src/screens/WelcomeScreen.jsx
// 面向普通居民的高级感首页：讲清「做什么 / 怎么用」，淡化模型与队列等专业术语。
import {
  HeartPulse, Droplet, Activity, Heart, ArrowRight,
  MessagesSquare, Gauge, Leaf, Gift, Lock, BookOpenCheck, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../app/store';

const DISEASES = [
  { icon: Droplet, label: '糖尿病', desc: '了解血糖相关风险', tint: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
  { icon: Activity, label: '高血压', desc: '关注血压与心脑健康', tint: 'text-rose-500', bg: 'bg-rose-50', ring: 'ring-rose-100' },
  { icon: Heart, label: '心血管病', desc: '评估心脏与血管风险', tint: 'text-[#4F8CFF]', bg: 'bg-blue-50', ring: 'ring-blue-100' },
];

const STEPS = [
  { icon: MessagesSquare, title: '对话回答', desc: '像聊天一样回答年龄、作息、饮食等问题，不清楚的随时可以跳过。' },
  { icon: Gauge, title: '看懂风险', desc: '得到一份清晰的风险画像，知道哪些因素对你影响最大。' },
  { icon: Leaf, title: '收到建议', desc: '获得保守、靠谱的生活方式建议，明白下一步可以怎么做。' },
];

const TRUST = [
  { icon: Gift, label: '免费使用' },
  { icon: Lock, label: '保护隐私' },
  { icon: BookOpenCheck, label: '通俗易懂' },
];

export default function WelcomeScreen() {
  const { dispatch } = useStore();
  return (
    <main className="mesh-bg relative min-h-[100dvh] overflow-x-hidden">
      {/* 背景柔光 */}
      <div className="floaty pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#4F8CFF]/15 blur-3xl" />
      <div className="floaty-2 pointer-events-none absolute -right-24 top-44 h-80 w-80 rounded-full bg-[#22D3EE]/20 blur-3xl" />

      <div className="relative mx-auto max-w-md px-6 pb-12 pt-14">
        {/* 品牌徽标——医疗主题（心率脉冲），外环呼吸光晕 */}
        <div className="flex items-center gap-2.5 anim-fade-up d1">
          <span className="halo grid h-11 w-11 place-items-center rounded-2xl text-white shadow-float ring-1 ring-white/50 anim-pop"
            style={{ background: 'linear-gradient(135deg,#22D3EE,#38BDF8 45%,#4F8CFF)' }}>
            <HeartPulse size={22} strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-black text-slate-800">健康风险助手</div>
            <div className="text-[11px] font-medium text-slate-400">慢病风险 · 生活方式</div>
          </div>
        </div>

        {/* 主标题——活体渐变 */}
        <h1 className="mt-9 text-[32px] font-black leading-[1.18] tracking-tight text-slate-900 anim-fade-up d2">
          花几分钟，<br />读懂未来 5 年的
          <span className="grad-brand-text grad-animated"> 健康风险</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-500 anim-fade-up d3">
          像聊天一样回答几个简单问题，助手会帮你评估
          <span className="font-semibold text-slate-700">糖尿病、高血压、心血管病</span>
          的风险，并给出适合你的、能落地的生活方式建议。
        </p>

        {/* 信任标签 */}
        <div className="mt-5 flex flex-wrap gap-2 anim-fade-up d3">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur">
                <Icon size={13} className="text-[#22D3EE]" /> {t.label}
              </span>
            );
          })}
        </div>

        {/* 主按钮——流光 + 浮起阴影 + 外环呼吸 */}
        <button onClick={() => dispatch({ type: 'START' })}
          className="btn-sheen halo group mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-float transition active:scale-[0.98] anim-fade-up d4"
          style={{ background: 'linear-gradient(120deg,#22D3EE,#4F8CFF 55%,#5B95FF)' }}>
          开始评估 <ArrowRight size={20} className="transition-transform group-active:translate-x-0.5" />
        </button>
        <p className="mt-2.5 text-center text-xs text-slate-400 anim-fade-up d4">无需注册 · 约 2~3 分钟 · 计算在本机完成</p>

        {/* 评估什么 */}
        <section className="mt-11">
          <h2 className="text-sm font-black tracking-wide text-slate-700 anim-fade-up">为你评估三类常见慢病</h2>
          <div className="mt-3 space-y-2.5">
            {DISEASES.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={d.label} className={`lift flex items-center gap-3.5 rounded-2xl border border-white/70 bg-white/80 p-3.5 shadow-premium ring-1 ${d.ring} anim-fade-up d${i + 1}`}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${d.bg} ${d.tint}`}><Icon size={20} /></span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-slate-800">{d.label}</div>
                    <div className="text-[13px] text-slate-400">{d.desc}</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto shrink-0 text-slate-300" />
                </div>
              );
            })}
          </div>
        </section>

        {/* 怎么用 */}
        <section className="mt-11">
          <h2 className="text-sm font-black tracking-wide text-slate-700 anim-fade-up">三步，轻松完成</h2>
          <div className="mt-3.5 space-y-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-3.5 anim-fade-up">
                  <div className="relative flex flex-col items-center">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#4F8CFF] shadow-premium ring-1 ring-slate-100"><Icon size={18} /></span>
                    {i < STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-[#22D3EE]/40 to-transparent" />}
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-[#22D3EE]">0{i + 1}</span>
                      <span className="text-[15px] font-bold text-slate-800">{s.title}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 二次 CTA */}
        <button onClick={() => dispatch({ type: 'START' })}
          className="mt-9 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#4F8CFF]/25 bg-white/80 py-3.5 text-base font-bold text-[#3B7BEA] backdrop-blur transition hover:border-[#4F8CFF]/45 active:scale-[0.98] anim-fade-up">
          现在就开始 <ChevronRight size={18} />
        </button>

        {/* 安心说明 */}
        <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-white/70 bg-white/60 p-4 text-[12px] leading-relaxed text-slate-400 shadow-sm ring-1 ring-slate-100 anim-fade-up">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#22D3EE]" />
          <p>
            本工具帮助你认识自身健康风险、养成更好的生活习惯，<b className="font-semibold text-slate-500">不替代医生诊断</b>，
            也不会上传你的身份信息。评估方法参考国内外权威健康指南与研究；如有不适，请及时就医。
          </p>
        </div>
      </div>
    </main>
  );
}
