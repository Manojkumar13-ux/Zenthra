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
      return NextResponse.json({ hashtags: [] });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        hashtags: ["#social", "#community", "#zenthra"],
        message: "OpenAI API key not configured. Using default hashtags." 
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a hashtag generator. Generate 3-5 relevant hashtags for the given content. Return only the hashtags separated by spaces, without any additional text." 
          },
          { 
            role: "user", 
            content: `Generate hashtags for: "${content}"` 
          }
        ],
        max_tokens: 50,
        temperature: 0.8,
      });

      const hashtagsText = response.choices[0]?.message?.content?.trim() || "";
      const hashtags = hashtagsText.split(/\s+/).filter(tag => tag.startsWith("#"));
      
      return NextResponse.json({ hashtags: hashtags.length > 0 ? hashtags : ["#social", "#community", "#zenthra"] });
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);
      return NextResponse.json({ hashtags: ["#social", "#community", "#zenthra"] });
    }
  } catch (error) {
    console.error("POST /api/ai/hashtags error:", error);
    return NextResponse.json(
      { message: "Failed to generate hashtags", hashtags: ["#social", "#community", "#zenthra"] },
      { status: 500 }
    );
  }
}