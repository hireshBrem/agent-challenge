import { MCPClient, MCPServer } from "@mastra/mcp"
import { realtimeVoiceAgent } from "../agents";
import { weatherTool } from "../tools";
import { githubChatAgent } from "../agents";

export const server = new MCPServer({
  name: "My Custom Server",
  version: "1.0.0",
  tools: { weatherTool },
  agents: { realtimeVoiceAgent }, // this agent will become tool "ask_weatherAgent"
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});

export const githubMcpClient = new MCPClient({
    id: "github",
    servers: {
        github: {
            // type: "http",
            url: new URL("https://api.githubcopilot.com/mcp/")
        }
    }
});
  