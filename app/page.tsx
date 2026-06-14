"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
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
import { REPORT_STORAGE_KEY, type ReportPayload } from "@/lib/report"

type JudgeKey = keyof AnalyzePitchResult

const judgeConfigs: {
  key: JudgeKey
  name: string
  icon: typeof LineChart
}[] = [
  {
    key: "market",
    name: "Market Analyst",
    icon: LineChart,
  },
  {
    key: "competition",
    name: "Competition Analyst",
    icon: Building2,
  },
  {
    key: "cto",
    name: "CTO Analyst",
    icon: CircuitBoard,
  },
  {
    key: "macro",
    name: "Macro Analyst",
    icon: TrendingUp,
  },
  {
    key: "originality",
    name: "Originality Analyst",
    icon: BrainCircuit,
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
  "We are building an AI diligence copilot for seed investors. Founders paste a startup pitch, and Verdict runs five specialist analyst agents that score market pull, competition, technical feasibility, macro timing, and originality. The output is a concise investor memo with risks, opportunities, and follow-up questions."

type StreamVerdict = {
  results: AnalyzePitchResult
  consensus: ConsensusResult
}

export default function Page() {
  const [pitch, setPitch] = useState(examplePitch)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [finalVerdict, setFinalVerdict] = useState<StreamVerdict | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const terminalFeedRef = useRef<HTMLDivElement | null>(null)

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

    const report: ReportPayload = {
      pitch,
      results: finalVerdict.results,
      consensus: finalVerdict.consensus,
      createdAt: new Date().toISOString(),
    }

    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report))
    window.location.assign("/report")
  }

  return (
    <main className="min-h-svh bg-background text-foreground dark">
      <section className="border-b bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_32rem)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radar className="size-4" />
              </div>
              <span className="text-lg font-semibold tracking-normal">Verdict</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                Live diligence
              </Badge>
              <Badge variant="secondary">Investor OS</Badge>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col gap-5"
            >
              <div className="flex max-w-3xl flex-col gap-4">
                <Badge variant="outline" className="w-fit border-primary/20 bg-primary/10">
                  AI partner meeting simulator
                </Badge>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl lg:text-6xl">
                  Verdict
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  A professional AI diligence desk that stress-tests startup ideas through five specialist judges before the next partner meeting.
                </p>
              </div>

              <Card className="rounded-lg border-white/10 bg-card/80 shadow-2xl shadow-black/30 backdrop-blur">
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Startup Pitch Input</CardTitle>
                      <CardDescription>Paste the founder narrative, market thesis, or raw idea memo.</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">Seed to Series A</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Textarea
                    value={pitch}
                    onChange={(event) => setPitch(event.target.value)}
                    className="min-h-44 resize-none rounded-lg border-white/10 bg-black/30 p-4 text-sm leading-6 shadow-inner placeholder:text-muted-foreground/70 focus-visible:ring-primary/30"
                    placeholder="Describe the startup, target customer, insight, wedge, product, and why now..."
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bot className="size-4" />
                      <span>{pitch.length} characters indexed</span>
                    </div>
                    <Button onClick={analyzeIdea} size="lg" className="h-11 rounded-lg px-4">
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
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Composite conviction</p>
                    <p className="text-4xl font-semibold">
                      {isAnalyzing ? "..." : finalVerdict?.consensus.finalScore ?? "--"}
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
                    <BarChart3 className="size-5" />
                  </div>
                </div>
                <Progress value={finalVerdict?.consensus.finalScore ?? 0} className="bg-white/10 [&_[data-slot=progress-indicator]]:bg-emerald-300" />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {isAnalyzing
                    ? "The investment committee is assembling the verdict."
                    : finalVerdict
                      ? finalVerdict.consensus.recommendation
                      : "Run an analysis to generate the investment committee verdict."}
                </p>
              </div>
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
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-xs text-muted-foreground">{item}</p>
                    <p className="mt-2 text-sm font-medium leading-5">
                      {isAnalyzing ? "Analyzing..." : value ?? "Pending"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase text-muted-foreground">AI Judge Panel</p>
          <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">Five perspectives before you spend a week chasing the wrong signal.</h2>
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
                <Card className="h-full rounded-lg border-white/10 bg-card/80 transition-colors hover:bg-card">
                  <CardHeader className="gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="outline">
                        {result ? `${result.score}/100` : isAnalyzing ? "Running" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle>{judge.name}</CardTitle>
                      <CardDescription>
                        {result?.verdict ?? (isAnalyzing ? "Awaiting result" : "Run analysis")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {result?.killerQuestion ??
                        (isAnalyzing
                          ? "This judge is processing the current pitch."
                          : "No verdict has been generated yet.")}
                    </p>
                    <Progress value={result?.score ?? 0} className="bg-white/10" />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="border-y bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <Badge variant="outline" className="w-fit border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                Live analysis feed
              </Badge>
              <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">Terminal-style diligence, without the theater.</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Verdict turns a raw pitch into a structured analyst trace, making the reasoning visible before the memo lands.
              </p>
            </div>
            {finalVerdict ? (
              <Button
                onClick={openReport}
                variant="outline"
                size="lg"
                className="h-11 w-fit rounded-lg border-white/10 bg-white/[0.03]"
              >
                <FileText className="size-4" />
                Open Report
              </Button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/70 font-mono shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-300" />
              <span className="size-2 rounded-full bg-emerald-300" />
              <span className="ml-2 text-xs text-muted-foreground">verdict-analysis.log</span>
            </div>
            <div ref={terminalFeedRef} className="max-h-80 space-y-3 overflow-y-auto p-4 text-xs leading-6 sm:text-sm">
              {logs.length === 0 ? (
                <div className="flex gap-3 text-muted-foreground">
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
                  <span className="text-cyan-100">{line}</span>
                  {isAnalyzing && index === logs.length - 1 ? (
                    <span className="animate-pulse text-emerald-300">running</span>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit border-rose-300/30 bg-rose-300/10 text-rose-100">
              Startup Graveyard
            </Badge>
            <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">Pattern-match against the ideas that already ran out of oxygen.</h2>
            <p className="text-sm leading-6 text-muted-foreground">
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
                <Card className="h-full rounded-lg border-white/10 bg-card/80">
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-rose-400/10 text-rose-100">
                      <Sparkles className="size-4" />
                    </div>
                    <CardTitle>{startup.name}</CardTitle>
                    <CardDescription>{startup.cause}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{startup.lesson}</p>
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
