import { NextRequest, NextResponse } from 'next/server';
import { fetchUserRepositories } from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('github_token')?.value;
    const search = req.nextUrl.searchParams.get('search') || '';

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repos = await fetchUserRepositories(token, search);

    return NextResponse.json(repos);
  } catch (error) {
    console.error('Repos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
