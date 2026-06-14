"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  FileText,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
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
import type { AnalyzePitchResult } from "@/lib/agents/analyze"
import { REPORT_STORAGE_KEY, type ReportPayload } from "@/lib/report"

type JudgeKey = keyof AnalyzePitchResult

const judgeMeta: Record<
  JudgeKey,
  {
    name: string
    shortName: string
    dimension: string
  }
> = {
  market: {
    name: "Market Analyst",
    shortName: "Market",
    dimension: "Market",
  },
  competition: {
    name: "Competition Analyst",
    shortName: "Competition",
    dimension: "Competition",
  },
  cto: {
    name: "CTO Analyst",
    shortName: "Technical",
    dimension: "Technical Feasibility",
  },
  macro: {
    name: "Macro Analyst",
    shortName: "Timing",
    dimension: "Timing",
  },
  originality: {
    name: "Originality Analyst",
    shortName: "Originality",
    dimension: "Originality",
  },
}

const judgeOrder = Object.keys(judgeMeta) as JudgeKey[]

function subscribeToReportStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)

  return () => window.removeEventListener("storage", onStoreChange)
}

function getStoredReportSnapshot(): string | null {
  return sessionStorage.getItem(REPORT_STORAGE_KEY)
}

function downloadReport(report: ReportPayload) {
  const body = [
    "TruthLens Investment Report",
    "",
    "Generated: " + new Date(report.createdAt).toLocaleString(),
    "",
    "Final investment score: " + report.consensus.finalScore + "/100",
    "Recommendation: " + report.consensus.recommendation,
    "Biggest risk: " + report.consensus.biggestRisk,
    "Biggest opportunity: " + report.consensus.biggestOpportunity,
    "",
    "Startup pitch:",
    report.pitch,
    "",
    "Judge results:",
    ...judgeOrder.flatMap((key) => {
      const result = report.results[key]

      return [
        "",
        judgeMeta[key].name,
        "Score: " + result.score + "/100",
        "Verdict: " + result.verdict,
        "Killer question: " + result.killerQuestion,
      ]
    }),
  ].join("\n")

  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "truthlens-investment-report.txt"
  link.click()
  URL.revokeObjectURL(url)
}

function recommendationClasses(recommendation: string) {
  if (recommendation === "Proceed") {
    return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
  }

  if (recommendation === "Validate Further") {
    return "border-amber-300/30 bg-amber-300/15 text-amber-100"
  }

  return "border-rose-300/30 bg-rose-300/15 text-rose-100"
}

function radarPoints(scores: number[]) {
  const center = 96
  const maxRadius = 72

  return scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / scores.length
      const radius = (Math.max(0, Math.min(score, 100)) / 100) * maxRadius
      const x = center + Math.cos(angle) * radius
      const y = center + Math.sin(angle) * radius

      return `${x},${y}`
    })
    .join(" ")
}

function gridPolygon(percent: number) {
  return radarPoints(judgeOrder.map(() => percent))
}

export default function ReportPage() {
  const [expandedJudge, setExpandedJudge] = useState<JudgeKey | null>("market")
  const hasLoaded = useSyncExternalStore(
    subscribeToReportStorage,
    () => true,
    () => false
  )
  const storedReport = useSyncExternalStore(
    subscribeToReportStorage,
    getStoredReportSnapshot,
    () => null
  )
  const report = useMemo(() => {
    if (!storedReport) {
      return null
    }

    try {
      return JSON.parse(storedReport) as ReportPayload
    } catch {
      sessionStorage.removeItem(REPORT_STORAGE_KEY)
      return null
    }
  }, [storedReport])

  const committee = useMemo(() => {
    if (!report) {
      return null
    }

    const rankedJudges = [...judgeOrder].sort(
      (a, b) => report.results[b].score - report.results[a].score
    )
    const strongest = rankedJudges[0]
    const weakest = rankedJudges[rankedJudges.length - 1]

    return {
      likes: [
        report.consensus.biggestOpportunity,
        `${judgeMeta[strongest].name} scored this at ${report.results[strongest].score}/100.`,
        report.results[strongest].verdict,
      ],
      skeptical: [
        report.consensus.biggestRisk,
        `${judgeMeta[weakest].name} is the lowest-confidence read at ${report.results[weakest].score}/100.`,
        report.results[weakest].killerQuestion,
      ],
      assumptions: judgeOrder.slice(0, 3).map((key) => report.results[key].killerQuestion),
      actions: [
        "Pressure-test the lowest-scoring diligence area with customer or expert calls.",
        "Turn the biggest risk into a falsifiable two-week validation sprint.",
        "Collect proof that the strongest opportunity is urgent and budgeted.",
      ],
    }
  }, [report])

  if (!hasLoaded) {
    return (
      <main className="min-h-svh bg-background text-white dark">
        <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-4">
          <p className="text-sm text-zinc-300">Loading report...</p>
        </div>
      </main>
    )
  }

  if (!report || !committee) {
    return (
      <main className="min-h-svh bg-background text-white dark">
        <section className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-white/10 text-white">
            <FileText className="size-5" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-normal text-white">
              No report yet
            </h1>
            <p className="text-sm leading-6 text-zinc-300">
              Run an analysis first, then open the investment report once the
              final verdict is ready.
            </p>
          </div>
          <Button asChild className="h-10 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Analysis
            </Link>
          </Button>
        </section>
      </main>
    )
  }

  const scores = judgeOrder.map((key) => report.results[key].score)

  return (
    <main className="min-h-svh scroll-smooth bg-[#050505] text-zinc-100 print:bg-white print:text-zinc-950">
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-black/70 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white ring-1 ring-zinc-700">
              <Radar className="size-4" />
            </div>
            <span className="font-semibold tracking-normal text-white">TruthLens</span>
          </Link>
          <div className="hidden items-center gap-1 text-sm md:flex">
            <a href="#summary" className="rounded-lg border border-transparent px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:border-zinc-700 focus-visible:bg-zinc-800 focus-visible:text-white">
              Executive Summary
            </a>
            <a href="#committee" className="rounded-lg border border-transparent px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:border-zinc-700 focus-visible:bg-zinc-800 focus-visible:text-white">
              Committee Verdict
            </a>
            <a href="#judges" className="rounded-lg border border-transparent px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:border-zinc-700 focus-visible:bg-zinc-800 focus-visible:text-white">
              Judge Analysis
            </a>
            <button
              onClick={() => downloadReport(report)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white hover:bg-zinc-700 focus-visible:border-zinc-600"
            >
              Download
            </button>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.42),transparent_28rem),radial-gradient(circle_at_75%_15%,rgba(16,185,129,0.24),transparent_24rem),linear-gradient(135deg,#050505,#111111_45%,#06110d)] print:border-neutral-200 print:bg-white">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] to-transparent print:hidden" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_26rem] lg:px-8 lg:py-16 print:max-w-none print:px-0">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-zinc-600 bg-white/10 text-white">
                Investment memo
              </Badge>
              <Badge variant="outline" className={recommendationClasses(report.consensus.recommendation)}>
                {report.consensus.recommendation}
              </Badge>
            </div>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-400 print:text-zinc-600">
                Generated{" "}
                {new Date(report.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-balance text-white sm:text-6xl print:text-4xl print:text-zinc-950">
                TruthLens Investment Report
              </h1>
              <p className="max-w-4xl text-lg leading-8 text-zinc-100 print:text-zinc-700">
                {report.pitch}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-lg border border-zinc-700 bg-white/[0.08] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl print:border-zinc-200 print:bg-white print:shadow-none"
          >
            <p className="text-sm text-zinc-400 print:text-zinc-600">
              Investment score
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-7xl font-semibold tracking-normal text-white print:text-zinc-950">
                {report.consensus.finalScore}
              </span>
              <span className="pb-3 text-xl text-zinc-400 print:text-zinc-600">/100</span>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-800 print:bg-zinc-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-white"
                style={{ width: `${report.consensus.finalScore}%` }}
              />
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-100 print:text-zinc-700">
              {report.consensus.biggestOpportunity}
            </p>
          </motion.div>
        </div>
      </section>

      <section id="summary" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Investment Score",
              value: `${report.consensus.finalScore}/100`,
              icon: Target,
            },
            {
              label: "Biggest Risk",
              value: report.consensus.biggestRisk,
              icon: ShieldAlert,
            },
            {
              label: "Biggest Opportunity",
              value: report.consensus.biggestOpportunity,
              icon: TrendingUp,
            },
            {
              label: "Recommendation",
              value: report.consensus.recommendation,
              icon: Sparkles,
            },
          ].map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full rounded-lg border-zinc-800 bg-white/[0.05] text-zinc-100 shadow-xl shadow-black/20 backdrop-blur transition-colors hover:bg-white/[0.08] print:border-zinc-200 print:bg-white print:text-zinc-950 print:shadow-none">
                  <CardHeader className="gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 text-white print:bg-zinc-100 print:text-zinc-900">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <CardDescription className="text-zinc-400 print:text-zinc-600">{item.label}</CardDescription>
                      <CardTitle className="mt-2 text-xl leading-snug text-white print:text-zinc-950">
                        {item.value}
                      </CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[25rem_1fr]">
          <Card className="rounded-lg border-zinc-800 bg-white/[0.04] text-zinc-100 backdrop-blur print:border-zinc-200 print:bg-white print:text-zinc-950">
            <CardHeader>
              <CardTitle className="text-white print:text-zinc-950">Score Map</CardTitle>
              <CardDescription className="text-zinc-400 print:text-zinc-600">Five-dimensional diligence profile</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="mx-auto aspect-square w-full max-w-64">
                <svg viewBox="0 0 192 192" className="size-full">
                  {[25, 50, 75, 100].map((level) => (
                    <polygon
                      key={level}
                      points={gridPolygon(level)}
                      fill="none"
                      stroke="rgba(212,212,216,0.28)"
                      strokeWidth="1"
                    />
                  ))}
                  {judgeOrder.map((key, index) => {
                    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / judgeOrder.length
                    const x = 96 + Math.cos(angle) * 86
                    const y = 96 + Math.sin(angle) * 86

                    return (
                      <text
                        key={key}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-zinc-300 text-[9px]"
                      >
                        {judgeMeta[key].shortName}
                      </text>
                    )
                  })}
                  <polygon
                    points={radarPoints(scores)}
                    fill="rgba(52,211,153,0.22)"
                    stroke="rgb(110,231,183)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-800 bg-white/[0.04] text-zinc-100 backdrop-blur print:border-zinc-200 print:bg-white print:text-zinc-950">
            <CardHeader>
              <CardTitle className="text-white print:text-zinc-950">Score Bars</CardTitle>
              <CardDescription className="text-zinc-400 print:text-zinc-600">Relative conviction by judge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {judgeOrder.map((key) => {
                const result = report.results[key]

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-zinc-300 print:text-zinc-700">
                        {judgeMeta[key].dimension}
                      </span>
                      <span className="font-medium text-white print:text-zinc-950">{result.score}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800 print:bg-zinc-200">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${result.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="committee" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        <div>
          <p className="text-sm font-medium uppercase text-zinc-400 print:text-zinc-600">
            Investment Committee Verdict
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white print:text-zinc-950">
            What the partnership would debate
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ["Why the committee likes it", committee.likes],
            ["Why the committee is skeptical", committee.skeptical],
            ["Key assumptions", committee.assumptions],
            ["Suggested next actions", committee.actions],
          ].map(([title, bullets]) => (
            <Card key={title as string} className="rounded-lg border-zinc-800 bg-white/[0.04] text-zinc-100 backdrop-blur print:break-inside-avoid print:border-zinc-200 print:bg-white print:text-zinc-950">
              <CardHeader>
                <CardTitle className="text-white print:text-zinc-950">{title as string}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(bullets as string[]).map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-6 text-zinc-300 print:text-zinc-700">
                      <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-emerald-300 print:text-zinc-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="judges" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        <div>
          <p className="text-sm font-medium uppercase text-zinc-400 print:text-zinc-600">
            Judge Analysis
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white print:text-zinc-950">
            Specialist diligence cards
          </h2>
        </div>

        <div className="grid gap-4">
          {judgeOrder.map((key, index) => {
            const result = report.results[key]
            const isExpanded = expandedJudge === key

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="overflow-hidden rounded-lg border-zinc-800 bg-white/[0.04] text-zinc-100 backdrop-blur transition-colors hover:bg-white/[0.07] print:break-inside-avoid print:border-zinc-200 print:bg-white print:text-zinc-950">
                  <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-white print:text-zinc-950">{judgeMeta[key].name}</CardTitle>
                        <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100">
                          {result.score}/100
                        </Badge>
                      </div>
                      <CardDescription className="max-w-4xl text-base leading-7 text-zinc-300 print:text-zinc-700">
                        {result.verdict}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedJudge(isExpanded ? null : key)}
                      className="rounded-lg border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white print:hidden"
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </CardHeader>
                  {isExpanded ? (
                    <CardContent>
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-4 border-t border-zinc-800 pt-4 print:border-zinc-200"
                      >
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-4 print:border-zinc-200 print:bg-zinc-50">
                          <p className="text-xs font-medium uppercase text-zinc-400 print:text-zinc-600">
                            Killer Question
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-100 print:text-zinc-800">
                            {result.killerQuestion}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-white/[0.05] p-4 print:border-zinc-200 print:bg-white">
                          <p className="text-xs font-medium uppercase text-zinc-400 print:text-zinc-600">
                            Full Analysis
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-300 print:text-zinc-700">
                            {result.verdict}
                          </p>
                        </div>
                      </motion.div>
                    </CardContent>
                  ) : null}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
