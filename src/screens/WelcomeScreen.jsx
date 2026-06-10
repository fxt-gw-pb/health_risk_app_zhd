// src/screens/WelcomeScreen.jsx
import { Sparkles, Droplet, HeartPulse, Heart, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useStore } from '../app/store';

const CHECKS = [
  { icon: Droplet, label: '糖尿病风险', color: 'text-emerald-500' },
  { icon: HeartPulse, label: '高血压风险', color: 'text-rose-500' },
  { icon: Heart, label: '心血管病风险', color: 'text-[#4F8CFF]' },
];

export default function WelcomeScreen() {
  const { dispatch } = useStore();
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#F6F9FC]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#4F8CFF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-[#7DD3FC]/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <span className="grid h-16 w-16 place-items-center rounded-3xl text-white shadow-xl shadow-blue-500/25 anim-pop" style={{ background: 'linear-gradient(135deg,#4F8CFF,#7DD3FC)' }}>
          <Sparkles size={30} />
        </span>
        <h1 className="mt-6 text-[28px] font-black leading-tight text-slate-900 anim-fade-up">
          你好，我是你的<br />健康风险助手
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500 anim-fade-up">
          我会通过几个简单的问题，帮你评估未来 5 年的慢病风险：
        </p>

        <div className="mt-5 space-y-2.5 anim-fade-up">
          {CHECKS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-slate-50 ${c.color}`}><Icon size={18} /></span>
                <span className="font-bold text-slate-700">{c.label}</span>
                <ShieldCheck size={18} className="ml-auto text-emerald-500" />
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400 anim-fade-up">
          <Clock size={15} /> 预计耗时 2~3 分钟 · 风险计算在本机完成
        </div>

        <button onClick={() => dispatch({ type: 'START' })}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-xl shadow-blue-500/30 transition active:scale-95 anim-fade-up"
          style={{ background: 'linear-gradient(135deg,#4F8CFF,#5B95FF)' }}>
          开始评估 <ArrowRight size={20} />
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400 anim-fade-up">
          本工具仅供健康风险参考与科普，不替代医生诊断。
        </p>
      </div>
    </div>
  );
}
