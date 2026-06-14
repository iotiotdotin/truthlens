import type { AnalyzePitchResult } from "@/lib/agents/analyze"
import type { ConsensusResult } from "@/lib/agents/consensus"

export const REPORT_STORAGE_KEY = "verdict.latestReport"
export const ANALYSIS_STORAGE_KEY = "truthlens.latestAnalysis"

export type ReportPayload = {
  pitch: string
  results: AnalyzePitchResult
  consensus: ConsensusResult
  createdAt: string
}

export type AnalysisStoragePayload = {
  pitch: string
  logs: string[]
  verdict: {
    results: AnalyzePitchResult
    consensus: ConsensusResult
  } | null
  updatedAt: string
}
