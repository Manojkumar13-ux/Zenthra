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

    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { text: "", message: "Content is required" },
        { status: 400 }
      );
    }

    // If no API key, return original content
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        text: content,
        message: "OpenAI API key not configured" 
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that rewrites text to be more engaging and clear. Keep the same meaning but improve the wording. Keep it under 280 characters." 
          },
          { 
            role: "user", 
            content: `Rewrite this text: "${content}"` 
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const rewritten = response.choices[0]?.message?.content?.trim() || content;
      return NextResponse.json({ text: rewritten });
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);
      return NextResponse.json({ 
        text: content,
        message: "AI service unavailable" 
      });
    }
  } catch (error) {
    console.error("POST /api/ai/rewrite error:", error);
    return NextResponse.json(
      { text: "", message: "Failed to rewrite content" },
      { status: 500 }
    );
  }
}