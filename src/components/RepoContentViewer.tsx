'use client';

import { useState, useEffect } from 'react';
import { RepositoryContent } from '@/types';

interface RepoContentViewerProps {
  owner: string;
  repo: string;
}

// Helper function to get file extension
const getFileExtension = (path: string): string => {
  const ext = path.split('.').pop() || '';
  return ext.toLowerCase();
};

// Syntax highlighting colors by language
const getLanguageColor = (ext: string): string => {
  const colors: Record<string, string> = {
    ts: 'bg-blue-50 text-blue-900',
    tsx: 'bg-blue-50 text-blue-900',
    js: 'bg-yellow-50 text-yellow-900',
    jsx: 'bg-yellow-50 text-yellow-900',
    json: 'bg-purple-50 text-purple-900',
    md: 'bg-gray-50 text-gray-900',
    css: 'bg-pink-50 text-pink-900',
    html: 'bg-orange-50 text-orange-900',
    py: 'bg-blue-50 text-blue-900',
    java: 'bg-red-50 text-red-900',
    cpp: 'bg-indigo-50 text-indigo-900',
    c: 'bg-indigo-50 text-indigo-900',
    go: 'bg-cyan-50 text-cyan-900',
    rs: 'bg-orange-50 text-orange-900',
    rb: 'bg-red-50 text-red-900',
    php: 'bg-indigo-50 text-indigo-900',
    sql: 'bg-emerald-50 text-emerald-900',
    xml: 'bg-purple-50 text-purple-900',
    yaml: 'bg-gray-50 text-gray-900',
    yml: 'bg-gray-50 text-gray-900',
  };
  return colors[ext] || 'bg-gray-50 text-gray-900';
};

export function RepoContentViewer({ owner, repo }: RepoContentViewerProps) {
  const [contents, setContents] = useState<RepositoryContent[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['']);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch folder contents
  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/repo-contents?owner=${owner}&repo=${repo}&path=${currentPath}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch repository contents');
        }
        const data = await response.json();
        setContents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contents');
        setContents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [owner, repo, currentPath]);

  // Fetch file contents when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setFileContent(null);
      return;
    }

    const fetchFile = async () => {
      setFileLoading(true);
      setFileError(null);
      try {
        const response = await fetch(
          `/api/file-content?owner=${owner}&repo=${repo}&path=${encodeURIComponent(selectedFile)}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch file content');
        }
        const data = await response.json();
        setFileContent(data.content);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Failed to fetch file');
        setFileContent(null);
      } finally {
        setFileLoading(false);
      }
    };

    fetchFile();
  }, [owner, repo, selectedFile]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
    const parts = path.split('/').filter(p => p);
    setBreadcrumbs(['', ...parts]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const path = breadcrumbs.slice(0, index + 1).join('/');
    handleNavigate(path);
  };

  const handleFileClick = (item: RepositoryContent) => {
    if (item.type === 'file') {
      setSelectedFile(item.path);
    }
  };

  const getLanguageLabel = (path: string) => {
    const ext = getFileExtension(path);
    const labels: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TSX',
      js: 'JavaScript',
      jsx: 'JSX',
      json: 'JSON',
      md: 'Markdown',
      css: 'CSS',
      html: 'HTML',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
      php: 'PHP',
      sql: 'SQL',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
    };
    return labels[ext] || ext.toUpperCase() || 'File';
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm px-4 py-2 bg-white rounded-lg border border-gray-200">
        <span className="text-gray-600 font-medium">{repo}</span>
        <span className="text-gray-400">/</span>
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400">/</span>}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`${
                index === breadcrumbs.length - 1
                  ? 'text-gray-600 cursor-default'
                  : 'text-blue-600 hover:text-blue-700 hover:underline'
              }`}
            >
              {crumb || 'root'}
            </button>
          </div>
        ))}
      </div>

      {/* Split Screen Container */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Panel - File Tree */}
        <div className="w-1/3 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Files</h3>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8 flex-1">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-red-700 text-sm bg-red-50 flex-1">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && contents.length === 0 && (
            <div className="flex items-center justify-center py-8 flex-1 text-gray-500 text-sm">
              Empty directory
            </div>
          )}

          {/* File List */}
          {!loading && !error && contents.length > 0 && (
            <div className="overflow-y-auto flex-1">
              {contents.map((item) => (
                <div
                  key={item.sha}
                  onClick={() => {
                    if (item.type === 'dir') {
                      handleNavigate(item.path);
                    } else {
                      handleFileClick(item);
                    }
                  }}
                  className={`p-3 flex items-center justify-between hover:bg-blue-50 transition cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    selectedFile === item.path ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.type === 'dir' ? (
                      <svg
                        className="w-4 h-4 text-yellow-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="truncate text-gray-900 text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  {item.type === 'file' && item.size && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {(item.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  {item.type === 'dir' && (
                    <span className="text-gray-400 ml-2">→</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - File Content */}
        <div className="w-2/3 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate text-gray-900 font-semibold text-sm">
                    {selectedFile.split('/').pop()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${getLanguageColor(
                      getFileExtension(selectedFile)
                    )}`}
                  >
                    {getLanguageLabel(selectedFile)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 transition"
                  title="Close file"
                >
                  ✕
                </button>
              </div>

              {/* File Path */}
              <div className="px-4 py-2 bg-gray-100 text-xs text-gray-600 border-b border-gray-200">
                {selectedFile}
              </div>

              {/* Content Area */}
              {fileLoading && (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                </div>
              )}

              {fileError && (
                <div className="p-4 text-red-700 bg-red-50 text-sm">
                  {fileError}
                </div>
              )}

              {fileContent && !fileLoading && (
                <pre className="overflow-auto flex-1 p-4 font-mono text-sm text-gray-800 leading-relaxed bg-gray-50">
                  <code>{fileContent}</code>
                </pre>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-500">
              <div className="text-center space-y-2">
                <svg
                  className="w-12 h-12 mx-auto text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">Select a file to view contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RepoContentViewer;
