import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryContents } from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('github_token')?.value;
    const owner = req.nextUrl.searchParams.get('owner');
    const repo = req.nextUrl.searchParams.get('repo');
    const path = req.nextUrl.searchParams.get('path') || '';

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing owner or repo parameter' },
        { status: 400 }
      );
    }

    const contents = await fetchRepositoryContents(token, owner, repo, path);

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Repo contents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository contents' },
      { status: 500 }
    );
  }
}
