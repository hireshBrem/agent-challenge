"use server";

import { Agent } from "@mastra/core/agent";
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";
import { openai } from "@ai-sdk/openai";


export async function startConversation() {
const agent = new Agent({
    name: "Agent",
    instructions: `You are a helpful assistant with real-time voice capabilities.`,
    model: openai("gpt-4o"),
    voice: new OpenAIRealtimeVoice(),
});

// Connect to the voice service
await agent.voice.connect();


// Initiate the conversation
await agent.voice.speak("How can I help you today?");

// Send continuous audio from the microphone
    // const micStream = getMicrophoneStream();
    // await agent.voice.send(micStream);
}