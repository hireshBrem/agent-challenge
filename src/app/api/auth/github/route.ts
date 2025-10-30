import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'GitHub OAuth environment variables not configured' },
      { status: 500 }
    );
  }

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.append('client_id', clientId);
  githubUrl.searchParams.append('redirect_uri', redirectUri);
  githubUrl.searchParams.append('scope', 'repo user');
  githubUrl.searchParams.append('allow_signup', 'true');

  return NextResponse.redirect(githubUrl.toString());
}
