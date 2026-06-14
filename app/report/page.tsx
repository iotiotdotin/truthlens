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

const judgeTone: Record<
  JudgeKey,
  {
    badge: string
    icon: string
    progress: string
    stroke: string
  }
> = {
  market: {
    badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    icon: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
    progress: "from-emerald-500 to-teal-300",
    stroke: "rgb(52,211,153)",
  },
  competition: {
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    icon: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
    progress: "from-amber-500 to-yellow-300",
    stroke: "rgb(251,191,36)",
  },
  cto: {
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-100",
    icon: "bg-sky-400/10 text-sky-200 ring-1 ring-sky-400/20",
    progress: "from-sky-500 to-cyan-300",
    stroke: "rgb(56,189,248)",
  },
  macro: {
    badge: "border-violet-400/25 bg-violet-400/10 text-violet-100",
    icon: "bg-violet-400/10 text-violet-200 ring-1 ring-violet-400/20",
    progress: "from-violet-500 to-indigo-300",
    stroke: "rgb(167,139,250)",
  },
  originality: {
    badge: "border-pink-400/25 bg-pink-400/10 text-pink-100",
    icon: "bg-pink-400/10 text-pink-200 ring-1 ring-pink-400/20",
    progress: "from-pink-500 to-rose-300",
    stroke: "rgb(244,114,182)",
  },
}

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

function recommendationVisual(recommendation: string) {
  if (recommendation === "Proceed") {
    return {
      ring: "#34d399",
      ringEnd: "#22d3ee",
      shadow: "shadow-[0_0_72px_rgba(16,185,129,0.20)]",
      icon: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
      card: "border-emerald-400/20 bg-emerald-400/10",
    }
  }

  if (recommendation === "Validate Further") {
    return {
      ring: "#f59e0b",
      ringEnd: "#22d3ee",
      shadow: "shadow-[0_0_72px_rgba(245,158,11,0.16)]",
      icon: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
      card: "border-amber-400/20 bg-amber-400/10",
    }
  }

  return {
    ring: "#fb7185",
    ringEnd: "#f59e0b",
    shadow: "shadow-[0_0_72px_rgba(244,63,94,0.16)]",
    icon: "bg-rose-400/10 text-rose-200 ring-1 ring-rose-400/20",
    card: "border-rose-400/20 bg-rose-400/10",
  }
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
  const scoreDegrees = report.consensus.finalScore * 3.6
  const recommendationTone = recommendationVisual(report.consensus.recommendation)

  return (
    <main className="min-h-svh scroll-smooth bg-slate-950 text-zinc-100 print:bg-white print:text-zinc-950">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(20,184,166,0.24)]">
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
              className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100 hover:bg-emerald-400/15 hover:text-white focus-visible:border-emerald-300/40"
            >
              Download
            </button>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg border-white/10 bg-slate-900/80 text-zinc-200 hover:bg-slate-800 hover:text-white">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#020617_0%,#111827_42%,#0f3732_68%,#082f49_100%)] print:border-neutral-200 print:bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.20),transparent_34%,rgba(56,189,248,0.13)_72%,transparent)] print:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent print:hidden" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_26rem] lg:px-8 lg:py-16 print:max-w-none print:px-0">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-white/15 bg-slate-900/55 text-zinc-200">
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
              <p className="max-w-4xl text-lg leading-8 text-zinc-200 print:text-zinc-700">
                {report.pitch}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className={`rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/45 backdrop-blur-xl print:border-zinc-200 print:bg-white print:shadow-none ${recommendationTone.shadow}`}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm text-zinc-400 print:text-zinc-600">
                  Investment score
                </p>
                <Badge variant="outline" className={`mt-3 ${recommendationClasses(report.consensus.recommendation)}`}>
                  {report.consensus.recommendation}
                </Badge>
              </div>
              <div
                className="relative flex size-28 items-center justify-center rounded-full p-1.5"
                style={{
                  background: `conic-gradient(from 220deg, ${recommendationTone.ring} 0deg, ${recommendationTone.ringEnd} ${scoreDegrees}deg, rgba(63,63,70,0.72) ${scoreDegrees}deg 360deg)`,
                }}
              >
                <div className="flex size-full flex-col items-center justify-center rounded-full bg-slate-950 ring-1 ring-white/10 print:bg-white">
                  <span className="text-4xl font-semibold tracking-normal text-white print:text-zinc-950">
                    {report.consensus.finalScore}
                  </span>
                  <span className="text-xs text-zinc-500 print:text-zinc-600">/100</span>
                </div>
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-800 print:bg-zinc-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300"
                style={{ width: `${report.consensus.finalScore}%` }}
              />
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-300 print:text-zinc-700">
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
              card: "border-cyan-400/20 bg-cyan-400/[0.07]",
              iconClass: "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20",
            },
            {
              label: "Biggest Risk",
              value: report.consensus.biggestRisk,
              icon: ShieldAlert,
              card: "border-rose-400/20 bg-rose-400/[0.07]",
              iconClass: "bg-rose-400/10 text-rose-200 ring-1 ring-rose-400/20",
            },
            {
              label: "Biggest Opportunity",
              value: report.consensus.biggestOpportunity,
              icon: TrendingUp,
              card: "border-emerald-400/20 bg-emerald-400/[0.07]",
              iconClass: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
            },
            {
              label: "Recommendation",
              value: report.consensus.recommendation,
              icon: Sparkles,
              card: recommendationTone.card,
              iconClass: recommendationTone.icon,
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
                <Card className={`h-full rounded-lg text-zinc-100 shadow-xl shadow-slate-950/25 backdrop-blur transition-colors hover:bg-slate-800/70 print:border-zinc-200 print:bg-white print:text-zinc-950 print:shadow-none ${item.card}`}>
                  <CardHeader className="gap-4">
                    <div className={`flex size-10 items-center justify-center rounded-lg print:bg-zinc-100 print:text-zinc-900 ${item.iconClass}`}>
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
          <Card className="rounded-lg border-white/10 bg-slate-900/70 text-zinc-100 shadow-xl shadow-slate-950/25 backdrop-blur print:border-zinc-200 print:bg-white print:text-zinc-950">
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
                      stroke="rgba(212,212,216,0.20)"
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
                    fill="rgba(20,184,166,0.20)"
                    stroke="rgb(45,212,191)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-slate-900/70 text-zinc-100 shadow-xl shadow-slate-950/25 backdrop-blur print:border-zinc-200 print:bg-white print:text-zinc-950">
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
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800/90 print:bg-zinc-200">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${result.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className={`h-full rounded-full bg-gradient-to-r ${judgeTone[key].progress}`}
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
            <Card key={title as string} className="rounded-lg border-white/10 bg-slate-900/70 text-zinc-100 shadow-xl shadow-slate-950/20 backdrop-blur print:break-inside-avoid print:border-zinc-200 print:bg-white print:text-zinc-950">
              <CardHeader>
                <CardTitle className="text-white print:text-zinc-950">{title as string}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(bullets as string[]).map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-6 text-zinc-300 print:text-zinc-700">
                      <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-cyan-300 print:text-zinc-500" />
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
                <Card
                  className="overflow-hidden rounded-lg border-white/10 bg-slate-900/70 text-zinc-100 shadow-xl shadow-slate-950/20 backdrop-blur transition-colors hover:bg-slate-900/90 print:break-inside-avoid print:border-zinc-200 print:bg-white print:text-zinc-950"
                  style={{ borderLeftColor: judgeTone[key].stroke }}
                >
                  <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`flex size-8 items-center justify-center rounded-lg ${judgeTone[key].icon}`}>
                          <span className="size-2 rounded-full bg-current" />
                        </span>
                        <CardTitle className="text-white print:text-zinc-950">{judgeMeta[key].name}</CardTitle>
                        <Badge variant="outline" className={judgeTone[key].badge}>
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
                      className="rounded-lg border-white/10 bg-slate-950/70 text-zinc-200 hover:bg-slate-800 hover:text-white print:hidden"
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
                        <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4 print:border-zinc-200 print:bg-zinc-50">
                          <p className="text-xs font-medium uppercase text-zinc-400 print:text-zinc-600">
                            Killer Question
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-100 print:text-zinc-800">
                            {result.killerQuestion}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4 print:border-zinc-200 print:bg-white">
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
