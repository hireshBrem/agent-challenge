'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RepoSearch from '@/components/RepoSearch';
import LogoutButton from '@/components/LogoutButton';
import { GitHubUser } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          router.push('/');
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">GitHub Repo Browser</h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">{user.login}</span>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        <div className="space-y-6 h-full flex flex-col">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome, {user?.name || user?.login}! 👋
            </h2>
            <p className="text-gray-600 text-sm">
              Search for any of your repositories using the search box below. Click on a repository to browse its contents and view file details.
            </p>
          </div>

          {/* Search Section - Takes remaining space */}
          <div className="bg-white rounded-lg shadow p-8 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Find Your Repository
            </h3>
            <div className="flex-1 overflow-hidden">
              <RepoSearch />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
