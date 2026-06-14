import { competitionAgent } from "./competition"
import { ctoAgent } from "./cto"
import { macroAgent } from "./macro"
import { marketAgent } from "./market"
import { originalityAgent } from "./originality"
import type { JudgeResult } from "./types"

export type AnalyzePitchResult = {
  market: JudgeResult
  competition: JudgeResult
  cto: JudgeResult
  macro: JudgeResult
  originality: JudgeResult
}

export async function analyzePitch(pitch: string): Promise<AnalyzePitchResult> {
  if (!pitch.trim()) {
    throw new Error("Analyze pitch requires a non-empty pitch.")
  }

  try {
    const [market, competition, cto, macro, originality] = await Promise.all([
      marketAgent(pitch),
      competitionAgent(pitch),
      ctoAgent(pitch),
      macroAgent(pitch),
      originalityAgent(pitch),
    ])

    return {
      market,
      competition,
      cto,
      macro,
      originality,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Pitch analysis failed: ${error.message}`)
    }

    throw new Error("Pitch analysis failed with an unknown error.")
  }
}
