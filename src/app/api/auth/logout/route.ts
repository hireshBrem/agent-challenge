import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.delete('github_token');
  response.cookies.delete('github_user');

  return response;
}

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/', req.url));

  response.cookies.delete('github_token');
  response.cookies.delete('github_user');

  return response;
}
