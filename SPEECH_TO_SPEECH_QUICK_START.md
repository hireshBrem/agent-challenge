# 🎤 Speech-to-Speech Quick Start Guide

## Get Started in 3 Steps

### Step 1: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required: Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Optional: Customize voice settings
OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview-2024-12-17
OPENAI_REALTIME_SPEAKER=alloy

# Optional: Mastra backend URL (defaults to localhost:4111)
NEXT_PUBLIC_MASTRA_API_URL=http://localhost:4111
```

### Step 2: Start the Servers

Open two terminal windows:

**Terminal 1 - Mastra Agent Server:**
```bash
pnpm run dev:agent
```
Wait for: `✓ Mastra server started on http://localhost:4111`

**Terminal 2 - Next.js UI Server:**
```bash
pnpm run dev:ui
```
Wait for: `✓ Ready on http://localhost:3000`

### Step 3: Use Voice Chat

1. Open `http://localhost:3000` in your browser
2. Grant microphone permission when prompted
3. Look for the **VoiceCode AI** panel on the right side
4. Click the **phone icon** 📞 to start
5. **Speak naturally** - the AI will respond in real-time!
6. Click the **red phone icon** 📴 to stop

## 🎯 What You Can Do

- **Ask questions**: "What's the weather like?"
- **Get help**: "Can you explain how this works?"
- **Have conversations**: Natural back-and-forth dialogue
- **Code assistance**: "How do I create a React component?"

## 🔧 Available Voice Speakers

Change `OPENAI_REALTIME_SPEAKER` in `.env.local` to:
- `alloy` (default - neutral, balanced)
- `echo` (warm, upbeat)
- `shimmer` (soft, raspy)
- `ash` (calm, professional)
- `ballad` (expressive, enthusiastic)
- `coral` (warm, friendly)
- `sage` (gentle, calm)
- `verse` (pleasant, articulate)

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't hear AI | Check browser audio permissions and volume |
| AI can't hear me | Grant microphone permission in browser |
| Connection fails | Verify OPENAI_API_KEY is correct |
| Both servers must be running | Check that ports 3000 and 4111 are available |
| WebSocket errors | Restart both servers |

## 💡 Tips

- **Use headphones** to prevent audio feedback
- **Speak clearly** at a normal pace
- **Wait for response** before speaking again
- **Check the Orb** - it shows if audio is being captured/played

## 🎨 Visual Indicators

- **Gray phone icon** - Ready to start
- **Red phone icon** - Session active (click to stop)
- **"Connecting..."** - Establishing connection
- **"Listening..."** - AI is ready for your voice
- **Orb animation** - Shows input/output audio levels
- **Transcript box** - Shows what you said
- **Response box** - Shows AI's text response

## 📊 Testing Your Setup

Quick test commands to verify everything works:

```bash
# Check if agent server is running
curl http://localhost:4111/health

# Check if UI server is running
curl http://localhost:3000

# Check environment variables are loaded
pnpm run dev:agent # Look for "OpenAI Realtime Voice" in logs
```

## 🚀 You're Ready!

The speech-to-speech system is now operational. Enjoy your voice-powered AI assistant!

---

**Need more details?** See `IMPLEMENTATION_SUMMARY.md` for technical details.

**Environment setup?** See `ENV_SETUP.md` for all configuration options.

