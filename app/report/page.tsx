"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  Radar,
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

const judgeNames: Record<JudgeKey, string> = {
  market: "Market Analyst",
  competition: "Competition Analyst",
  cto: "CTO Analyst",
  macro: "Macro Analyst",
  originality: "Originality Analyst",
}

const judgeOrder = Object.keys(judgeNames) as JudgeKey[]

function subscribeToReportStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)

  return () => window.removeEventListener("storage", onStoreChange)
}

function getStoredReportSnapshot(): string | null {
  return sessionStorage.getItem(REPORT_STORAGE_KEY)
}

function downloadReport(report: ReportPayload) {
  const body = [
    "Verdict Investment Report",
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
        judgeNames[key],
        "Score: " + result.score + "/100",
        "Verdict: " + result.verdict,
        "Killer question: " + result.killerQuestion,
      ]
    }),
  ].join("\n")

  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "verdict-investment-report.txt"
  link.click()
  URL.revokeObjectURL(url)
}

export default function ReportPage() {
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

  if (!hasLoaded) {
    return (
      <main className="min-h-svh bg-background text-foreground dark">
        <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="min-h-svh bg-background text-foreground dark">
        <section className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-normal">
              No report yet
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Run an analysis first, then open the investment report once the
              final verdict is ready.
            </p>
          </div>
          <Button asChild className="h-10 rounded-lg">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Analysis
            </Link>
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-neutral-950 text-neutral-100 print:bg-white print:text-neutral-950">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34rem)] print:border-neutral-200 print:bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0">
          <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radar className="size-4" />
              </div>
              <span className="text-lg font-semibold tracking-normal">
                Verdict
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-lg">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  Back to Analysis
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="rounded-lg"
              >
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                onClick={() => downloadReport(report)}
                className="rounded-lg"
              >
                <Download className="size-4" />
                Download Report
              </Button>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-100 print:border-neutral-300 print:bg-white print:text-neutral-700"
              >
                Investment memo
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl print:text-4xl">
                  Verdict Investment Report
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground print:text-neutral-600">
                  Generated{" "}
                  {new Date(report.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            <Card className="rounded-lg border-white/10 bg-white/[0.04] print:border-neutral-200 print:bg-white">
              <CardHeader>
                <CardDescription>Final investment score</CardDescription>
                <CardTitle className="text-5xl">
                  {report.consensus.finalScore}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="rounded-lg px-3 py-1 text-sm">
                  {report.consensus.recommendation}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-lg border-white/10 bg-white/[0.03] print:border-neutral-200 print:bg-white">
            <CardHeader>
              <CardDescription>Biggest risk</CardDescription>
              <CardTitle className="text-xl leading-snug">
                {report.consensus.biggestRisk}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg border-white/10 bg-white/[0.03] print:border-neutral-200 print:bg-white">
            <CardHeader>
              <CardDescription>Biggest opportunity</CardDescription>
              <CardTitle className="text-xl leading-snug">
                {report.consensus.biggestOpportunity}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="rounded-lg border-white/10 bg-white/[0.03] print:border-neutral-200 print:bg-white">
          <CardHeader>
            <CardTitle>Startup pitch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground print:text-neutral-700">
              {report.pitch}
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground print:text-neutral-500">
              Judge Results
            </p>
            <h2 className="text-2xl font-semibold tracking-normal">
              Specialist diligence notes
            </h2>
          </div>

          <div className="grid gap-4">
            {judgeOrder.map((key) => {
              const result = report.results[key]

              return (
                <Card
                  key={key}
                  className="rounded-lg border-white/10 bg-white/[0.03] print:break-inside-avoid print:border-neutral-200 print:bg-white"
                >
                  <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{judgeNames[key]}</CardTitle>
                      <CardDescription>{result.verdict}</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {result.score}/100
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 print:border-neutral-200 print:bg-neutral-50">
                      <p className="text-xs font-medium uppercase text-muted-foreground print:text-neutral-500">
                        Killer Question
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-200 print:text-neutral-800">
                        {result.killerQuestion}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}
