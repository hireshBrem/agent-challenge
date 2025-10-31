import { MCPServer } from "@mastra/mcp"
import { realtimeVoiceAgent } from "../agents";
import { weatherTool } from "../tools";

export const server = new MCPServer({
  name: "My Custom Server",
  version: "1.0.0",
  tools: { weatherTool },
  agents: { realtimeVoiceAgent }, // this agent will become tool "ask_weatherAgent"
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});
