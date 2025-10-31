# Mastra Speech-to-Speech Implementation Summary

This document provides an overview of the Mastra speech-to-speech integration that has been implemented in this Next.js application.

## 📁 File Structure

The implementation follows the recommended Mastra pattern with these key files:

```
nosana-ai-challenge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── agent/
│   │   │       └── route.ts              # API route for agent interaction
│   │   └── page.tsx                      # Main UI page with VoiceChat component
│   ├── components/
│   │   └── VoiceChat.tsx                 # Speech-to-speech UI component
│   ├── lib/
│   │   └── mastraClient.ts               # Client-side Mastra client wrapper
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── index.ts                  # Mastra agent definitions
│   │   └── index.ts                      # Mastra instance registration
│   └── pages/
│       └── api/
│           └── voice-session.ts          # WebSocket handler for voice
├── ENV_SETUP.md                          # Environment variables documentation
└── IMPLEMENTATION_SUMMARY.md             # This file
```

## 🎯 Implementation Details

### 1. Mastra Agent Configuration (`src/mastra/agents/index.ts`)

**What was implemented:**
- Defined a speech-to-speech agent using OpenAI's Realtime Voice API
- Added factory function `createRealtimeVoiceAgent()` for creating new agent instances
- Configured voice settings (model, speaker) via environment variables

**Key features:**
- Model: `gpt-4o-mini-realtime-preview-2024-12-17` (configurable)
- Speaker: `alloy` (configurable, options: alloy, echo, shimmer, ash, ballad, coral, sage, verse)
- Bidirectional speech processing

### 2. Mastra Instance Registration (`src/mastra/index.ts`)

**Already implemented:**
- Registers the `realtimeVoiceAgent` with the Mastra instance
- Includes MCP server integration
- Uses LibSQL for storage
- Configured with console logging

### 3. Mastra Client Wrapper (`src/lib/mastraClient.ts`)

**What was implemented:**
- Client-side wrapper for interacting with Mastra backend
- Configurable base URL (defaults to `http://localhost:4111`)
- Enables frontend-to-agent communication

### 4. API Route for Agent Interaction (`src/app/api/agent/route.ts`)

**What was implemented:**
- POST endpoint at `/api/agent`
- Accepts messages in standard format
- Returns agent responses
- Error handling for missing or invalid requests

**Usage example:**
```typescript
const response = await fetch('/api/agent/route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    messages: [{ role: 'user', content: 'Hello, AI!' }] 
  }),
});
```

### 5. VoiceChat Component (`src/components/VoiceChat.tsx`)

**What was implemented:**
- Full speech-to-speech UI with visual feedback
- WebSocket connection to voice-session API
- Audio input processing using MediaRecorder API
- Audio output playback
- Volume visualization with animated Orb component
- Connection state management (disconnected, connecting, connected, error)
- Real-time transcript display
- Clean UI with phone icon button

**Key features:**
- Click phone icon to start voice session
- Real-time audio streaming to/from the agent
- Visual feedback during recording and playback
- Automatic cleanup on unmount
- Error handling and retry capability

### 6. WebSocket Voice Session (`src/pages/api/voice-session.ts`)

**Already implemented:**
- WebSocket server for real-time voice communication
- Handles audio streaming in both directions
- Manages agent lifecycle per connection
- Supports multiple message types (start, stop, audio, text)

## 🚀 How to Use

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables (see `ENV_SETUP.md`):
   ```bash
   touch .env.local
   ```

3. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Application

1. Start the Mastra agent server:
   ```bash
   pnpm run dev:agent
   ```

2. In a separate terminal, start the Next.js dev server:
   ```bash
   pnpm run dev:ui
   ```

3. Open your browser to `http://localhost:3000`

### Using Voice Features

1. **Grant microphone permission** when prompted by your browser
2. **Click the phone icon** in the right panel to start a voice session
3. **Speak naturally** - the AI will listen and respond in real-time
4. **Watch the Orb** - it visualizes your input volume and the AI's output volume
5. **Click the red phone icon** to end the session

## 🔧 Architecture

### Communication Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  VoiceChat UI   │◄───────►│  voice-session   │◄───────►│  Mastra Agent   │
│   (Frontend)    │  WebSocket   (WebSocket API)  │         │  (Backend)      │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                           │                            │
        │                           │                            │
        ▼                           ▼                            ▼
   User Speaks              Audio Processing             OpenAI Realtime
   Microphone              Base64 Encoding                Voice API
   Audio Output            Message Routing              Speech-to-Speech
```

### Data Flow

1. **User speaks** → Microphone captures audio
2. **Audio processing** → Converted to Int16Array, then base64
3. **WebSocket send** → Audio data sent to `/api/voice-session`
4. **Agent processing** → Mastra agent with OpenAI Realtime Voice
5. **Response audio** → Received via WebSocket
6. **Playback** → Decoded and played through speakers
7. **Transcript** → Text updates displayed in UI

## 🎨 UI Components

### VoiceChat Component Features

- **Animated Orb**: Visual representation of audio levels
- **Phone Button**: Start/stop voice session (changes color when active)
- **Status Indicator**: Shows connection state (Connecting, Listening, etc.)
- **Transcript Display**: Shows what you said in real-time
- **Response Display**: Shows AI's text response
- **Error Handling**: Visual feedback for connection errors

### Integration with Main App

The VoiceChat component is integrated into the main page (`src/app/page.tsx`) in the right panel using `react-resizable-panels` for a responsive layout.

## 🔐 Security Considerations

1. **API Keys**: Never commit `.env.local` to version control
2. **WebSocket**: Uses secure WebSocket (WSS) in production
3. **Audio Data**: Transmitted securely over WebSocket
4. **Error Handling**: Proper cleanup on connection failures

## 📝 Environment Variables

See `ENV_SETUP.md` for complete documentation. Key variables:

- `OPENAI_API_KEY` - Required for voice features
- `OPENAI_REALTIME_MODEL` - Voice model selection
- `OPENAI_REALTIME_SPEAKER` - Voice speaker selection
- `NEXT_PUBLIC_MASTRA_API_URL` - Mastra backend URL

## 🐛 Troubleshooting

### Common Issues

**1. Voice connection fails**
- Check that your OPENAI_API_KEY is valid
- Ensure microphone permissions are granted
- Verify Mastra agent server is running

**2. No audio playback**
- Check browser audio permissions
- Ensure audio output device is working
- Check browser console for errors

**3. WebSocket connection errors**
- Verify both dev servers are running
- Check firewall settings
- Ensure ports 3000 and 4111 are available

**4. High latency**
- Check your internet connection
- Consider using a closer OpenAI region
- Monitor browser network tab

## 🎯 Next Steps

Potential enhancements:

1. **Add conversation history** - Show previous exchanges
2. **Multiple voices** - Let users choose different AI voices
3. **Custom instructions** - Allow users to customize agent behavior
4. **Language support** - Add multi-language capabilities
5. **Audio quality controls** - Let users adjust sample rate
6. **Recording export** - Allow users to download conversations
7. **Push-to-talk mode** - Alternative to always-on listening

## 📚 References

- [Mastra Documentation](https://mastra.ai/docs)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Next.js App Router](https://nextjs.org/docs/app)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## ✅ Implementation Checklist

- [x] Mastra agent with OpenAI Realtime Voice configured
- [x] Mastra instance properly registered
- [x] Mastra client wrapper created
- [x] API route for agent interaction
- [x] VoiceChat UI component with full functionality
- [x] WebSocket connection handling
- [x] Audio input/output processing
- [x] Visual feedback and state management
- [x] Error handling and cleanup
- [x] Environment variables documentation
- [x] No linter errors

## 🎉 Conclusion

The Mastra speech-to-speech integration is now fully implemented and ready to use. The application provides a seamless voice interaction experience with real-time bidirectional communication between users and the AI agent.

For questions or issues, refer to the troubleshooting section or check the Mastra documentation.

