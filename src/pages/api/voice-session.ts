import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HttpServer } from "http";
import type { Socket } from "net";
import type { Server as WebSocketServerType, WebSocket as WebSocketType } from "ws";
import { createRealtimeVoiceAgent } from "@/mastra/agents";

// Lazy load ws only on server-side
let wsModule: { Server: typeof WebSocketServerType; WebSocket: typeof WebSocketType } | null = null;

const getWS = () => {
  if (typeof window !== "undefined") {
    throw new Error("ws can only be used server-side");
  }
  if (!wsModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    wsModule = require("ws");
  }
  return wsModule;
};

type ExtendedHttpServer = HttpServer & {
  voiceWss?: WebSocketServerType;
  voiceUpgradeAttached?: boolean;
};

type ExtendedSocket = Socket & {
  server: ExtendedHttpServer;
};

type OutgoingMessage =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "text"; role: string; text: string }
  | { type: "audio"; data: string }
  | { type: "audio-end" }
  | { type: "closed" };

type IncomingMessage =
  | { type: "start" }
  | { type: "stop" }
  | { type: "audio"; data: string }
  | { type: "answer" }
  | { type: "text"; content: string };

const toBase64 = (input: ArrayBufferView | Buffer) => {
  const buffer = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  return buffer.toString("base64");
};

const streamAudioToSocket = (socket: WebSocketType, stream: NodeJS.ReadableStream, WebSocketClass: typeof WebSocketType) => {
  stream.on("data", (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    if (socket.readyState === WebSocketClass.OPEN) {
      socket.send(JSON.stringify({ type: "audio", data: buffer.toString("base64") } satisfies OutgoingMessage));
    }
  });

  stream.on("end", () => {
    if (socket.readyState === WebSocketClass.OPEN) {
      socket.send(JSON.stringify({ type: "audio-end" } satisfies OutgoingMessage));
    }
  });

  stream.on("error", (error) => {
    if (socket.readyState === WebSocketClass.OPEN) {
      socket.send(
        JSON.stringify({ type: "error", message: `Audio stream error: ${String(error)}` } satisfies OutgoingMessage),
      );
    }
  });
};

const sendJSON = (socket: WebSocketType, payload: OutgoingMessage, WebSocketClass: typeof WebSocketType) => {
  if (socket.readyState === WebSocketClass.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const attachConnectionHandlers = (socket: WebSocketType) => {
  const { WebSocket: WebSocketClass } = getWS();
  const agent = createRealtimeVoiceAgent();
  const voice = agent.voice;

  let connected = false;
  let closing = false;

  const speakerStreamHandler = (stream: NodeJS.ReadableStream) => {
    streamAudioToSocket(socket, stream, WebSocketClass);
  };

  const speakingHandler = (payload: { audio?: string | Int16Array }) => {
    const { audio } = payload;
    if (!audio) return;

    if (typeof audio === "string") {
      sendJSON(socket, { type: "audio", data: audio }, WebSocketClass);
      sendJSON(socket, { type: "audio-end" }, WebSocketClass);
      return;
    }

    sendJSON(socket, { type: "audio", data: toBase64(audio) }, WebSocketClass);
    sendJSON(socket, { type: "audio-end" }, WebSocketClass);
  };

  const writingHandler = (payload: { text: string; role: string }) => {
    sendJSON(socket, { type: "text", role: payload.role, text: payload.text }, WebSocketClass);
  };

  const voiceErrorHandler = (payload: { message: string; code?: string; details?: unknown }) => {
    sendJSON(socket, { type: "error", message: payload.message }, WebSocketClass);
  };

  const attachVoiceListeners = () => {
    voice.on?.("speaker", speakerStreamHandler);
    voice.on?.("speaking", speakingHandler);
    voice.on?.("writing", writingHandler);
    voice.on?.("error", voiceErrorHandler);
  };

  const detachVoiceListeners = () => {
    voice.off?.("speaker", speakerStreamHandler);
    voice.off?.("speaking", speakingHandler);
    voice.off?.("writing", writingHandler);
    voice.off?.("error", voiceErrorHandler);
  };

  const ensureVoiceConnected = async () => {
    if (connected) return;
    await voice.connect();
    attachVoiceListeners();
    connected = true;
    sendJSON(socket, { type: "ready" }, WebSocketClass);
  };

  const cleanup = () => {
    if (closing) return;
    closing = true;

    try {
      detachVoiceListeners();
    } catch (error) {
      console.error("Failed to detach voice listeners", error);
    }

    try {
      voice.close?.();
    } catch (error) {
      console.error("Failed to close voice", error);
    }

    if (socket.readyState === WebSocketClass.OPEN || socket.readyState === WebSocketClass.CONNECTING) {
      try {
        sendJSON(socket, { type: "closed" }, WebSocketClass);
        socket.close();
      } catch (error) {
        console.error("Failed to close websocket", error);
      }
    }
  };

  socket.on("message", async (raw) => {
    try {
      const parsed = JSON.parse(typeof raw === "string" ? raw : raw.toString()) as IncomingMessage;

      switch (parsed.type) {
        case "start": {
          await ensureVoiceConnected();
          break;
        }
        case "audio": {
          await ensureVoiceConnected();
          const buffer = Buffer.from(parsed.data, "base64");
          await voice.send(new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 2));
          break;
        }
        case "answer": {
          await voice.answer?.();
          break;
        }
        case "text": {
          await voice.speak?.(parsed.content);
          break;
        }
        case "stop": {
          cleanup();
          break;
        }
        default: {
          sendJSON(socket, { type: "error", message: "Unknown message type" }, WebSocketClass);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJSON(socket, { type: "error", message }, WebSocketClass);
    }
  });

  socket.on("close", cleanup);
  socket.on("error", cleanup);
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { Server: WebSocketServer } = getWS();
  
  // Ensure we have access to the HTTP server
  if (!res.socket?.server) {
    console.error("No server available for WebSocket upgrade");
    return res.status(500).json({ error: "Server not available" });
  }

  const server = res.socket.server as ExtendedHttpServer;

  // Initialize WebSocket server if not already done
  if (!server.voiceWss) {
    const wss = new WebSocketServer({ noServer: true });
    server.voiceWss = wss;

    // Set up connection handler
    wss.on("connection", (socket) => {
      console.log("WebSocket connection established");
      attachConnectionHandlers(socket);
    });

    wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  // Attach upgrade handler if not already attached
  if (!server.voiceUpgradeAttached) {
    server.on("upgrade", (request, socket: ExtendedSocket, head) => {
      // Simple path matching - check if URL contains /api/voice-session
      const requestUrl = request.url || "";
      if (!requestUrl.includes("/api/voice-session")) {
        return;
      }

      console.log("WebSocket upgrade request received for:", requestUrl);

      if (!server.voiceWss) {
        console.error("WebSocket server not initialized");
        socket.destroy();
        return;
      }

      try {
        server.voiceWss.handleUpgrade(request, socket, head, (ws) => {
          server.voiceWss!.emit("connection", ws, request);
        });
      } catch (error) {
        console.error("Error handling WebSocket upgrade:", error);
        socket.destroy();
      }
    });

    server.voiceUpgradeAttached = true;
    console.log("WebSocket upgrade handler attached");
  }

  // For regular HTTP requests, return success
  res.status(200).json({ status: "ok", websocketReady: true });
}

