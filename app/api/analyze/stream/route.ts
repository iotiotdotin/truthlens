import { competitionAgent } from "@/lib/agents/competition"
import { consensusAgent } from "@/lib/agents/consensus"
import { ctoAgent } from "@/lib/agents/cto"
import { macroAgent } from "@/lib/agents/macro"
import { marketAgent } from "@/lib/agents/market"
import { originalityAgent } from "@/lib/agents/originality"
import type { AnalyzePitchResult } from "@/lib/agents/analyze"
import type { JudgeResult } from "@/lib/agents/types"

type AgentKey = keyof AnalyzePitchResult

type AgentConfig = {
  key: AgentKey
  label: string
  run: (pitch: string) => Promise<JudgeResult>
}

const agents: AgentConfig[] = [
  {
    key: "market",
    label: "Market",
    run: marketAgent,
  },
  {
    key: "competition",
    label: "Competition",
    run: competitionAgent,
  },
  {
    key: "cto",
    label: "CTO",
    run: ctoAgent,
  },
  {
    key: "macro",
    label: "Macro",
    run: macroAgent,
  },
  {
    key: "originality",
    label: "Originality",
    run: originalityAgent,
  },
]

const startMessages: Record<AgentKey, string> = {
  market: "[Market] Starting analysis...",
  competition: "[Competition] Starting analysis...",
  cto: "[CTO] Starting analysis...",
  macro: "[Macro] Starting analysis...",
  originality: "[Originality] Starting analysis...",
}

function sseMessage(message: string): string {
  return `data: ${message}\n\n`
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  const { searchParams } = new URL(request.url)
  const pitch = searchParams.get("pitch")?.trim() ?? ""

  const stream = new ReadableStream({
    async start(controller) {
      const send = (message: string) => {
        controller.enqueue(encoder.encode(sseMessage(message)))
      }

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        if (!pitch) {
          send("[Error] Pitch is required.")
          controller.close()
          return
        }

        for (const agent of agents) {
          send(startMessages[agent.key])
        }

        const agentEntries = await Promise.all(
          agents.map(async (agent) => {
            const result = await agent.run(pitch)
            send(`[${agent.label}] Complete (score: ${result.score})`)

            return [agent.key, result] as const
          })
        )

        const results = Object.fromEntries(agentEntries) as AnalyzePitchResult

        send("[Consensus] Building investment committee verdict...")

        const consensus = await consensusAgent(results)
        const verdict = {
          results,
          consensus,
        }

        send("[Consensus] Complete")
        sendEvent("result", verdict)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Analysis failed with an unknown error."

        send(`[Error] ${message}`)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
