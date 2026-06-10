// src/app/store.jsx
// ───────────────────────────────────────────────────────────────────────
// 全局状态：chat-first 编排。内核(@/kernel)只读调用；风险计算全部本地。
// 消息线程(messages)是显示的单一来源；pending 描述底部 Composer 当前该显示什么。
// ───────────────────────────────────────────────────────────────────────
import { createContext, useContext, useReducer } from 'react';
import { computeSportMet } from '../kernel';
import {
  BY_ID, LAYER_INTRO, QUESTION_PROMPTS, nextVarId,
  buildLayerSummary, buildReport, buildWhy, layerTitle,
} from '../intake/questionFlow';

const initialState = {
  screen: 'welcome',       // 'welcome' | 'chat'
  inputs: {},              // 传给内核的输入对象（值存字符串，语义与原版一致）
  skipped: {},             // varId -> true
  currentLayer: 1,
  maxLayer: 1,
  messages: [],            // {id, role, kind, ...}
  pending: null,           // Composer 描述符
  report: null,
  _id: 0,
};

// ---- 纯函数：根据当前状态决定「下一步」要 push 的消息和 pending ----
function pendingForVar(varId) {
  const v = BY_ID[varId];
  if (varId === 'sport_total') return { type: 'sport', varId };
  if (v.type === 'select') return { type: 'select', varId, options: v.options };
  return { type: 'number', varId, unit: v.unit, displayMean: v.displayMean };
}

function questionMsg(varId) {
  return { kind: 'question', text: QUESTION_PROMPTS[varId] || BY_ID[varId].label, varId };
}

// 计算「作答之后」该出现的消息 + pending（不含已 push 的用户气泡）
function nextStep(state) {
  const varId = nextVarId(state.currentLayer, state.inputs, state.skipped);
  if (varId) return { msgs: [questionMsg(varId)], pending: pendingForVar(varId) };

  // 本层问题答完 → 定性解读（无数字）
  const summary = { kind: 'layer_summary', layer: state.currentLayer, text: buildLayerSummary(state.inputs, state.currentLayer) };
  if (state.currentLayer < 3) {
    return {
      msgs: [summary, { kind: 'text', text: '你可以继续补充更精细的指标，或者现在就看你的风险报告 👇' }],
      pending: { type: 'choice', options: [
        { id: 'next', label: `继续补充「${layerTitle(state.currentLayer + 1)}」指标` },
        { id: 'report', label: '直接看风险报告' },
      ] },
    };
  }
  return { msgs: [summary], pending: { type: 'choice', options: [{ id: 'report', label: '生成我的风险报告' }] } };
}

function push(state, msgs, pending) {
  let id = state._id;
  const withIds = msgs.map((m) => ({ id: ++id, role: m.role || 'ai', ...m }));
  return { ...state, _id: id, messages: [...state.messages, ...withIds], pending: pending !== undefined ? pending : state.pending };
}

function reducer(state, action) {
  switch (action.type) {
    case 'START': {
      let s = { ...initialState, screen: 'chat' };
      const step = nextStep(s);
      return push(s, [{ kind: 'text', text: LAYER_INTRO[1] }, ...step.msgs], step.pending);
    }

    case 'ANSWER': {
      // value 存为字符串，语义与原版 select/number 一致
      const s = { ...state, inputs: { ...state.inputs, [action.varId]: String(action.value) } };
      const userBubble = { kind: 'answer', role: 'user', text: action.display };
      const step = nextStep(s);
      return push(s, [userBubble, ...step.msgs], step.pending);
    }

    case 'SPORT': {
      const met = computeSportMet(action.high, action.low);
      if (met == null) return reducer(state, { type: 'SKIP', varId: 'sport_total' });
      const inputs = {
        ...state.inputs,
        sport_high_hours: action.high,
        sport_low_hours: action.low,
        sport_total: met.toFixed(2),
      };
      const s = { ...state, inputs };
      const parts = [];
      if (action.high) parts.push(`高强度 ${action.high}h`);
      if (action.low) parts.push(`低强度 ${action.low}h`);
      const userBubble = { kind: 'answer', role: 'user', text: `${parts.join(' · ')}（≈ ${met.toFixed(1)} MET·h/周）` };
      const step = nextStep(s);
      return push(s, [userBubble, ...step.msgs], step.pending);
    }

    case 'SKIP': {
      const s = { ...state, skipped: { ...state.skipped, [action.varId]: true } };
      const userBubble = { kind: 'answer', role: 'user', text: '跳过', muted: true };
      const step = nextStep(s);
      return push(s, [userBubble, ...step.msgs], step.pending);
    }

    case 'CHOICE': {
      if (action.id === 'next') {
        const layer = state.currentLayer + 1;
        let s = { ...state, currentLayer: layer, maxLayer: Math.max(state.maxLayer, layer) };
        const step = nextStep(s);
        return push(s, [{ kind: 'text', text: LAYER_INTRO[layer] }, ...step.msgs], step.pending);
      }
      // report
      const report = buildReport(state.inputs, state.currentLayer);
      return push({ ...state, report }, [{ kind: 'report' }], { type: 'postreport' });
    }

    case 'WHY': {
      const why = buildWhy(state.inputs, state.currentLayer, action.oid);
      return push(state, [{ kind: 'why', ...why }], state.pending);
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 <StoreProvider> 内使用');
  return ctx;
}
