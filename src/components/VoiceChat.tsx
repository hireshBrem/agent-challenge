"use client"

import { useState, useRef } from "react"
import { Orb } from "@/components/ui/orb"

// import { speechToSpeechServerExample } from "@/mastra/base";

export function VoiceChat() {
  const [inputVolume] = useState(0)
  const [outputVolume] = useState(0)
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setTranscript("");
    setResponse("");
    if (!navigator.mediaDevices) {
      alert("No microphone available");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      audioChunksRef.current = [];

      // Here you would send the audioBlob to your backend or directly to Mastra via client
      // For demo, convert to base64 or send as FormData in real implementation

      setIsLoading(true);
      // Example: Send audioBlob or request to backend and retrieve response

      console.log("Sending audioBlob to Mastra agent");
      console.log(audioBlob);
      // Simulated fetch with dummy message to Mastra agent
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello, speech to speech test.", audio: audioBlob }] }),
      });
      const json = await res.json();
      setResponse(json.text || "No response");
      setIsLoading(false);
    };

    mediaRecorder.start();
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  
  return (
    <div className="flex flex-col items-center flex-1 justify-center w-full">
        {/* <button className="bg-blue-500 text-white p-2 rounded-md" onClick={speechToSpeechServerExample}>Start Speech to Speech</button> */}
      {/* Orb Graphic */}
      <div className="relative size-32 mb-6">
        <div className="bg-muted relative h-full w-full rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
            <Orb
              className="h-full w-full"
              volumeMode="manual"
              getInputVolume={() => inputVolume}
              getOutputVolume={() => outputVolume}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      {/* <div className="flex flex-col items-center gap-2 mb-6">
        <h2 className="text-xl font-bold">{DEFAULT_AGENT.name}</h2>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-400 text-sm text-center"
        >
          {isConnecting 
            ? "Connecting..." 
            : isActive 
              ? "Listening... Speak now!" 
              : DEFAULT_AGENT.description}
        </motion.p>
      </div> */}

      {/* Transcript and Response Display */}
      {(transcript || response) && (
        <div className="w-full max-w-md mb-4 space-y-2">
          {transcript && (
            <div className="bg-gray-900 rounded p-3">
              <p className="text-xs text-gray-400 mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="bg-blue-900/30 rounded p-3">
              <p className="text-xs text-gray-400 mb-1">AI Response:</p>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </div>
      )}

      {/* Voice Input Button */}
      {/* <Button
        size="icon"
        variant="default"
        onClick={isActive ? stopVoiceSession : startVoiceSession}
        disabled={isConnecting}
        className={`h-15 w-15 cursor-pointer rounded-full border-2 transition-all ${
          isActive 
            ? 'border-red-500 bg-red-600 hover:bg-red-700' 
            : 'border-white hover:bg-gray-900'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isActive ? (
            <PhoneOff className="h-8 w-8" />
          ) : (
            <PhoneIcon className="h-8 w-8" />
          )}
        </motion.div>
      </Button>
       */}

      <div>
      <h1>Mastra Speech-to-Speech Next.js Demo</h1>
      <button onClick={startRecording} disabled={isLoading}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={isLoading}>
        Stop Recording
      </button>
      <div>
        <h2>Transcript:</h2>
        <p>{transcript}</p>
      </div>
      <div>
        <h2>Agent Response:</h2>
        {isLoading ? <p>Loading...</p> : <p>{response}</p>}
      </div>
      </div>
    </div>
  )
}

