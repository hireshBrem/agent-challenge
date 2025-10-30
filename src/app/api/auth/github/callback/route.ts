import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserData } from '@/lib/github';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', req.url));
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Fetch user data to verify token
    const user = await getUserData(accessToken);

    // Create response and set secure cookie
    const response = NextResponse.redirect(new URL('/dashboard', req.url));

    // Set secure HTTP-only cookie with access token
    response.cookies.set('github_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set user info cookie (can be public)
    response.cookies.set(
      'github_user',
      JSON.stringify({
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      }),
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      }
    );

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', req.url)
    );
  }
}
