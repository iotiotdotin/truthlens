import OpenAI from "openai"

import type { JudgeResult } from "./types"

const systemPrompt = `You are a macro analyst.

Evaluate ONLY macro readiness using:
- market timing
- trends
- readiness of the market

Return JSON:

{
  "score": number,
  "verdict": string,
  "killerQuestion": string
}`

const judgeResultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    verdict: {
      type: "string",
    },
    killerQuestion: {
      type: "string",
    },
  },
  required: ["score", "verdict", "killerQuestion"],
} as const

function parseJudgeResult(content: string): JudgeResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Macro agent returned invalid JSON.")
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("score" in parsed) ||
    !("verdict" in parsed) ||
    !("killerQuestion" in parsed)
  ) {
    throw new Error("Macro agent response is missing required fields.")
  }

  const result = parsed as Record<string, unknown>

  if (
    typeof result.score !== "number" ||
    typeof result.verdict !== "string" ||
    typeof result.killerQuestion !== "string"
  ) {
    throw new Error("Macro agent response has invalid field types.")
  }

  return {
    score: result.score,
    verdict: result.verdict,
    killerQuestion: result.killerQuestion,
  }
}

export async function macroAgent(pitch: string): Promise<JudgeResult> {
  if (!pitch.trim()) {
    throw new Error("Macro agent requires a non-empty pitch.")
  }

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
          content: pitch,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "judge_result",
          strict: true,
          schema: judgeResultSchema,
        },
      },
    })

    return parseJudgeResult(response.output_text)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Macro agent failed: ${error.message}`)
    }

    throw new Error("Macro agent failed with an unknown error.")
  }
}
