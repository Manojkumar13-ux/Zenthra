// app/api/ai/generate-post/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, tone, length } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const lengthMap: Record<string, number> = {
      short: 50,
      medium: 150,
      long: 300,
    };

    const maxTokens = lengthMap[length] || 100;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a social media content creator. Generate a post based on the given prompt. Tone: ${tone || "neutral"}.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      content: generatedContent,
    });
  } catch (error) {
    console.error("AI Generate Post Error:", error);
    return NextResponse.json({ error: "Failed to generate post" }, { status: 500 });
  }
}
