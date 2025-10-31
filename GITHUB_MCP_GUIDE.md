# GitHub MCP Integration Guide

This guide explains how to use the GitHub MCP (Model Context Protocol) integration in your Mastra application.

## Overview

The GitHub MCP integration connects your `githubChatAgent` to the official GitHub MCP server, providing powerful GitHub tools that your agent can use to interact with GitHub repositories.

## What Can the Agent Do?

With GitHub MCP tools, your agent can:

- **Search Repositories**: Find repositories based on various criteria
- **Browse Repository Contents**: View files, directories, and repository structure
- **Read Files**: Fetch and read file contents from repositories
- **View Commits**: Access commit history and details
- **Create Issues**: Open new issues in repositories
- **Manage Pull Requests**: Create and manage pull requests
- **Repository Management**: Perform various repository operations

## Setup

### 1. Install Dependencies

The required `@mastra/mcp` package is already installed in your project.

### 2. Configure Environment Variable

Add your GitHub Personal Access Token to your `.env.local` file:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

**How to get a token:**
1. Go to [GitHub Settings - Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select these scopes:
   - `repo` - Full control of private repositories
   - `read:org` - Read org and team membership
   - `read:user` - Read user profile data
4. Generate and copy the token
5. Add it to your `.env.local` file

### 3. Files Modified

The integration has been added to these files:

- **`src/mastra/mcp/github-client.ts`** - New file containing the MCPClient configuration
- **`src/mastra/agents/index.ts`** - Updated `githubChatAgent` to use GitHub MCP tools
- **`src/mastra/mcp/index.ts`** - Exports the `githubMcpClient`

## Architecture

### MCPClient Configuration

```typescript
// src/mastra/mcp/github-client.ts
import { MCPClient } from "@mastra/mcp";

export const githubMcpClient = new MCPClient({
  id: "github-mcp-client",
  servers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "",
      },
    },
  },
});
```

The MCPClient:
- Uses `npx` to run the official `@modelcontextprotocol/server-github` package
- Passes your GitHub token as an environment variable
- Provides tools to the agent automatically

### Agent Integration

```typescript
// src/mastra/agents/index.ts
export const githubChatAgent = new Agent({
  name: "GitHub Chat Agent",
  description: "A helpful assistant for exploring GitHub repositories with GitHub MCP tools.",
  instructions: githubChatInstructions,
  model: openai("gpt-4o"),
  tools: await githubMcpClient.getTools(), // 👈 GitHub tools added here
});
```

The agent:
- Automatically loads all tools from the GitHub MCP server
- Uses these tools to respond to user queries about GitHub
- Can perform GitHub actions on behalf of the user

## Usage Examples

Once set up, you can ask your agent questions like:

- "Show me the README file from the user/repo repository"
- "List all files in the src directory of my-project"
- "What are the recent commits in this repository?"
- "Create an issue in user/repo about bug XYZ"
- "Search for repositories related to machine learning"

The agent will automatically use the appropriate GitHub tools to fulfill these requests.

## Testing

1. Start your Mastra agent server:
   ```bash
   pnpm run dev:agent
   ```

2. Start your Next.js UI:
   ```bash
   pnpm run dev:ui
   ```

3. Open http://localhost:3000 and interact with the GitHub Chat Agent

4. Try asking it to fetch information from a GitHub repository

## Troubleshooting

### "Authentication failed" errors

- Verify your `GITHUB_PERSONAL_ACCESS_TOKEN` is set correctly in `.env.local`
- Check that the token has the required scopes
- Generate a new token if the current one is expired

### "Could not connect to MCP server" errors

- Ensure `npx` is available in your PATH
- Check your internet connection (needed to fetch the MCP server package)
- Try running the command manually: `npx -y @modelcontextprotocol/server-github`

### Tools not working as expected

- Check the Mastra agent server logs for detailed error messages
- Verify you have permissions for the repository you're trying to access
- Some operations require specific repository permissions

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit your `.env.local` file** - It contains sensitive tokens
2. **Use minimal scopes** - Only grant the permissions your agent needs
3. **Rotate tokens regularly** - Generate new tokens periodically
4. **Monitor token usage** - Check GitHub's token activity logs
5. **Use separate tokens** - Consider different tokens for development vs production

## Learn More

- [Mastra MCP Documentation](https://mastra.ai/docs/tools-mcp/mcp-overview)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## Next Steps

Now that GitHub MCP is integrated, you can:

1. Customize the `githubChatInstructions` in `src/mastra/agents/index.ts` for your use case
2. Add more MCP servers (e.g., Wikipedia, Weather, etc.) following the same pattern
3. Create workflows that combine GitHub operations with other tools
4. Build UI components that leverage the GitHub agent's capabilities

