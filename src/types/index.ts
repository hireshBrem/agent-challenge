export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  stargazers_count: number;
  language?: string;
}

export interface RepositoryContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
  download_url?: string;
  content?: string;
  encoding?: string;
}

export interface Session {
  user: GitHubUser;
  accessToken: string;
  expiresAt: number;
}
