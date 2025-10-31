'use client';

import { useState, useCallback } from 'react';
import { Repository } from '@/types';
import RepoContentViewer from './RepoContentViewer';

export function RepoSearch() {
  const [search, setSearch] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRepos([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/repos?search=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error('Failed to search repositories');
      }
      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      const timer = setTimeout(() => handleSearch(query), 300);
      return () => clearTimeout(timer);
    },
    [handleSearch]
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search your repositories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {loading && (
            <div className="absolute right-4 top-3">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>

      {repos.length > 0 && !selectedRepo && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Found {repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'}
          </p>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {repo.name}
                    </h3>
                    {repo.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span>⭐ {repo.stargazers_count}</span>
                    </div>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      repo.private
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {repo.private ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRepo && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <button
              onClick={() => setSelectedRepo(null)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to repositories
            </button>
          </div>
          <RepoContentViewer
            owner={selectedRepo.owner.login}
            repo={selectedRepo.name}
          />
        </div>
      )}

      {repos.length === 0 && search && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No repositories found matching &quot;{search}&quot;
          </p>
        </div>
      )}

      {repos.length === 0 && !search && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Start typing to search your repositories
          </p>
        </div>
      )}
    </div>
  );
}

export default RepoSearch;
