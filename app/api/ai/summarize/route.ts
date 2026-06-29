import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import OpenAI from "openai";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const summarizeSchema = z.object({
  text: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(10000, "Text too long (max 10,000 characters)"),
  maxLength: z
    .number()
    .min(50, "Minimum 50 words")
    .max(500, "Maximum 500 words")
    .optional()
    .default(150),
  style: z
    .enum(["concise", "detailed", "bullet", "key_points", "executive"])
    .optional()
    .default("concise"),
  language: z.string().optional().default("english"),
  tone: z.enum(["neutral", "professional", "casual", "persuasive"]).optional().default("neutral"),
});

const batchSummarizeSchema = z.object({
  texts: z.array(z.string().min(10)).max(10, "Maximum 10 texts per batch"),
  maxLength: z.number().min(50).max(500).optional().default(150),
  style: z
    .enum(["concise", "detailed", "bullet", "key_points", "executive"])
    .optional()
    .default("concise"),
});

// GET /api/ai/summarize - Get usage statistics and supported options
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user's AI usage stats
    const user = await User.findById(session.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = {
      totalSummaries: user?.aiUsage?.summaries || 0,
      todaySummaries:
        user?.aiUsage?.dailySummaries
          ?.filter((d: any) => new Date(d.date).setHours(0, 0, 0, 0) === today.getTime())
          .reduce((acc: number, curr: any) => acc + curr.count, 0) || 0,
      dailyLimit: 50, // Free tier limit
    };

    return NextResponse.json({
      options: {
        styles: ["concise", "detailed", "bullet", "key_points", "executive"],
        tones: ["neutral", "professional", "casual", "persuasive"],
        languages: ["english", "spanish", "french", "german", "chinese", "japanese", "arabic"],
        maxTextLength: 10000,
        maxWordLength: 500,
        minWordLength: 50,
      },
      usage,
      isPro: user?.isPro || false,
    });
  } catch (error) {
    console.error("GET /api/ai/summarize error:", error);
    return NextResponse.json({ message: "Failed to get usage statistics" }, { status: 500 });
  }
}

// POST /api/ai/summarize - Summarize text
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    // Check if it's a batch request
    if (body.texts && Array.isArray(body.texts)) {
      return handleBatchSummarize(body, session.user.id);
    }

    // Single text summarization
    const parsed = summarizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.errors,
          received: body,
        },
        { status: 400 }
      );
    }

    const { text, maxLength, style, language, tone } = parsed.data;

    // Check rate limit
    const user = await User.findById(session.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage =
      user?.aiUsage?.dailySummaries?.find(
        (d: any) => new Date(d.date).setHours(0, 0, 0, 0) === today.getTime()
      )?.count || 0;

    const dailyLimit = user?.isPro ? 200 : 50;

    if (todayUsage >= dailyLimit) {
      return NextResponse.json(
        {
          message: `Daily summarization limit reached (${dailyLimit}). Upgrade to Pro for more.`,
          usage: { today: todayUsage, limit: dailyLimit },
        },
        { status: 429 }
      );
    }

    // Build prompt based on style
    let prompt = "";
    const styleInstructions = {
      concise: "Provide a very concise summary (1-2 sentences) that captures the main idea.",
      detailed: "Provide a detailed summary with all key points and supporting details.",
      bullet: "Provide a bullet-point summary with 3-5 key points.",
      key_points: "Extract and list only the most important key points with brief explanations.",
      executive: "Provide an executive summary with recommendations and key takeaways.",
    };

    const toneInstructions = {
      neutral: "Maintain a neutral, objective tone.",
      professional: "Use professional, formal language.",
      casual: "Use casual, conversational language.",
      persuasive: "Use persuasive language to highlight the importance of the content.",
    };

    prompt = `Please summarize the following text in ${language} (if applicable).

TEXT:
${text}

TASK:
1. ${styleInstructions[style] || styleInstructions.concise}
2. Limit the summary to approximately ${maxLength} words.
3. ${toneInstructions[tone] || toneInstructions.neutral}
4. Ensure the summary is clear, accurate, and captures the essential meaning.
5. Do not add any commentary or opinions beyond the text content.

SUMMARY:`;

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert summarization assistant. You create accurate, clear, and well-structured summaries of provided text. Always maintain the original meaning and tone.${language !== "english" ? ` Generate the summary in ${language}.` : ""}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: Math.min(maxLength * 2, 1000),
      temperature: 0.3,
      presence_penalty: 0.1,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    // Update usage statistics
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { "aiUsage.summaries": 1 },
      $push: {
        "aiUsage.dailySummaries": {
          date: new Date(),
          count: 1,
        },
      },
    });

    // Generate metadata about the summary
    const metadata = {
      originalLength: text.length,
      originalWords: text.split(/\s+/).length,
      summaryLength: summary.length,
      summaryWords: summary.split(/\s+/).length,
      compressionRatio:
        ((summary.split(/\s+/).length / text.split(/\s+/).length) * 100).toFixed(1) + "%",
      style,
      tone,
      language,
    };

    // Log successful summary
    console.log(`AI Summary generated for user ${session.user.id}`, {
      style,
      language,
      originalWords: metadata.originalWords,
      summaryWords: metadata.summaryWords,
    });

    return NextResponse.json({
      success: true,
      summary,
      metadata,
      usage: {
        today: todayUsage + 1,
        limit: dailyLimit,
        total: (user?.aiUsage?.summaries || 0) + 1,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/summarize error:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          message: "OpenAI API error",
          error: error.message,
          type: error.type,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to generate summary",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle batch summarization
async function handleBatchSummarize(body: any, userId: string) {
  const parsed = batchSummarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid batch input", errors: parsed.error.errors },
      { status: 400 }
    );
  }

  const { texts, maxLength, style } = parsed.data;

  // Check rate limit for batch
  const user = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage =
    user?.aiUsage?.dailySummaries?.find(
      (d: any) => new Date(d.date).setHours(0, 0, 0, 0) === today.getTime()
    )?.count || 0;

  const dailyLimit = user?.isPro ? 200 : 50;

  if (todayUsage + texts.length > dailyLimit) {
    return NextResponse.json(
      {
        message: `Batch size exceeds daily limit (${dailyLimit - todayUsage} remaining)`,
        usage: { today: todayUsage, limit: dailyLimit, remaining: dailyLimit - todayUsage },
      },
      { status: 429 }
    );
  }

  // Process texts in parallel with concurrency limit
  const batchSize = 3; // Process 3 at a time to avoid rate limits
  const results = [];
  const errors = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (text: string) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a concise summarization assistant. Provide a clear, brief summary.",
            },
            {
              role: "user",
              content: `Summarize this text in ${maxLength} words: ${text}`,
            },
          ],
          max_tokens: maxLength * 2,
          temperature: 0.3,
        });

        return {
          success: true,
          original: text,
          summary: completion.choices[0]?.message?.content?.trim() || "",
        };
      } catch (error) {
        return {
          success: false,
          original: text,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r) => r.success));
    errors.push(...batchResults.filter((r) => !r.success));
  }

  // Update usage
  await User.findByIdAndUpdate(userId, {
    $inc: { "aiUsage.summaries": results.length },
    $push: {
      "aiUsage.dailySummaries": {
        date: new Date(),
        count: results.length,
      },
    },
  });

  return NextResponse.json({
    success: true,
    results,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      totalProcessed: texts.length,
      successful: results.length,
      failed: errors.length,
    },
  });
}

// OPTIONS /api/ai/summarize - Get available options
export async function OPTIONS() {
  return NextResponse.json({
    styles: [
      { id: "concise", label: "Concise", description: "1-2 sentence summary" },
      { id: "detailed", label: "Detailed", description: "Full summary with details" },
      { id: "bullet", label: "Bullet Points", description: "3-5 bullet points" },
      { id: "key_points", label: "Key Points", description: "Only key points listed" },
      { id: "executive", label: "Executive", description: "Executive summary format" },
    ],
    tones: [
      { id: "neutral", label: "Neutral" },
      { id: "professional", label: "Professional" },
      { id: "casual", label: "Casual" },
      { id: "persuasive", label: "Persuasive" },
    ],
    languages: [
      { id: "english", label: "English" },
      { id: "spanish", label: "Spanish" },
      { id: "french", label: "French" },
      { id: "german", label: "German" },
      { id: "chinese", label: "Chinese" },
      { id: "japanese", label: "Japanese" },
      { id: "arabic", label: "Arabic" },
      { id: "hindi", label: "Hindi" },
      { id: "portuguese", label: "Portuguese" },
      { id: "russian", label: "Russian" },
    ],
    limits: {
      maxTextLength: 10000,
      maxWords: 500,
      minWords: 50,
      dailyLimit: 50,
      proDailyLimit: 200,
    },
  });
}
