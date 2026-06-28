import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { prompt, tone } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        text: `AI is not configured. Here's a sample post: ${prompt}`,
        message: "OpenAI API key not configured." 
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: `You are a social media content creator. Generate a short, engaging post (under 280 characters) about the given topic. Tone: ${tone || "neutral"}` 
          },
          { 
            role: "user", 
            content: `Write a social media post about: "${prompt}"` 
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content?.trim() || `Check out this post about ${prompt}!`;
      return NextResponse.json({ text });
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);
      return NextResponse.json({ 
        text: `AI service unavailable. Here's a sample post: ${prompt}`,
        message: "AI service temporarily unavailable." 
      });
    }
  } catch (error) {
    console.error("POST /api/ai/generate-post error:", error);
    return NextResponse.json(
      { message: "Failed to generate post", text: `Check out this post!` },
      { status: 500 }
    );
  }
}