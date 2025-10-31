import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";
import { testMcpClient } from "../mcp/mcp-client";
import {
  getUserRepositoriesTool,
  getRepositoryContentsTool,
  getFileContentTool,
} from "../tools";

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

// GitHub Chat Agent Instructions
const githubChatInstructions = `You are a helpful GitHub repository assistant with access to GitHub tools.

Your role is to help users understand and navigate their GitHub repositories. You can:
- Search and browse GitHub repositories
- View repository contents, files, and commits
- Create issues, pull requests, and manage repositories
- Answer questions about repository structure and contents
- Explain code files and their purpose
- Provide insights about the codebase
- Help users understand dependencies and configurations
- Suggest improvements or best practices

When a user asks about a specific file or repository:
- Use the GitHub tools available to fetch accurate, up-to-date information
- Provide clear, concise explanations
- Reference specific file names and paths when relevant
- Be friendly and helpful
- If you don't have enough context, ask clarifying questions

Keep your responses concise but informative. Use markdown formatting when appropriate for code snippets.`;

export const githubChatAgent = new Agent({
  name: "GitHub Chat Agent",
  description: "A helpful assistant for exploring and understanding GitHub repositories with GitHub MCP tools.",
  instructions: githubChatInstructions,
  model: openai("gpt-4o"),
  tools: {
    getUserRepositories: getUserRepositoriesTool,
    getRepositoryContents: getRepositoryContentsTool,
    getFileContent: getFileContentTool,
  },
});

