import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";

export async function POST(req: NextRequest) {
  try {
    const { messages, audio } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const agent = mastra.getAgent("realtimeVoiceAgent");
    // console.log("agent: ", agent);
    
    // Connect to the voice service
    await agent.voice.connect();

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // const response = await agent.generateVNext(messages);
    // const response = await agent.voice.listen(audio);
    const response = await agent.voice.send(audio);
    console.log("response from agent: ", response);

    // Initiate the conversation
    // await agent.voice.speak("How can I help you today?");

    // Listen for agent audio responses
    agent.voice.on("speaker", (data: NodeJS.ReadableStream) => {
        console.log("audio from agent: ", data);
      playAudio(data);
    });
    
    // Listen for agent audio responses
    // agent.voice.on("speaker", ({ audio }:any) => {
    //     playAudio(audio);
    // });
    
    // console.log("Agent response:", response);
    // return NextResponse.json(response);
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

