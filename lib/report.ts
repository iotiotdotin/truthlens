import type { AnalyzePitchResult } from "@/lib/agents/analyze"
import type { ConsensusResult } from "@/lib/agents/consensus"

export const REPORT_STORAGE_KEY = "verdict.latestReport"

export type ReportPayload = {
  pitch: string
  results: AnalyzePitchResult
  consensus: ConsensusResult
  createdAt: string
}
