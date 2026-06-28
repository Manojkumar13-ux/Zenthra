import OpenAI from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported models
export const OPENAI_MODELS = {
  GPT_4_TURBO: "gpt-4-turbo-preview",
  GPT_4: "gpt-4",
  GPT_3_5_TURBO: "gpt-3.5-turbo",
  TEXT_EMBEDDING_3_SMALL: "text-embedding-3-small",
  TEXT_EMBEDDING_3_LARGE: "text-embedding-3-large",
};

// Generate text completion
export async function generateText(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  } = {}
) {
  const {
    model = OPENAI_MODELS.GPT_4_TURBO,
    maxTokens = 500,
    temperature = 0.7,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0,
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    });

    return {
      text: completion.choices[0]?.message?.content?.trim() || "",
      usage: completion.usage,
      model: completion.model,
    };
  } catch (error) {
    console.error("OpenAI text generation error:", error);
    throw new Error("Failed to generate text");
  }
}

// Generate embeddings
export async function generateEmbeddings(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_MODELS.TEXT_EMBEDDING_3_SMALL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("OpenAI embeddings error:", error);
    throw new Error("Failed to generate embeddings");
  }
}

// Moderate content
export async function moderateContent(text: string) {
  try {
    const response = await openai.moderations.create({
      input: text,
    });
    return response.results[0];
  } catch (error) {
    console.error("OpenAI moderation error:", error);
    throw new Error("Failed to moderate content");
  }
}

// Generate streaming response
export async function generateStream(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
  } = {}
) {
  const { model = OPENAI_MODELS.GPT_4_TURBO, temperature = 0.7 } = options;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error("OpenAI stream error:", error);
    throw new Error("Failed to generate stream");
  }
}

// Chat completion with history
export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
) {
  const {
    model = OPENAI_MODELS.GPT_4_TURBO,
    maxTokens = 1000,
    temperature = 0.7,
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return {
      text: completion.choices[0]?.message?.content?.trim() || "",
      usage: completion.usage,
      model: completion.model,
    };
  } catch (error) {
    console.error("OpenAI chat error:", error);
    throw new Error("Failed to process chat");
  }
}

export default openai;