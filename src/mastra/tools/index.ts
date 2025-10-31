import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  fetchUserRepositories,
  fetchRepositoryContents,
  fetchFileContent,
} from '@/lib/github';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export type WeatherToolResult = z.infer<typeof WeatherToolResultSchema>;

const WeatherToolResultSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number(),
  conditions: z.string(),
  location: z.string(),
});

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: WeatherToolResultSchema,
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}

// GitHub Tools
export const getUserRepositoriesTool = createTool({
  id: 'get-user-repositories',
  description: 'Fetch the authenticated user\'s GitHub repositories',
  inputSchema: z.object({
    search: z.string().optional().describe('Optional search query to filter repositories by name or description'),
    accessToken: z.string().describe('GitHub access token for authentication'),
  }),
  outputSchema: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    language: z.string().nullable(),
    stargazers_count: z.number(),
    forks_count: z.number(),
    updated_at: z.string(),
  })),
  execute: async ({ context }) => {
    const repos = await fetchUserRepositories(context.accessToken, context.search);
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description ?? null,
      url: repo.html_url,
      language: repo.language ?? null,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count ?? 0,
      updated_at: repo.updated_at ?? new Date().toISOString(),
    }));
  },
});

export const getRepositoryContentsTool = createTool({
  id: 'get-repository-contents',
  description: 'Fetch the contents of a GitHub repository or a specific path within it',
  inputSchema: z.object({
    accessToken: z.string().describe('GitHub access token for authentication'),
    owner: z.string().describe('Repository owner username'),
    repo: z.string().describe('Repository name'),
    path: z.string().optional().describe('Path within the repository (default is root)'),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(['file', 'dir']),
    size: z.number(),
    url: z.string(),
  })),
  execute: async ({ context }) => {
    const contents = await fetchRepositoryContents(
      context.accessToken,
      context.owner,
      context.repo,
      context.path || ''
    );
    return contents.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type as 'file' | 'dir',
      size: item.size ?? 0,
      url: item.html_url ?? '',
    }));
  },
});

export const getFileContentTool = createTool({
  id: 'get-file-content',
  description: 'Fetch the raw content of a specific file from a GitHub repository',
  inputSchema: z.object({
    accessToken: z.string().describe('GitHub access token for authentication'),
    owner: z.string().describe('Repository owner username'),
    repo: z.string().describe('Repository name'),
    path: z.string().describe('Path to the file within the repository'),
  }),
  outputSchema: z.object({
    content: z.string().describe('Raw file content'),
  }),
  execute: async ({ context }) => {
    const content = await fetchFileContent(
      context.accessToken,
      context.owner,
      context.repo,
      context.path
    );
    return { content };
  },
});