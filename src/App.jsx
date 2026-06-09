// src/App.jsx
// 主编排组件：管理评估流程的状态（首页 → 三步问卷 → 风险面板），
// 计算逻辑全部来自 lib/riskEngine（算法未改）。
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { VARIABLES, OUTCOMES, calcCoxRisk, checkDiagnostics } from './lib/riskEngine';
import { getHealthAdvice, MODEL_META } from './riskConfig';
import { validateInput } from './lib/validation';
import { riskLevel } from './utils/formatters';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FormWizard from './components/FormWizard';
import RiskDashboard from './components/RiskDashboard';

function LoadingView() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6 px-5 anim-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-200 opacity-50 blur-2xl animate-pulse" />
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-xl">
          <Loader2 size={40} className="text-blue-600 animate-spin-slow" strokeWidth={2} />
        </div>
      </div>
      <p className="animate-pulse text-base font-bold tracking-wide text-slate-500">Cox 模型运算中…</p>
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState({});
  const [currentLayer, setCurrentLayer] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [screen, setScreen] = useState('landing'); // landing | form | loading | dashboard
  const [activeOutcome, setActiveOutcome] = useState('cvd');

  const validationErrors = useMemo(() => {
    const errors = {};
    VARIABLES.forEach((v) => {
      if (v.type === 'number') errors[v.id] = validateInput(v, inputs[v.id]);
    });
    return errors;
  }, [inputs]);

  const diagnosticAlerts = useMemo(() => checkDiagnostics(inputs), [inputs]);

  const results = useMemo(() => {
    const calc = {};
    Object.values(OUTCOMES).forEach((o) => {
      const { riskPercent, contributions, linearPredictor, baselineSurv } = calcCoxRisk(o, VARIABLES, inputs, currentLayer);
      const level = riskLevel(riskPercent);
      calc[o.id] = {
        value: riskPercent.toFixed(1),
        level,
        advice: getHealthAdvice(currentLayer, level, o.id),
        contributions,
        linearPredictor,
        baselineSurv,
      };
    });
    return calc;
  }, [inputs, currentLayer]);

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const start = () => { setScreen('form'); goTop(); };
  const analyze = () => { setScreen('loading'); goTop(); setTimeout(() => setScreen('dashboard'), 1100); };
  const nextLayer = () => {
    if (currentLayer < 3) {
      const n = currentLayer + 1;
      setCurrentLayer(n);
      setMaxReached((m) => Math.max(m, n));
      setScreen('form');
      goTop();
    }
  };
  const jump = (n) => { setCurrentLayer(n); setScreen('form'); goTop(); };
  const editLayer = () => { setScreen('form'); goTop(); };
  const reset = () => {
    if (confirm('确定清空所有已填写的数据，重新开始评估？（可用于为家人重新评估）')) {
      setInputs({});
      setCurrentLayer(1);
      setMaxReached(1);
      setScreen('form');
      goTop();
    }
  };
  const home = () => { setScreen('landing'); goTop(); };

  return (
    <div className="min-h-screen">
      <Header screen={screen} currentLayer={currentLayer} onHome={home} onStart={start} />

      {screen === 'landing' && <LandingPage onStart={start} />}

      {screen === 'form' && (
        <FormWizard
          currentLayer={currentLayer}
          maxReached={maxReached}
          onJump={jump}
          inputs={inputs}
          setInputs={setInputs}
          validationErrors={validationErrors}
          onAnalyze={analyze}
        />
      )}

      {screen === 'loading' && <LoadingView />}

      {screen === 'dashboard' && (
        <RiskDashboard
          results={results}
          currentLayer={currentLayer}
          inputs={inputs}
          diagnosticAlerts={diagnosticAlerts}
          activeOutcome={activeOutcome}
          setActiveOutcome={setActiveOutcome}
          onNextLayer={nextLayer}
          onReset={reset}
          onEdit={editLayer}
        />
      )}

      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        多结局慢性病风险预测 · 基于{MODEL_META.cohortName} Cox 比例风险模型 · 仅供科普参考
      </footer>
    </div>
  );
}
