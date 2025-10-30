import { GitHubUser, Repository, RepositoryContent } from '@/types';

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error}`);
  }

  return data.access_token;
}

export async function getUserData(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user data');
  }

  return response.json();
}

export async function fetchUserRepositories(
  accessToken: string,
  search?: string
): Promise<Repository[]> {
  const response = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
    {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  const repos: Repository[] = await response.json();

  if (search) {
    return repos.filter(repo =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  return repos;
}

export async function fetchRepositoryContents(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = ''
): Promise<RepositoryContent[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch repository contents');
  }

  return response.json();
}

export async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3.raw',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch file content');
  }

  return response.text();
}
