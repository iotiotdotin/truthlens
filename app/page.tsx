"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Bot,
  BrainCircuit,
  Building2,
  CircuitBoard,
  FileText,
  LineChart,
  Play,
  Radar,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import type { AnalyzePitchResult } from "@/lib/agents/analyze"
import type { ConsensusResult } from "@/lib/agents/consensus"
import type { JudgeResult } from "@/lib/agents/types"
import {
  ANALYSIS_STORAGE_KEY,
  REPORT_STORAGE_KEY,
  type AnalysisStoragePayload,
  type ReportPayload,
} from "@/lib/report"

type JudgeKey = keyof AnalyzePitchResult

const judgeConfigs: {
  key: JudgeKey
  name: string
  icon: typeof LineChart
  tone: {
    border: string
    badge: string
    icon: string
    progress: string
  }
}[] = [
  {
    key: "market",
    name: "Market Analyst",
    icon: LineChart,
    tone: {
      border: "border-emerald-400/15 hover:border-emerald-300/35",
      badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
      icon: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
      progress:
        "bg-zinc-800/80 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-500 [&_[data-slot=progress-indicator]]:to-teal-300",
    },
  },
  {
    key: "competition",
    name: "Competition Analyst",
    icon: Building2,
    tone: {
      border: "border-amber-400/15 hover:border-amber-300/35",
      badge: "border-amber-400/25 bg-amber-400/10 text-amber-200",
      icon: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
      progress:
        "bg-zinc-800/80 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-amber-500 [&_[data-slot=progress-indicator]]:to-yellow-300",
    },
  },
  {
    key: "cto",
    name: "CTO Analyst",
    icon: CircuitBoard,
    tone: {
      border: "border-sky-400/15 hover:border-sky-300/35",
      badge: "border-sky-400/25 bg-sky-400/10 text-sky-200",
      icon: "bg-sky-400/10 text-sky-200 ring-1 ring-sky-400/20",
      progress:
        "bg-zinc-800/80 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-sky-500 [&_[data-slot=progress-indicator]]:to-cyan-300",
    },
  },
  {
    key: "macro",
    name: "Macro Analyst",
    icon: TrendingUp,
    tone: {
      border: "border-violet-400/15 hover:border-violet-300/35",
      badge: "border-violet-400/25 bg-violet-400/10 text-violet-200",
      icon: "bg-violet-400/10 text-violet-200 ring-1 ring-violet-400/20",
      progress:
        "bg-zinc-800/80 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-violet-500 [&_[data-slot=progress-indicator]]:to-indigo-300",
    },
  },
  {
    key: "originality",
    name: "Originality Analyst",
    icon: BrainCircuit,
    tone: {
      border: "border-pink-400/15 hover:border-pink-300/35",
      badge: "border-pink-400/25 bg-pink-400/10 text-pink-200",
      icon: "bg-pink-400/10 text-pink-200 ring-1 ring-pink-400/20",
      progress:
        "bg-zinc-800/80 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-pink-500 [&_[data-slot=progress-indicator]]:to-rose-300",
    },
  },
]

const graveyard = [
  {
    name: "Vanity AI CRM",
    cause: "No owned distribution",
    lesson: "High demo appeal, low switching urgency.",
  },
  {
    name: "Creator Payroll Mesh",
    cause: "Regulatory drag",
    lesson: "Complex compliance arrived before repeatable demand.",
  },
  {
    name: "Autonomous BI Agent",
    cause: "Trust gap",
    lesson: "Executives liked the promise, teams rejected black-box metrics.",
  },
]

const examplePitch =
  "We are building an AI diligence copilot for seed investors. Founders paste a startup pitch, and TruthLens runs five specialist analyst agents that score market pull, competition, technical feasibility, macro timing, and originality. The output is a concise investor memo with risks, opportunities, and follow-up questions."

type StreamVerdict = {
  results: AnalyzePitchResult
  consensus: ConsensusResult
}

type StoredAnalysisState = {
  pitch: string
  logs: string[]
  verdict: StreamVerdict | null
}

const judgeKeys: JudgeKey[] = [
  "market",
  "competition",
  "cto",
  "macro",
  "originality",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isJudgeResult(value: unknown): value is JudgeResult {
  return (
    isRecord(value) &&
    typeof value.score === "number" &&
    typeof value.verdict === "string" &&
    typeof value.killerQuestion === "string"
  )
}

function isAnalyzePitchResult(value: unknown): value is AnalyzePitchResult {
  return isRecord(value) && judgeKeys.every((key) => isJudgeResult(value[key]))
}

function isConsensusResult(value: unknown): value is ConsensusResult {
  return (
    isRecord(value) &&
    typeof value.finalScore === "number" &&
    typeof value.biggestRisk === "string" &&
    typeof value.biggestOpportunity === "string" &&
    typeof value.recommendation === "string"
  )
}

function isStreamVerdict(value: unknown): value is StreamVerdict {
  return (
    isRecord(value) &&
    isAnalyzePitchResult(value.results) &&
    isConsensusResult(value.consensus)
  )
}

function toReportPayload(pitch: string, verdict: StreamVerdict): ReportPayload {
  return {
    pitch,
    results: verdict.results,
    consensus: verdict.consensus,
    createdAt: new Date().toISOString(),
  }
}

function readStoredAnalysis(): StoredAnalysisState | null {
  const rawAnalysis = sessionStorage.getItem(ANALYSIS_STORAGE_KEY)

  if (rawAnalysis) {
    try {
      const parsed = JSON.parse(rawAnalysis) as AnalysisStoragePayload
      const verdict = parsed.verdict

      if (
        typeof parsed.pitch === "string" &&
        Array.isArray(parsed.logs) &&
        parsed.logs.every((log) => typeof log === "string") &&
        (verdict === null || isStreamVerdict(verdict))
      ) {
        return {
          pitch: parsed.pitch,
          logs: parsed.logs,
          verdict,
        }
      }

      sessionStorage.removeItem(ANALYSIS_STORAGE_KEY)
    } catch {
      sessionStorage.removeItem(ANALYSIS_STORAGE_KEY)
    }
  }

  const rawReport = sessionStorage.getItem(REPORT_STORAGE_KEY)

  if (!rawReport) {
    return null
  }

  try {
    const parsed = JSON.parse(rawReport) as ReportPayload

    if (
      typeof parsed.pitch === "string" &&
      isAnalyzePitchResult(parsed.results) &&
      isConsensusResult(parsed.consensus)
    ) {
      return {
        pitch: parsed.pitch,
        logs: ["[Restore] Previous analysis restored."],
        verdict: {
          results: parsed.results,
          consensus: parsed.consensus,
        },
      }
    }

    sessionStorage.removeItem(REPORT_STORAGE_KEY)
  } catch {
    sessionStorage.removeItem(REPORT_STORAGE_KEY)
  }

  return null
}

function writeStoredAnalysis(
  pitch: string,
  logs: string[],
  verdict: StreamVerdict | null
) {
  const snapshot: AnalysisStoragePayload = {
    pitch,
    logs,
    verdict,
    updatedAt: new Date().toISOString(),
  }

  sessionStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(snapshot))

  if (verdict) {
    sessionStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify(toReportPayload(pitch, verdict))
    )
  }
}

function recommendationClasses(recommendation?: string) {
  if (recommendation === "Proceed") {
    return {
      badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
      glow: "shadow-[0_0_54px_rgba(16,185,129,0.16)]",
    }
  }

  if (recommendation === "Validate Further") {
    return {
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      glow: "shadow-[0_0_54px_rgba(245,158,11,0.12)]",
    }
  }

  if (recommendation === "Pass") {
    return {
      badge: "border-rose-400/30 bg-rose-400/10 text-rose-100",
      glow: "shadow-[0_0_54px_rgba(244,63,94,0.12)]",
    }
  }

  return {
    badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    glow: "shadow-[0_0_54px_rgba(34,211,238,0.12)]",
  }
}

export default function Page() {
  const [pitch, setPitch] = useState(examplePitch)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [finalVerdict, setFinalVerdict] = useState<StreamVerdict | null>(null)
  const [hasRestoredAnalysis, setHasRestoredAnalysis] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const terminalFeedRef = useRef<HTMLDivElement | null>(null)
  const compositeScore = finalVerdict?.consensus.finalScore ?? 0
  const scoreDegrees = compositeScore * 3.6
  const recommendationTone = recommendationClasses(finalVerdict?.consensus.recommendation)

  useEffect(() => {
    const storedAnalysis = readStoredAnalysis()
    const restoreId = window.setTimeout(() => {
      if (storedAnalysis) {
        setPitch(storedAnalysis.pitch)
        setLogs(storedAnalysis.logs)
        setFinalVerdict(storedAnalysis.verdict)
      }

      setHasRestoredAnalysis(true)
    }, 0)

    return () => window.clearTimeout(restoreId)
  }, [])

  useEffect(() => {
    if (!hasRestoredAnalysis) {
      return
    }

    writeStoredAnalysis(pitch, logs, finalVerdict)
  }, [finalVerdict, hasRestoredAnalysis, logs, pitch])

  useEffect(() => {
    terminalFeedRef.current?.scrollTo({
      top: terminalFeedRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [logs])

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  function analyzeIdea() {
    eventSourceRef.current?.close()
    setLogs([])
    setFinalVerdict(null)
    setIsAnalyzing(true)

    const eventSource = new EventSource(
      `/api/analyze/stream?pitch=${encodeURIComponent(pitch)}`
    )
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      const message = String(event.data)

      console.log("SSE message received:", message)
      setLogs((prev) => [...prev, message])

      if (
        message === "[Consensus] Complete" ||
        message.startsWith("[Error]")
      ) {
        setIsAnalyzing(false)
      }
    }

    eventSource.addEventListener("result", (event) => {
      const verdict = JSON.parse(event.data) as StreamVerdict

      console.log("SSE final verdict received:", verdict)
      setFinalVerdict(verdict)
      eventSource.close()
      eventSourceRef.current = null
      setIsAnalyzing(false)
    })

    eventSource.onerror = () => {
      eventSource.close()
      eventSourceRef.current = null
      setIsAnalyzing(false)
    }
  }

  function openReport() {
    if (!finalVerdict) {
      return
    }

    const report = toReportPayload(pitch, finalVerdict)

    writeStoredAnalysis(pitch, logs, finalVerdict)
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report))
    window.location.assign("/report")
  }

  return (
    <main className="min-h-svh bg-slate-950 text-zinc-200 dark">
      <section className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#020617_0%,#0f172a_38%,#0f3732_62%,#082f49_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.20),transparent_36%,rgba(14,165,233,0.16)_70%,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(20,184,166,0.28)]">
                <Radar className="size-4" />
              </div>
              <span className="text-lg font-semibold tracking-normal text-white">TruthLens</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.12)]">
                Live diligence
              </Badge>
              <Badge variant="secondary" className="border border-white/10 bg-slate-900/70 text-zinc-300">
                Investor OS
              </Badge>
            </div>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col gap-5"
            >
              <div className="flex max-w-3xl flex-col gap-4">
                <Badge variant="outline" className="w-fit border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                  AI partner meeting simulator
                </Badge>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-balance text-white sm:text-5xl lg:text-6xl">
                  TruthLens
                </h1>
                <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                  A professional AI diligence desk that stress-tests startup ideas through five specialist judges before the next partner meeting.
                </p>
              </div>

              <Card className="rounded-lg border-white/10 bg-slate-900/80 text-zinc-100 shadow-[0_28px_90px_rgba(2,6,23,0.48)] backdrop-blur-xl">
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">Startup Pitch Input</CardTitle>
                      <CardDescription className="text-zinc-400">Paste the founder narrative, market thesis, or raw idea memo.</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit border-white/10 bg-slate-950/60 text-zinc-300">Seed to Series A</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Textarea
                    value={pitch}
                    onChange={(event) => setPitch(event.target.value)}
                    className="min-h-44 resize-none rounded-lg border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-zinc-100 shadow-inner shadow-slate-950/40 placeholder:text-zinc-500 focus-visible:border-emerald-300/40 focus-visible:ring-emerald-300/25"
                    placeholder="Describe the startup, target customer, insight, wedge, product, and why now..."
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Bot className="size-4 text-cyan-200" />
                      <span>{pitch.length} characters indexed</span>
                    </div>
                    <Button onClick={analyzeIdea} size="lg" className="h-11 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-slate-950 shadow-[0_14px_42px_rgba(20,184,166,0.28)] hover:from-emerald-300 hover:to-sky-300">
                      <Play className="size-4" />
                      {isAnalyzing ? "Analyzing..." : "Analyze Idea"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="grid gap-4"
            >
              <div className={`rounded-lg border border-emerald-400/15 bg-slate-900/75 p-5 shadow-xl shadow-slate-950/30 backdrop-blur ${recommendationTone.glow}`}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Composite conviction</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {finalVerdict?.consensus.recommendation ?? "Awaiting committee signal"}
                    </p>
                  </div>
                  <div
                    className="relative flex size-24 shrink-0 items-center justify-center rounded-full p-1 shadow-[0_0_36px_rgba(16,185,129,0.18)]"
                    style={{
                      background: `conic-gradient(from 220deg, #34d399 0deg, #22d3ee ${scoreDegrees}deg, rgba(63,63,70,0.72) ${scoreDegrees}deg 360deg)`,
                    }}
                  >
                    <div className="flex size-full items-center justify-center rounded-full bg-slate-950 ring-1 ring-white/10">
                      <span className="text-2xl font-semibold text-white">
                        {isAnalyzing ? "..." : finalVerdict?.consensus.finalScore ?? "--"}
                      </span>
                    </div>
                  </div>
                </div>
                <Progress value={compositeScore} className="h-1.5 bg-zinc-800/90 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-400 [&_[data-slot=progress-indicator]]:via-teal-300 [&_[data-slot=progress-indicator]]:to-cyan-300" />
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {isAnalyzing
                    ? "The investment committee is assembling the verdict."
                    : finalVerdict
                      ? finalVerdict.consensus.recommendation
                    : "Run an analysis to generate the investment committee verdict."}
                </p>
              </div>
              {finalVerdict ? (
                <motion.section
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="rounded-lg border border-emerald-300/25 bg-slate-900/85 p-5 shadow-[0_24px_90px_rgba(20,184,166,0.20)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                          Analysis Complete
                        </Badge>
                        <Badge variant="outline" className={recommendationTone.badge}>
                          {finalVerdict.consensus.recommendation}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-zinc-400">
                          Investment Score
                        </p>
                        <p className="mt-1 text-3xl font-semibold tracking-normal text-white">
                          {finalVerdict.consensus.finalScore}/100
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={openReport}
                        size="lg"
                        className="h-14 w-full rounded-lg bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-6 text-base font-semibold text-slate-950 shadow-[0_18px_56px_rgba(20,184,166,0.34)] transition-all duration-200 hover:scale-[1.02] hover:from-emerald-300 hover:via-teal-200 hover:to-sky-300 hover:shadow-[0_24px_72px_rgba(34,211,238,0.32)] active:scale-[0.99] sm:w-auto sm:min-w-80"
                      >
                        <FileText className="size-5" />
                        Open Investment Report
                      </Button>
                      <p className="text-sm text-zinc-400">
                        View the full investment committee report
                      </p>
                    </div>

                    <Button
                      onClick={analyzeIdea}
                      variant="outline"
                      className="h-11 w-full rounded-lg border-white/10 bg-slate-950/50 text-zinc-200 hover:bg-slate-800 hover:text-white sm:w-fit"
                    >
                      <Play className="size-4" />
                      Analyze Again
                    </Button>
                  </div>
                </motion.section>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Risk", finalVerdict?.consensus.biggestRisk],
                  ["Opportunity", finalVerdict?.consensus.biggestOpportunity],
                  ["Recommendation", finalVerdict?.consensus.recommendation],
                ].map(([item, value], index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 + index * 0.05 }}
                    className="rounded-lg border border-white/10 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/20"
                  >
                    <p className="text-xs text-zinc-400">{item}</p>
                    <p className="mt-2 text-sm font-medium leading-5 text-zinc-100">
                      {isAnalyzing ? "Analyzing..." : value ?? "Pending"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase text-zinc-400">AI Judge Panel</p>
          <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">Five perspectives before you spend a week chasing the wrong signal.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {judgeConfigs.map((judge, index) => {
            const Icon = judge.icon
            const result: JudgeResult | undefined = finalVerdict?.results[judge.key]

            return (
              <motion.div
                key={judge.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
              >
                <Card className={`h-full rounded-lg bg-slate-900/70 text-zinc-100 shadow-[0_18px_60px_rgba(2,6,23,0.30)] transition-all hover:-translate-y-0.5 hover:bg-slate-900/95 ${judge.tone.border}`}>
                  <CardHeader className="gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${judge.tone.icon}`}>
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="outline" className={judge.tone.badge}>
                        {result ? `${result.score}/100` : isAnalyzing ? "Running" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-white">{judge.name}</CardTitle>
                      <CardDescription className="text-zinc-400">
                        {result?.verdict ?? (isAnalyzing ? "Awaiting result" : "Run analysis")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-5">
                    <p className="text-sm leading-6 text-zinc-400">
                      {result?.killerQuestion ??
                        (isAnalyzing
                          ? "This judge is processing the current pitch."
                          : "No verdict has been generated yet.")}
                    </p>
                    <Progress value={result?.score ?? 0} className={judge.tone.progress} />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/45">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-center gap-6">
            <div className="flex flex-col gap-3">
              <Badge variant="outline" className="w-fit border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                Live analysis feed
              </Badge>
              <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">Terminal-style diligence, without the theater.</h2>
              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                TruthLens turns a raw pitch into a structured analyst trace, making the reasoning visible before the memo lands.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 font-mono shadow-[0_28px_90px_rgba(2,6,23,0.46)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/70 px-4 py-3">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-300" />
              <span className="size-2 rounded-full bg-emerald-300" />
              <span className="ml-2 text-xs text-zinc-500">truthlens-analysis.log</span>
            </div>
            <div ref={terminalFeedRef} className="max-h-80 space-y-3 overflow-y-auto p-4 text-xs leading-6 sm:text-sm">
              {logs.length === 0 ? (
                <div className="flex gap-3 text-zinc-500">
                  <span className="text-emerald-300">[00]</span>
                  <span>awaiting pitch analysis</span>
                </div>
              ) : null}
              {logs.map((line, index) => (
                <motion.div
                  key={`${line}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3"
                >
                  <span className="text-emerald-300">[{String(index + 1).padStart(2, "0")}]</span>
                  <span className="text-cyan-100/90">{line}</span>
                  {isAnalyzing && index === logs.length - 1 ? (
                    <span className="animate-pulse text-emerald-300">running</span>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit border-rose-300/30 bg-rose-300/10 text-rose-100">
              Startup Graveyard
            </Badge>
            <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">Pattern-match against the ideas that already ran out of oxygen.</h2>
            <p className="text-sm leading-6 text-zinc-400">
              A premium diligence tool should surface failure modes as clearly as upside. These comparables help founders sharpen the wedge.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {graveyard.map((startup, index) => (
              <motion.div
                key={startup.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full rounded-lg border-white/10 bg-slate-900/70 text-zinc-100 shadow-xl shadow-slate-950/20">
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-rose-400/10 text-rose-100">
                      <Sparkles className="size-4" />
                    </div>
                    <CardTitle className="text-white">{startup.name}</CardTitle>
                    <CardDescription className="text-rose-100/80">{startup.cause}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-zinc-400">{startup.lesson}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
