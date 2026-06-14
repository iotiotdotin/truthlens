# TruthLens

TruthLens is a Next.js investor diligence tool for stress-testing startup ideas. A founder enters a pitch, the app streams live analysis progress to a terminal-style feed, runs five specialist AI judge agents in parallel, synthesizes the results with a consensus agent, updates the dashboard with the final verdict, and opens a dedicated investment report from the real analysis output.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- OpenAI Responses API
- Server-Sent Events

## Quick Start

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

Run the dev server:

```bash
npm run dev
```

Open the local URL printed by Next.js, usually:

```bash
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run format
```

## Project Structure

```text
verdict-ai/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── stream/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── report/
│       └── page.tsx
├── components/
│   ├── theme-provider.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/
│   ├── agents/
│   │   ├── analyze.ts
│   │   ├── competition.ts
│   │   ├── consensus.ts
│   │   ├── cto.ts
│   │   ├── macro.ts
│   │   ├── market.ts
│   │   ├── originality.ts
│   │   └── types.ts
│   ├── report.ts
│   └── utils.ts
├── components.json
├── package.json
└── tsconfig.json
```

## Architecture Overview

TruthLens has three main layers:

1. Frontend experience in `app/page.tsx`
2. Streaming orchestration endpoint in `app/api/analyze/stream/route.ts`
3. AI judge agents in `lib/agents/*`

The frontend does not calculate the final report from static UI data. It receives the final SSE `result` event, stores it in `finalVerdict`, renders the judge cards from `finalVerdict.results`, renders the investment summary from `finalVerdict.consensus`, and writes the latest report payload to `sessionStorage` before routing to `/report`.

## End-to-End Flow

1. The user enters a startup pitch in the textarea on `app/page.tsx`.
2. The user clicks `Analyze Idea`.
3. The frontend clears terminal logs and opens:

```ts
new EventSource(`/api/analyze/stream?pitch=${encodeURIComponent(pitch)}`)
```

4. The SSE endpoint sends starting messages for all five agents.
5. The endpoint runs all five judge agents in parallel using `Promise.all`.
6. Each agent calls the OpenAI Responses API and returns a `JudgeResult`.
7. As each agent completes, the endpoint streams a completion message such as:

```text
[Market] Complete (score: 82)
```

8. After all judge agents finish, the endpoint runs `consensusAgent`.
9. The endpoint streams:

```text
[Consensus] Building investment committee verdict...
[Consensus] Complete
```

10. The endpoint sends a final named SSE event:

```text
event: result
data: { ...final verdict JSON... }
```

11. The frontend stores the final verdict and updates:

- Composite conviction score
- Risk
- Opportunity
- Recommendation
- Five judge cards
- Open Report button state

## Report Page

File:

```text
app/report/page.tsx
```

When analysis completes, the homepage shows an `Open Report` button. Clicking it stores the latest report payload in `sessionStorage` under the shared key from:

```text
lib/report.ts
```

Then it navigates to:

```text
/report
```

The report page displays:

- Startup pitch
- Final investment score
- Recommendation
- Biggest risk
- Biggest opportunity
- Per-judge scores
- Per-judge verdicts
- Per-judge killer questions

The page includes:

- Back to Analysis
- Print
- Download Report
- Friendly empty state if no report data exists

## SSE Endpoint

File:

```text
app/api/analyze/stream/route.ts
```

The route returns:

```http
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

Progress messages use standard SSE framing:

```text
data: [Market] Starting analysis...

```

Named result events use:

```text
event: result
data: {"results":{...},"consensus":{...}}

```

## Agent System

All judge agents return:

```ts
export type JudgeResult = {
  score: number
  verdict: string
  killerQuestion: string
}
```

Defined in:

```text
lib/agents/types.ts
```

### Market Agent

File:

```text
lib/agents/market.ts
```

Evaluates product-market fit only.

### Competition Agent

File:

```text
lib/agents/competition.ts
```

Evaluates:

- Rivalry
- Substitutes
- New entrants
- Buyer power
- Supplier power

### CTO Agent

File:

```text
lib/agents/cto.ts
```

Evaluates:

- Technical assumptions
- Hidden complexity
- Scalability risks

### Macro Agent

File:

```text
lib/agents/macro.ts
```

Evaluates:

- Market timing
- Trends
- Market readiness

### Originality Agent

File:

```text
lib/agents/originality.ts
```

Evaluates:

- Originality
- Founder insight
- Fake startup risk

### Consensus Agent

File:

```text
lib/agents/consensus.ts
```

Accepts all judge outputs and returns:

```ts
export type ConsensusResult = {
  finalScore: number
  biggestRisk: string
  biggestOpportunity: string
  recommendation: string
}
```

`recommendation` is constrained to:

- `Proceed`
- `Validate Further`
- `Pass`

## OpenAI Responses API

All agents use:

```ts
model: process.env.OPENAI_MODEL ?? "gpt-5.5"
```

Each agent uses strict JSON schema output validation through the Responses API and also parses/validates the returned JSON at runtime before returning typed data to the app.

OpenAI clients are created inside each agent function so importing server modules during `next build` does not require credentials at module load time.

## Report Persistence

The report payload shape is defined in:

```text
lib/report.ts
```

It includes:

- `pitch`
- `finalVerdict.results`
- `finalVerdict.consensus`
- `createdAt`

The `Open Report` button is hidden until the SSE result event has been received and `finalVerdict` exists.

The report page is print-friendly and also supports a text download.


## Frontend State

Important state in `app/page.tsx`:

```ts
const [pitch, setPitch] = useState(examplePitch)
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [logs, setLogs] = useState<string[]>([])
const [finalVerdict, setFinalVerdict] = useState<StreamVerdict | null>(null)
```

`logs` powers the terminal feed.

`finalVerdict` powers the dashboard, judge cards, and report handoff.

## Validation And Quality Checks

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

These checks verify TypeScript types, lint rules, and production build compatibility.

## Notes

- A valid `OPENAI_API_KEY` is required for live analysis.
- If `OPENAI_MODEL` is omitted, the app uses `gpt-5.5`.
- The SSE route is dynamic and server-rendered on demand.
- The terminal feed streams progress updates; the final structured verdict arrives as a named SSE `result` event.
