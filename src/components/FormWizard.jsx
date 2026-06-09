// src/components/FormWizard.jsx
import {
  Info, Sparkles, ChevronDown, AlertTriangle, Stethoscope,
  User, Watch, Cigarette, Dna, HeartPulse, Syringe, Droplet, Pill, Activity,
} from 'lucide-react';
import Stepper from './Stepper';
import { VARIABLES, SPORT_MET_WEIGHTS } from '../lib/riskEngine';
import { STEP_META, CN_ORDINAL } from '../lib/uiTokens';

// 每层指标的分组（仅 UI 分组，不影响计算）
const GROUPS = {
  1: [
    { title: '基本信息', icon: User, ids: ['age', 'sex', 'bmi', 'waist'] },
    { title: '生活方式', icon: Watch, ids: ['sleephour', 'sithour', 'sport_total'] },
    { title: '行为习惯', icon: Cigarette, ids: ['smoke', 'drink'] },
    { title: '家族史与既往病史', icon: Dna, ids: ['dm2_family', 'ht_family', 'stroke_family', 'ht_prevalent', 'cvd_prevalent', 't2d_prevalent'] },
  ],
  2: [
    { title: '血压', icon: HeartPulse, ids: ['sbp', 'dbp'] },
    { title: '血糖', icon: Syringe, ids: ['fbg', 'hba1c'] },
    { title: '血脂', icon: Droplet, ids: ['tc', 'hdl', 'ldl', 'tg', 'apoa'] },
    { title: '用药情况', icon: Pill, ids: ['druglipo', 'drugdiab', 'drughyper'] },
  ],
  3: [
    { title: '血管影像学检查', icon: Activity, ids: ['abi', 'bapwv', 'cca_imt'] },
  ],
};
const STEP_ICONS = { 1: User, 2: Syringe, 3: Activity };
const byId = Object.fromEntries(VARIABLES.map((v) => [v.id, v]));

const inputBase =
  'w-full rounded-xl border-2 border-slate-100 bg-slate-50/70 p-3.5 font-medium text-slate-700 transition-all outline-none placeholder:text-slate-300 focus:bg-white ring-focus';

function FieldShell({ v, children, error }) {
  const VIcon = v.icon;
  return (
    <div className="group">
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-focus-within:bg-blue-50 group-focus-within:text-blue-600">
          <VIcon size={17} />
        </span>
        {v.label}
        {v.hint && <span className="ml-1 text-xs font-normal text-slate-400">（{v.hint}）</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
          <AlertTriangle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function NumberField({ v, value, onChange, error }) {
  return (
    <FieldShell v={v} error={error}>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder={`参考均值 ${v.displayMean}`}
          className={`${inputBase} tnum ${error ? 'border-rose-200' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(v.id, e.target.value)}
          onWheel={(e) => e.target.blur()}
          min={v.min}
          max={v.max}
        />
        {v.unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{v.unit}</span>}
      </div>
    </FieldShell>
  );
}

function SelectField({ v, value, onChange }) {
  const empty = value === '' || value === undefined;
  return (
    <FieldShell v={v}>
      <div className="relative">
        <select
          className={`${inputBase} appearance-none pr-10 ${empty ? 'text-slate-400' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(v.id, e.target.value)}
        >
          <option value="">请选择…</option>
          {v.options.map((o) => (
            <option key={o.value} value={o.value} className="text-slate-700">{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </FieldShell>
  );
}

// 运动量：高/低强度时长 → 自动换算 MET·h/周（逻辑从原 App.jsx 搬运）
function SportField({ v, inputs, setInputs, error }) {
  const highHours = inputs.sport_high_hours ?? '';
  const lowHours = inputs.sport_low_hours ?? '';
  const hN = parseFloat(highHours);
  const lN = parseFloat(lowHours);
  const hasH = highHours !== '' && !isNaN(hN) && hN >= 0;
  const hasL = lowHours !== '' && !isNaN(lN) && lN >= 0;
  const met = hasH || hasL ? (hasH ? hN * SPORT_MET_WEIGHTS.high : 0) + (hasL ? lN * SPORT_MET_WEIGHTS.low : 0) : null;

  const onSport = (field, value) =>
    setInputs((prev) => {
      const next = { ...prev, [field]: value };
      const h = parseFloat(next.sport_high_hours);
      const l = parseFloat(next.sport_low_hours);
      const hh = next.sport_high_hours !== '' && next.sport_high_hours !== undefined && !isNaN(h) && h >= 0;
      const ll = next.sport_low_hours !== '' && next.sport_low_hours !== undefined && !isNaN(l) && l >= 0;
      if (hh || ll) next.sport_total = ((hh ? h * SPORT_MET_WEIGHTS.high : 0) + (ll ? l * SPORT_MET_WEIGHTS.low : 0)).toFixed(2);
      else delete next.sport_total;
      return next;
    });

  return (
    <FieldShell v={v} error={error}>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input type="number" placeholder="高强度时长" className={`${inputBase} tnum`} value={highHours} min={0} max={40} step={0.5}
            onChange={(e) => onSport('sport_high_hours', e.target.value)} onWheel={(e) => e.target.blur()} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">小时/周</span>
        </div>
        <div className="relative">
          <input type="number" placeholder="低强度时长" className={`${inputBase} tnum`} value={lowHours} min={0} max={80} step={0.5}
            onChange={(e) => onSport('sport_low_hours', e.target.value)} onWheel={(e) => e.target.blur()} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">小时/周</span>
        </div>
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600">
        <Sparkles size={13} />
        {met !== null ? `自动换算：${met.toFixed(1)} MET·h/周` : `高 / 低强度时长可同时填写，系统自动换算（参考均值 ${v.displayMean}）`}
      </p>
    </FieldShell>
  );
}

function Field({ v, inputs, setInputs, error }) {
  if (v.id === 'sport_total') return <SportField v={v} inputs={inputs} setInputs={setInputs} error={error} />;
  const onChange = (id, value) => setInputs((prev) => ({ ...prev, [id]: value }));
  if (v.type === 'select') return <SelectField v={v} value={inputs[v.id]} onChange={onChange} />;
  return <NumberField v={v} value={inputs[v.id]} onChange={onChange} error={error} />;
}

export default function FormWizard({ currentLayer, maxReached, onJump, inputs, setInputs, validationErrors, onAnalyze }) {
  const hasErrors = Object.values(validationErrors).some((e) => e !== null);
  const step = STEP_META[currentLayer - 1];
  const StepIcon = STEP_ICONS[currentLayer];
  const ids = GROUPS[currentLayer].flatMap((g) => g.ids);
  const filled = ids.filter((id) => inputs[id] !== undefined && inputs[id] !== '').length;
  const total = ids.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 anim-fade-up">
      <Stepper current={currentLayer} maxReached={maxReached} onJump={onJump} />

      {/* 层级说明卡片 */}
      <div className="flex items-start gap-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
          <StepIcon size={22} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-800">第{CN_ORDINAL[currentLayer - 1]}步 · {step.title}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <Info size={14} className="text-blue-400" />
            不知道某项指标可以留空，系统将使用队列人群均值估算。
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <div className="tnum text-2xl font-black text-blue-600">{filled}<span className="text-base text-slate-300">/{total}</span></div>
          <div className="text-[11px] text-slate-400">已填写</div>
        </div>
      </div>

      {/* 分组表单 */}
      {GROUPS[currentLayer].map((g, gi) => {
        const GIcon = g.icon;
        return (
          <div key={gi} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <GIcon size={16} className="text-blue-500" />
              <h3 className="text-sm font-black tracking-wide text-slate-700">{g.title}</h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.ids.map((id) => (
                <div key={id} className={id === 'sport_total' ? 'sm:col-span-2' : ''}>
                  <Field v={byId[id]} inputs={inputs} setInputs={setInputs} error={validationErrors[id]} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={onAnalyze}
        disabled={hasErrors}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-bold shadow-xl transition active:scale-95 ${
          hasErrors
            ? 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
        }`}
      >
        <Stethoscope size={22} className={hasErrors ? '' : 'animate-heartbeat'} />
        {currentLayer === 1 ? '生成风险报告' : '更新风险报告'}
      </button>
      {hasErrors && <p className="text-center text-xs font-medium text-rose-500">请先修正上方标红的输入项</p>}
    </div>
  );
}
