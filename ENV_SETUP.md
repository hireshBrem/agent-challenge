# Environment Variables Setup

This document describes all the environment variables needed for the Mastra Speech-to-Speech integration.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

### OpenAI Configuration

```bash
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

### OpenAI Realtime Voice Configuration

```bash
# OpenAI Realtime Voice Model
# Available models: gpt-4o-mini-realtime-preview-2024-12-17, gpt-4o-realtime-preview
OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview-2024-12-17

# OpenAI Realtime Voice Speaker
# Available speakers: alloy, echo, shimmer, ash, ballad, coral, sage, verse
OPENAI_REALTIME_SPEAKER=alloy
```

### Mastra API Configuration

```bash
# URL where your Mastra agent backend is running
# For development: http://localhost:4111
# For production: your deployed Mastra backend URL
NEXT_PUBLIC_MASTRA_API_URL=http://localhost:4111
```

### Optional Configuration

```bash
# Log Level
# Available levels: debug, info, warn, error
LOG_LEVEL=info

# GitHub OAuth (if using GitHub authentication)
# Create an OAuth app at https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Session Secret (for authentication)
SESSION_SECRET=your_random_secret_key_here
```

## Quick Start

1. Copy the template above to a new file called `.env.local`:
   ```bash
   touch .env.local
   ```

2. Add your OpenAI API key (required for voice features)

3. Adjust other settings as needed for your deployment

## Getting OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

## Testing Your Configuration

After setting up your environment variables, test the configuration:

```bash
# Start the Mastra agent server
pnpm run dev:agent

# In another terminal, start the Next.js dev server
pnpm run dev:ui

# Open http://localhost:3000 in your browser
# Click the phone icon to start a voice session
```

## Troubleshooting

### Voice connection fails
- Ensure your `OPENAI_API_KEY` is valid
- Check that you have microphone permissions in your browser
- Verify the Mastra agent server is running on port 4111

### WebSocket connection errors
- Make sure both dev servers are running
- Check browser console for detailed error messages
- Verify your firewall isn't blocking WebSocket connections

### Audio not playing
- Check browser audio permissions
- Ensure your speakers/headphones are working
- Check browser console for audio playback errors

