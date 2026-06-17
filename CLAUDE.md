# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Chat-first AI health-risk assistant (健康风险助手). Users answer questions conversationally to get a 5-year risk estimate for **type-2 diabetes / hypertension / cardiovascular disease** (Cox proportional-hazards model from the 房山家系队列 2016–2024), plus lifestyle-education Q&A via DeepSeek + a self-built BM25 RAG over authoritative guidelines. UI text and code comments are Chinese.

## Commands

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5199 (NOT 5173 — README is stale; port is set in vite.config.js)
npm run build    # → dist/
npm run lint     # eslint
npm test         # vitest run (21 tests)
npm run test:watch
```

Single test: `npx vitest run src/intake/__tests__/flow.test.js` or filter by name `npx vitest run -t "nextVarId"`.

`npm run dev` serves the `api/` serverless functions at `/api/*` via the `devApi` plugin in `vite.config.js`, so the AI features work locally. They require `DEEPSEEK_API_KEY` in a root `.env` (copy `.env.example`); without it, extract/answer return 503 and the app **degrades to its deterministic flow** rather than breaking.

### Known-good lint baseline
`npm run lint` reports **10 pre-existing errors** (`process is not defined` in `api/_lib/deepseek.js` + `vite.config.js`, which are Node files lint-configured as browser; and one `react-refresh/only-export-components` in `store.jsx` from the `useStore` export). These are not yours — only worry about *new* errors you introduce.

## The frozen medical kernel — the #1 constraint

All risk math is **frozen and golden-tested**. These four files carry a `⚠️ FROZEN MEDICAL KERNEL` banner and must not be changed:
`src/riskConfig.js` (OUTCOMES/VARIABLES/betas/means/diagnostics), `src/lib/riskEngine.js` (`calcCoxRisk`: `Risk = 1 − S₀^exp(LP)`, `LP = Σβᵢ(xᵢ−x̄ᵢ)`, missing input → cohort mean → zero contribution), `src/lib/validation.js`, `src/utils/formatters.js` (risk thresholds + sport MET conversion).

- **Never import these physical files directly.** The single allowed import surface is `src/kernel/index.js` (`@/kernel`). All new code (intake, chat, report, backend) imports from there.
- `src/kernel/__tests__/cox.golden.test.js` snapshots risk output for fixed fixtures. Do **not** run `vitest -u` to "fix" a failing golden snapshot — a changed snapshot means the model was altered and the change should be rejected unless it's a reviewed kernel change.
- AI never computes or modifies risk. It only guides / explains / educates.

## Architecture: the chat orchestration loop

`src/app/store.jsx` is a `useReducer` + Context store and the **single source of truth**. Two fields drive everything:
- `messages[]` — the rendered thread (each `{kind, role, ...}`; kinds: `text`, `question`, `answer`, `confirm`, `layer_summary`, `report`, `why`, `ai_stream`).
- `pending` — a **Composer descriptor** telling the bottom input what to render: `{type: 'number'|'select'|'bmi'|'sport'|'choice'|'freechat'|'postreport'}`.

The loop: reducer sets `pending` → `src/chat/Composer.jsx` renders the matching input component → user action dispatches (`ANSWER`/`BMI`/`SPORT`/`SKIP`/`CHOICE`/…) → reducer appends messages + computes the next `pending` via `nextStep()`. `src/chat/ChatThread.jsx` maps `messages` to bubble components.

**Deterministic intake** lives in `src/intake/questionFlow.js`: question order/prompts are derived from the kernel's `VARIABLES`, grouped into 3 progressive layers (`LAYER_VARS`: ① basics → ② blood labs → ③ vascular imaging). It builds layer summaries, the risk report, and the "why" explanation — **never any risk numbers in the qualitative summaries**. This file is also where intake-only helpers live (`answerEcho`, `computeBmi`, `bmiCategory`) precisely *because* the kernel's `formatters.js` is frozen.

### Special multi-input questions (the pattern to copy)
Most variables render as a plain number/select input. Some collect raw inputs and **derive** the kernel value client-side, then write a single value into `inputs`:
- `sport_total` ← high/low-intensity hours → `computeSportMet` (MET·h/week).
- `bmi` ← height + weight → `computeBmi` → BMI.

To add another: branch in `pendingForVar()` (store.jsx), add a reducer action that computes + stores the value and pushes a `confirm` chip, and add the matching composer in Composer.jsx. The value fed to the model stays semantically identical, so golden tests are unaffected.

### Two entry modes
Intake (answer questions → report → free chat) and **free chat** (skip questions entirely). Welcome screen and an above-input pill both offer `FREE_CHAT`/`SKIP_TO_FREECHAT`; `BEGIN_INTAKE` switches back into the questionnaire while preserving history. Every entry opens with `ASSISTANT_INTRO` (identity + "no diagnosis/treatment, reference only" disclaimer).

### AI degradation is mandatory
Front-end ↔ backend goes through `src/copilot/api.js` + `orchestrate.js`. Every AI path has a deterministic fallback (e.g. free-text answer → `/api/extract`, but failure falls back to a clarify prompt; "why" → streamed RAG, but falls back to `buildWhy`). The app must always work without the backend.

## Backend (`api/` + `server/`)

Two handlers, Vercel-Node style (`export default function handler(req,res)`):
- `api/extract.js` — POST `{text, varSpec}` → `{ok, value}` | `{ok:false, clarify}`. NL → metric value via DeepSeek JSON mode.
- `api/answer.js` — POST, **SSE** streaming `data: {type:'delta'|'replace'|'sources'|'done'}`. Layer explanation / "why" / free Q&A.

Shared `api/_lib/`: `deepseek.js` (OpenAI-compatible client), `safety.js` (guardrails), `retrieve.js` (BM25-lite over `api/rag/chunks.json`, 238 chunks, custom CJK uni/bi-gram tokenizer, zero deps), `http.js`.

**Safety model (`_lib/safety.js`)** — three guardrails: system prompt allows only lifestyle/education/metric & risk explanation and forbids drugs/dosage/diagnosis/treatment/prescription; out-of-domain questions get a fixed refusal; and `scanForbidden()` does an exit-scan of accumulated output (drug-name/dosage/diagnosis regexes) and replaces with `SAFE_REPLACE`. **Only risk level + Top-5 factor labels are sent to the backend — never raw inputs**, since risk is computed locally.

The same two handlers run in two places: Vercel auto-detects `api/` (`_lib`'s underscore keeps it off the route table), and `server/index.mjs` is a zero-dependency `node:http` wrapper (CORS + `/health`) for Render / Tencent SCF / Aliyun FC.

## Deployment & config

- **GitHub Pages** (`.github/workflows/deploy.yml`, on push to `main`): static front-end; full AI requires a `VITE_API_BASE` repo *variable* pointing at a deployed backend, else `/api` is same-origin and AI degrades.
- `vite.config.js` `base`: `/` when `VERCEL` env is set, else `/health_risk_app_zhd/` (Pages subpath — keep in sync with the repo name).
- `VITE_API_BASE` empty = same-origin `/api` (Vercel / local); set = cross-origin backend (Pages + Render).

## Repo conventions

- This repo uses SSH for GitHub: `git@github.com:fxt-gw-pb/health_risk_app_zhd.git`. The owner pushes directly to `main`.
- Keep Chinese for UI strings and comments to match the codebase.
