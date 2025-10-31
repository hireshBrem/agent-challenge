import { MCPClient } from "@mastra/mcp";

/**
 * MCPClient for GitHub
 * Connects to the official GitHub MCP server to provide GitHub-related tools
 * 
 * Required environment variable:
 * - GITHUB_PERSONAL_ACCESS_TOKEN: Your GitHub personal access token
 */
export const githubMcpClient = new MCPClient({
  id: "github-mcp-client",
  servers: {
    github: {
    //   type: "http",
      url: new URL("https://api.githubcopilot.com/mcp/")
    }
  }
});

