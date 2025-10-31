'use client';

export function LoginButton() {
  return (
    <a
      href="/api/auth/github"
      className="bg-white text-black font-semibold py-1.5 px-3 text-sm transition duration-200"
    >
      Login
    </a>
  );
}
