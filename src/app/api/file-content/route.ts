import { NextRequest, NextResponse } from 'next/server';
import { fetchFileContent } from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('github_token')?.value;
    const owner = req.nextUrl.searchParams.get('owner');
    const repo = req.nextUrl.searchParams.get('repo');
    const path = req.nextUrl.searchParams.get('path');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: 'Missing owner, repo, or path parameter' },
        { status: 400 }
      );
    }

    const content = await fetchFileContent(token, owner, repo, path);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('File content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 }
    );
  }
}
