import OpenAI from "openai"

import type { AnalyzePitchResult } from "./analyze"

export type ConsensusResult = {
  finalScore: number
  biggestRisk: string
  biggestOpportunity: string
  recommendation: string
}

const systemPrompt = `You are an investment committee chair.

Synthesize the five judge results into a final investment committee verdict.

Return JSON:

{
  "finalScore": number,
  "biggestRisk": string,
  "biggestOpportunity": string,
  "recommendation": string
}

The recommendation must be exactly one of:
- Proceed
- Validate Further
- Pass`

const consensusResultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    finalScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    biggestRisk: {
      type: "string",
    },
    biggestOpportunity: {
      type: "string",
    },
    recommendation: {
      type: "string",
      enum: ["Proceed", "Validate Further", "Pass"],
    },
  },
  required: [
    "finalScore",
    "biggestRisk",
    "biggestOpportunity",
    "recommendation",
  ],
} as const

function parseConsensusResult(content: string): ConsensusResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Consensus agent returned invalid JSON.")
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("finalScore" in parsed) ||
    !("biggestRisk" in parsed) ||
    !("biggestOpportunity" in parsed) ||
    !("recommendation" in parsed)
  ) {
    throw new Error("Consensus agent response is missing required fields.")
  }

  const result = parsed as Record<string, unknown>

  if (
    typeof result.finalScore !== "number" ||
    typeof result.biggestRisk !== "string" ||
    typeof result.biggestOpportunity !== "string" ||
    typeof result.recommendation !== "string"
  ) {
    throw new Error("Consensus agent response has invalid field types.")
  }

  if (!["Proceed", "Validate Further", "Pass"].includes(result.recommendation)) {
    throw new Error("Consensus agent returned an invalid recommendation.")
  }

  return {
    finalScore: result.finalScore,
    biggestRisk: result.biggestRisk,
    biggestOpportunity: result.biggestOpportunity,
    recommendation: result.recommendation,
  }
}

export async function consensusAgent(
  results: AnalyzePitchResult
): Promise<ConsensusResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(results),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "consensus_result",
          strict: true,
          schema: consensusResultSchema,
        },
      },
    })

    return parseConsensusResult(response.output_text)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Consensus agent failed: ${error.message}`)
    }

    throw new Error("Consensus agent failed with an unknown error.")
  }
}
