import { MCPClient } from "@mastra/mcp";

export const testMcpClient = new MCPClient({
  id: "test-mcp-client",
  servers: {
    wikipedia: {
      command: "npx",
      args: ["-y", "wikipedia-mcp"],
    },
    github: {
      // type: "http",
      url: new URL("https://api.githubcopilot.com/mcp/"),
    },
  },
});