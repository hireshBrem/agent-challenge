import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { MCPClient } from '@mastra/mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, repo, file, userGithubToken } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context for the agent
    let contextMessage = message;
    
    if (repo) {
      contextMessage = `Repository: ${repo.owner.login}/${repo.name}\n`;
      if (file) {
        contextMessage += `Current file: ${file}\n`;
      }
      contextMessage += `\nUser question: ${message}`;
    //   add access token to the context message
      contextMessage += `\nUser access token: ${userGithubToken}`;
    }

    // Get the GitHub chat agent
    const agent = mastra.getAgent('githubChatAgent');

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 500 }
      );
    }

    // Generate response using the agent
    const response = await agent.generateVNext(contextMessage);

    return NextResponse.json({
      message: response.text,
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

