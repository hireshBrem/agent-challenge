'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, HelpCircle, Copy, ChevronRight, Folder, File, Search, Loader2Icon, PhoneIcon, PhoneOffIcon } from 'lucide-react';
import { Repository, RepositoryContent, GitHubUser } from '@/types';
import { useConversation } from '@elevenlabs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Orb } from '@/components/ui/orb';
import { ShimmeringText } from '@/components/ui/shimmering-text';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileTreeItem[];
  expanded?: boolean;
}

export default function Home() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [search, setSearch] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [openFiles, setOpenFiles] = useState<Array<{ path: string; content: string; name: string }>>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRepo, setLoadingRepo] = useState(false);
  
  // Voice chat state
  const [agentState, setAgentState] = useState<'disconnected' | 'connecting' | 'connected' | 'disconnecting' | null>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const DEFAULT_AGENT = {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
    name: 'VoiceCode AI',
    description: 'Click below to start voice coding',
  };

  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => {
      console.error('Error:', error);
      setAgentState('disconnected');
    },
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  // Search repositories
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRepos([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/repos?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      }
    } catch (err) {
      console.error('Search error:', err);
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

  // Build file tree structure from immediate children only
  // GitHub API returns only immediate children of a directory
  const buildFileTree = (contents: RepositoryContent[]): FileTreeItem[] => {
    if (!contents || contents.length === 0) return [];

    return contents
      .map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        expanded: expandedFolders[item.path] || false,
        children: item.type === 'dir' ? [] : undefined,
      }))
      .sort((a, b) => {
        // Directories first, then files
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
  };

  // Load repository contents
  const loadRepositoryContents = async (repo: Repository) => {
    setLoadingRepo(true);
    setSelectedRepo(repo);
    setOpenFiles([]);
    setSelectedTab(null);

    try {
      const response = await fetch(`/api/repo-contents?owner=${repo.owner.login}&repo=${repo.name}&path=`);
      if (response.ok) {
        const contents: RepositoryContent[] = await response.json();
        const tree = buildFileTree(contents);
        setFileTree(tree);
      }
    } catch (err) {
      console.error('Failed to load repository contents:', err);
    } finally {
      setLoadingRepo(false);
    }
  };

  // Load folder contents when expanded
  const loadFolderContents = async (path: string) => {
    if (!selectedRepo) return;

    try {
      const response = await fetch(`/api/repo-contents?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const contents: RepositoryContent[] = await response.json();
        const newItems = buildFileTree(contents);
        
        // Merge with existing tree
        const updateTree = (items: FileTreeItem[]): FileTreeItem[] => {
          return items.map(item => {
            if (item.path === path && item.type === 'dir') {
              return { ...item, children: newItems, expanded: true };
            }
            if (item.children && item.children.length > 0) {
              return { ...item, children: updateTree(item.children) };
            }
            return item;
          });
        };
        
        setFileTree(prev => updateTree(prev));
      }
    } catch (err) {
      console.error('Failed to load folder contents:', err);
    }
  };

  // Load file content
  const loadFileContent = async (path: string, name: string) => {
    if (!selectedRepo) return;

    // Check if file is already open
    const existingFile = openFiles.find(f => f.path === path);
    if (existingFile) {
      setSelectedTab(path);
      return;
    }

    try {
      const response = await fetch(`/api/file-content?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        const newFile = { path, content: data.content, name };
        setOpenFiles([...openFiles, newFile]);
        setSelectedTab(path);
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }));

    // Load folder contents if expanding for the first time
    if (!expandedFolders[path]) {
      loadFolderContents(path);
    }
  };

  const renderFileTree = (items: FileTreeItem[], level: number = 0): React.ReactElement[] => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          onClick={() => {
            if (item.type === 'dir') {
              toggleFolder(item.path);
            } else {
              loadFileContent(item.path, item.name);
            }
          }}
          className={`flex items-center gap-1 w-full text-left hover:bg-gray-900 px-2 py-1 rounded cursor-pointer ${
            selectedTab === item.path ? 'bg-gray-800' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {item.type === 'dir' ? (
            <>
              <ChevronRight
                className={`h-4 w-4 transition-transform flex-shrink-0 ${
                  expandedFolders[item.path] ? 'rotate-90' : ''
                }`}
              />
              <Folder className="h-4 w-4 flex-shrink-0" />
            </>
          ) : (
            <>
              <div className="w-4 h-4 flex-shrink-0" />
              <File className="h-4 w-4 flex-shrink-0" />
            </>
          )}
          <span className="text-sm truncate">{item.name}</span>
        </div>
        {item.type === 'dir' && expandedFolders[item.path] && item.children && (
          <div>{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  const closeFile = (path: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (selectedTab === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setSelectedTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  const getCurrentFileContent = (): string => {
    const file = openFiles.find(f => f.path === selectedTab);
    return file?.content || '';
  };

  // Voice chat functions
  const startConversation = useCallback(async () => {
    try {
      setErrorMessage(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: DEFAULT_AGENT.agentId,
        connectionType: 'webrtc',
        onStatusChange: (status) => setAgentState(status.status),
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      setAgentState('disconnected');
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setErrorMessage('Please enable microphone permissions in your browser.');
      }
    }
  }, [conversation]);

  const handleCall = useCallback(() => {
    if (agentState === 'disconnected' || agentState === null) {
      setAgentState('connecting');
      startConversation();
    } else if (agentState === 'connected') {
      conversation.endSession();
      setAgentState('disconnected');
    }
  }, [agentState, conversation, startConversation]);

  const isCallActive = agentState === 'connected';
  const isTransitioning = agentState === 'connecting' || agentState === 'disconnecting';

  const getInputVolume = useCallback(() => {
    const rawValue = conversation.getInputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  const getOutputVolume = useCallback(() => {
    const rawValue = conversation.getOutputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white font-mono">
      {/* Header with Search */}
      <header className="w-full border-b border-gray-800 px-4 py-3 relative">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your repositories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded text-sm focus:outline-none focus:border-white"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full" />
              <span>{user.login}</span>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {search && repos.length > 0 && !selectedRepo && (
          <div className="absolute z-50 mt-1 max-w-md bg-black border border-gray-800 rounded shadow-lg max-h-96 overflow-y-auto">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => loadRepositoryContents(repo)}
                className="p-3 hover:bg-gray-900 cursor-pointer border-b border-gray-800 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{repo.name}</h3>
                    {repo.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{repo.description}</p>
                    )}
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    repo.private ? 'bg-gray-800' : 'bg-green-900'
                  }`}>
                    {repo.private ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRepo && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                setSelectedRepo(null);
                setFileTree([]);
                setOpenFiles([]);
                setSelectedTab(null);
                setSearch('');
              }}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </button>
            <span className="text-gray-400">/</span>
            <span className="font-semibold">{selectedRepo.name}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Project Files */}
        <div className="w-64 border-r border-gray-800 bg-black flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-bold">Project Files</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 dark-scrollbar">
            {loadingRepo ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div>
              </div>
            ) : selectedRepo && fileTree.length > 0 ? (
              renderFileTree(fileTree)
            ) : selectedRepo ? (
              <div className="text-sm text-gray-400 py-4">No files found</div>
            ) : (
              <div className="text-sm text-gray-400 py-4">Select a repository to view files</div>
            )}
          </div>
        </div>

        {/* Middle Panel - Code Viewer */}
        <div className="flex-1 border-r border-gray-800 bg-black flex flex-col">
            {/* Show only if there are open files */}
            {openFiles.length > 0 && (  
            <div className="px-4 py-2 border-b border-gray-800">
                {/* <h2 className="text-sm font-bold mb-2">Code </h2> */}
                {openFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {openFiles.map((file) => (
                    <div
                        key={file.path}
                        onClick={() => setSelectedTab(file.path)}
                        className={`px-3 py-1 text-sm border relative cursor-pointer flex items-center gap-2 ${
                        selectedTab === file.path
                            ? 'border-white bg-white text-black'
                            : 'border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <span>{file.name}</span>
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            closeFile(file.path);
                        }}
                        className="hover:text-red-400"
                        >
                        ×
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>
            )}
          <div className="flex-1 overflow-y-auto relative dark-scrollbar">
            {selectedTab ? (
              <>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      const content = getCurrentFileContent();
                      navigator.clipboard.writeText(content);
                    }}
                    className="p-2 hover:bg-gray-900 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <pre className="p-6 text-sm leading-relaxed whitespace-pre-wrap">
                  <code>{getCurrentFileContent()}</code>
                </pre>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a file to view contents</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - VoiceCode AI */}
        <div className="w-96 bg-black flex flex-col items-center justify-between py-8 px-6">
          {/* Top Section - Voice Chat Interface */}
          <div className="flex flex-col items-center flex-1 justify-center w-full">
            {/* Orb Graphic */}
            <div className="relative size-32 mb-6">
              <div className="bg-muted relative h-full w-full rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
                  <Orb
                    className="h-full w-full"
                    volumeMode="manual"
                    getInputVolume={getInputVolume}
                    getOutputVolume={getOutputVolume}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <h2 className="text-xl font-bold">{DEFAULT_AGENT.name}</h2>
              <AnimatePresence mode="wait">
                {errorMessage ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-red-400 text-center text-sm"
                  >
                    {errorMessage}
                  </motion.p>
                ) : agentState === 'disconnected' || agentState === null ? (
                  <motion.p
                    key="disconnected"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-gray-400 text-sm"
                  >
                    {DEFAULT_AGENT.description}
                  </motion.p>
                ) : (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full transition-all duration-300',
                        agentState === 'connected' && 'bg-green-500',
                        isTransitioning && 'bg-blue-500 animate-pulse'
                      )}
                    />
                    <span className="text-sm capitalize">
                      {isTransitioning ? (
                        <ShimmeringText text={agentState} />
                      ) : (
                        <span className="text-green-600">Connected</span>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice Input Button */}
            <Button
              onClick={handleCall}
              disabled={isTransitioning}
              size="icon"
              variant={isCallActive ? 'secondary' : 'default'}
              className="h-15 w-15 cursor-pointer rounded-full border-2 border-white hover:bg-gray-900 transition-colors"
            >
              <AnimatePresence mode="wait">
                {isTransitioning ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                    }}
                  >
                    <Loader2Icon className="h-8 w-8" />
                  </motion.div>
                ) : isCallActive ? (
                  <motion.div
                    key="end"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <PhoneOffIcon className="h-8 w-8" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="start"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <PhoneIcon className="h-8 w-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
