import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('github_token')?.value;
    const userCookie = req.cookies.get('github_user')?.value;

    if (!token || !userCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = JSON.parse(userCookie);

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
