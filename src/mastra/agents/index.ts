import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";

export const AgentState = z.object({
    proverbs: z.array(z.string()).default([])
});

const realtimeVoiceInstructions = `You are a friendly real-time AI assistant. Keep responses concise and conversational.`;

const createRealtimeVoice = () =>
  new OpenAIRealtimeVoice({
    model: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-mini-realtime-preview-2024-12-17",
    speaker: process.env.OPENAI_REALTIME_SPEAKER || "alloy",
});

export const realtimeVoiceAgent =
  new Agent({
    name: "Realtime Voice Agent",
    description: "Bidirectional speech assistant powered by OpenAI Realtime.",
    instructions: realtimeVoiceInstructions,
    model: openai("gpt-4o"),
    voice: createRealtimeVoice(),
});

// Factory function to create new agent instances for each voice session
export const createRealtimeVoiceAgent = () => {
  return new Agent({
    name: "Realtime Voice Agent",
    description: "Bidirectional speech assistant powered by OpenAI Realtime.",
    instructions: realtimeVoiceInstructions,
    model: openai("gpt-4o"),
    voice: createRealtimeVoice(),
  });
};

