import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HttpServer } from "http";
import type { Socket } from "net";
import { Server as WebSocketServer, WebSocket } from "ws";
import { createRealtimeVoiceAgent } from "@/mastra/agents";

type ExtendedHttpServer = HttpServer & {
  voiceWss?: WebSocketServer;
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

const streamAudioToSocket = (socket: WebSocket, stream: NodeJS.ReadableStream) => {
  stream.on("data", (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "audio", data: buffer.toString("base64") } satisfies OutgoingMessage));
    }
  });

  stream.on("end", () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "audio-end" } satisfies OutgoingMessage));
    }
  });

  stream.on("error", (error) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "error", message: `Audio stream error: ${String(error)}` } satisfies OutgoingMessage),
      );
    }
  });
};

const sendJSON = (socket: WebSocket, payload: OutgoingMessage) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const attachConnectionHandlers = (socket: WebSocket) => {
  const agent = createRealtimeVoiceAgent();
  const voice = agent.voice;

  let connected = false;
  let closing = false;

  const speakerStreamHandler = (stream: NodeJS.ReadableStream) => {
    streamAudioToSocket(socket, stream);
  };

  const speakingHandler = (payload: { audio?: string | Int16Array }) => {
    const { audio } = payload;
    if (!audio) return;

    if (typeof audio === "string") {
      sendJSON(socket, { type: "audio", data: audio });
      sendJSON(socket, { type: "audio-end" });
      return;
    }

    sendJSON(socket, { type: "audio", data: toBase64(audio) });
    sendJSON(socket, { type: "audio-end" });
  };

  const writingHandler = (payload: { text: string; role: string }) => {
    sendJSON(socket, { type: "text", role: payload.role, text: payload.text });
  };

  const voiceErrorHandler = (payload: { message: string; code?: string; details?: unknown }) => {
    sendJSON(socket, { type: "error", message: payload.message });
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
    sendJSON(socket, { type: "ready" });
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

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      try {
        sendJSON(socket, { type: "closed" });
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
          sendJSON(socket, { type: "error", message: "Unknown message type" });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJSON(socket, { type: "error", message });
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
  const server = res.socket.server as ExtendedHttpServer;

  if (!server.voiceWss) {
    const wss = new WebSocketServer({ noServer: true });
    server.voiceWss = wss;

    if (!server.voiceUpgradeAttached) {
      server.on("upgrade", (request, socket: ExtendedSocket, head) => {
        if (request.url !== "/api/voice-session") {
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      });

      server.voiceUpgradeAttached = true;
    }

    wss.on("connection", (socket) => {
      attachConnectionHandlers(socket);
    });
  }

  res.status(200).end();
}

