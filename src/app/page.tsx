'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginButton } from '@/components/LoginButton';
import { useCallback, useRef } from 'react';

const PCM_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 2048;

type RealtimeMessage = {
  id: string;
  role: string;
  text: string;
};

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

const floatTo16BitPCM = (input: Float32Array) => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < input.length; i += 1) {
    const sample = clamp(input[i]);
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Uint8Array(buffer);
};

const base64FromUint8Array = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const uint8ArrayFromBase64 = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Voice UI state
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const outboundContextRef = useRef<AudioContext | null>(null);
  const outboundProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outboundSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inboundContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const streamingAudioRef = useRef(false);

  const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>([]);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [isAnswerPending, setIsAnswerPending] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/audio', {
            method: 'POST',
            body: formData,
          });
          const { text } = await response.json();
          setTranscriptions(prev => [...prev, text]);
        } catch (error) {
          console.error('Error sending audio:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const handleSummarize = useCallback(async () => {
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Please summarize these transcriptions:\n${transcriptions.join('\n')}`,
            },
          ],
        }),
      });

      const responseText = await response.text();

      try {
        const parsedResponse = JSON.parse(responseText);
        setSummary(parsedResponse.summary);
      } catch {
        setSummary(responseText);
      }
    } catch (fetchError) {
      console.error('Failed to summarize:', fetchError);
    }
  }, [transcriptions]);

  const cleanupRealtimeSession = useCallback(() => {
    streamingAudioRef.current = false;

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    }
    wsRef.current = null;

    outboundProcessorRef.current?.disconnect();
    outboundProcessorRef.current = null;

    outboundSourceRef.current?.disconnect();
    outboundSourceRef.current = null;

    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;

    if (outboundContextRef.current) {
      outboundContextRef.current.close();
      outboundContextRef.current = null;
    }

    if (inboundContextRef.current) {
      inboundContextRef.current.close();
      inboundContextRef.current = null;
    }

    playbackTimeRef.current = 0;
    setRealtimeStatus('idle');
    setRealtimeReady(false);
    setIsAnswerPending(false);
  }, []);

  const playAudioChunk = useCallback(async (base64: string) => {
    const bytes = uint8ArrayFromBase64(base64);
    if (!bytes.byteLength) return;

    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const float32 = new Float32Array(int16.length);

    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = int16[i] / 0x8000;
    }

    let context = inboundContextRef.current;
    if (!context) {
      context = new AudioContext({ sampleRate: PCM_SAMPLE_RATE });
      inboundContextRef.current = context;
      await context.resume();
      playbackTimeRef.current = context.currentTime;
    }

    const buffer = context.createBuffer(1, float32.length, PCM_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startTime = Math.max(context.currentTime, playbackTimeRef.current);
    source.start(startTime);
    playbackTimeRef.current = startTime + buffer.duration;
  }, []);

  const startRealtimeSession = useCallback(async () => {
    if (realtimeStatus !== 'idle') return;

    setRealtimeError(null);
    setRealtimeReady(false);
    setRealtimeMessages([]);
    setRealtimeStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${window.location.host}/api/voice-session`);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'start' }));
        streamingAudioRef.current = true;
        setRealtimeStatus('active');
      };

      socket.onmessage = async event => {
        try {
          const payload = JSON.parse(event.data.toString());

          switch (payload.type) {
            case 'ready':
              setRealtimeReady(true);
              break;
            case 'text':
              setRealtimeMessages(prev => [
                ...prev,
                { id: createMessageId(), role: payload.role, text: payload.text },
              ]);
              if (payload.role === 'assistant') {
                setIsAnswerPending(false);
              }
              break;
            case 'audio':
              await playAudioChunk(payload.data);
              break;
            case 'audio-end':
              break;
            case 'error':
              setRealtimeError(payload.message);
              break;
            case 'closed':
              cleanupRealtimeSession();
              break;
            default:
              console.warn('Unknown message from voice session', payload);
          }
        } catch (error) {
          console.error('Failed to parse websocket message', error);
        }
      };

      socket.onerror = () => {
        setRealtimeError('Realtime session error');
      };

      socket.onclose = () => {
        cleanupRealtimeSession();
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: PCM_SAMPLE_RATE },
      });
      micStreamRef.current = stream;

      let context = outboundContextRef.current;
      if (!context) {
        context = new AudioContext({ sampleRate: PCM_SAMPLE_RATE });
        outboundContextRef.current = context;
        await context.resume();
      }

      const source = context.createMediaStreamSource(stream);
      outboundSourceRef.current = source;

      const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
      outboundProcessorRef.current = processor;

      processor.onaudioprocess = event => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }
        if (!streamingAudioRef.current) {
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const bytes = floatTo16BitPCM(input);
        const base64 = base64FromUint8Array(bytes);
        wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
      };

      source.connect(processor);
      processor.connect(context.destination);
    } catch (error) {
      console.error('Failed to start realtime session', error);
      cleanupRealtimeSession();
      setRealtimeError(error instanceof Error ? error.message : String(error));
    }
  }, [cleanupRealtimeSession, playAudioChunk, realtimeStatus]);

  const stopRealtimeSession = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    cleanupRealtimeSession();
  }, [cleanupRealtimeSession]);

  const requestRealtimeAnswer = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    setIsAnswerPending(true);
    wsRef.current.send(JSON.stringify({ type: 'answer' }));
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }

      stopRealtimeSession();
    };
  }, [stopRealtimeSession]);

  return (
    <div className="flex flex-col w-full max-w-4xl py-16 mx-auto gap-8">
      {/* GitHub Auth Feature - New */}
      {!authLoading && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">🚀 New Feature: GitHub Repo Browser</h2>
              <p className="text-sm text-gray-600">
                Search and explore your GitHub repositories with an intuitive interface
              </p>
            </div>
            {isAuthenticated ? (
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Open Dashboard →
              </a>
            ) : (
              <LoginButton />
            )}
          </div>
        </section>
      )}

      {/* Existing Voice Agent UI */}
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold">Notes</h2>
          <p className="text-sm text-gray-500">Record audio clips and build a summary.</p>
        </header>

        {transcriptions.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            No transcriptions yet. Record audio to capture notes.
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((text, index) => (
              <div key={index} className="rounded bg-gray-100 p-4 text-sm dark:bg-zinc-800">
                {text}
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div className="rounded bg-blue-100 p-4 text-sm dark:bg-blue-900">
            <h3 className="mb-2 text-base font-semibold">Summary</h3>
            <p>{summary}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 rounded px-4 py-2 text-white ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={transcriptions.length === 0}
            className="flex-1 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-400"
          >
            Summarize
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold">Realtime Conversation</h2>
          <p className="text-sm text-gray-500">
            Stream live audio to the OpenAI realtime agent and receive spoken + textual responses.
          </p>
        </header>

        <div className="rounded border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Status:</span>
            <span>
              {realtimeStatus === 'idle' && 'Idle'}
              {realtimeStatus === 'connecting' && 'Connecting…'}
              {realtimeStatus === 'active' && (realtimeReady ? 'Ready' : 'Starting…')}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            {realtimeMessages.length === 0 && (
              <div className="text-gray-500">No conversation yet. Start a session to begin speaking.</div>
            )}

            {realtimeMessages.map(message => (
              <div
                key={message.id}
                className={`rounded p-3 ${
                  message.role === 'assistant'
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-50'
                }`}
              >
                <span className="block text-xs uppercase tracking-wide text-gray-500">
                  {message.role}
                </span>
                <span>{message.text}</span>
              </div>
            ))}
          </div>

          {realtimeError && (
            <div className="mt-3 rounded bg-red-100 p-3 text-sm text-red-700">
              {realtimeError}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={realtimeStatus === 'active' ? stopRealtimeSession : startRealtimeSession}
            className={`flex-1 rounded px-4 py-2 text-white ${
              realtimeStatus === 'active'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {realtimeStatus === 'active' ? 'End Session' : 'Start Session'}
          </button>
          <button
            type="button"
            disabled={realtimeStatus !== 'active' || !realtimeReady || isAnswerPending}
            onClick={requestRealtimeAnswer}
            className="flex-1 rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-700 disabled:bg-gray-400"
          >
            {isAnswerPending ? 'Waiting…' : 'Ask For Response'}
          </button>
        </div>
      </section>
    </div>
  );
}