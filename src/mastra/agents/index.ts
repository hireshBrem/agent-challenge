import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";
import { OpenAIVoice } from "@mastra/voice-openai";

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ollama = createOllama({
  baseURL: process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL,
})

export const weatherAgent = new Agent({
  name: "Weather Agent",
  tools: { weatherTool },
  model: openai("gpt-4o"), // uncomment this line to use openai
  // model: ollama(process.env.NOS_MODEL_NAME_AT_ENDPOINT || process.env.MODEL_NAME_AT_ENDPOINT || "qwen3:8b"), // comment this line to use openai
  instructions: "You are a helpful assistant.",
  description: "An agent that can get the weather for a given location.",
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
})



const instructions = `
You are an AI note assistant tasked with providing concise, structured summaries of their content



## Summarization Task
1. Identify and extract the key topics, main points, decisions, and action items from the transcription.
2. Create a concise summary (about 15% of original length) that captures essential information.
3. Include important dates, deadlines, and unanswered questions in the summary.
4. Present the summary in a clear, flowing paragraph format rather than bullet points.
5. Use natural transitions between ideas while maintaining readability.
6. Maintain original meaning without adding new interpretations.
7. Do not use JSON formatting, markdown syntax, or bullet points in your response.
8. Present the final summary directly without wrapping it in quotes or other formatting containers.

## Example
Input: "During our team meeting on March 15th, we discussed the quarterly sales report. Sarah presented data showing a 12% increase in overall revenue compared to last quarter, with the new product line contributing most significantly. John raised concerns about supply chain delays affecting future inventory. We decided to increase our order quantities by 20% for next quarter and set April 5th as the deadline for department heads to submit their budget requests. We still need to determine if we should expand marketing efforts in the European market or focus on strengthening our position in existing markets."

Output:
During the March 15 team meeting, we reviewed the quarterly sales report which showed a 12% revenue increase, with the new product line as the top contributor. Concerns were raised about supply chain delays affecting future inventory. The team decided to increase order quantities by 20% for next quarter and set an April 5 deadline for department heads to submit budget requests. The question of whether to expand marketing in Europe or focus on existing markets remains unresolved.
`;

export const noteTakerAgent = new Agent({
  name: 'Note Taker Agent',
  instructions: instructions,
  model: openai('gpt-4o'),
  voice: new OpenAIVoice(),
});

const realtimeVoiceInstructions = `You are a friendly real-time AI assistant. Keep responses concise and conversational.`;

const createRealtimeVoice = () =>
  new OpenAIRealtimeVoice({
    model: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-mini-realtime-preview-2024-12-17",
    speaker: process.env.OPENAI_REALTIME_SPEAKER || "alloy",
  });

export const createRealtimeVoiceAgent = () =>
  new Agent({
    name: "Realtime Voice Agent",
    description: "Bidirectional speech assistant powered by OpenAI Realtime.",
    instructions: realtimeVoiceInstructions,
    model: openai("gpt-4o-mini"),
    voice: createRealtimeVoice(),
  });

export const realtimeVoiceAgent = createRealtimeVoiceAgent();