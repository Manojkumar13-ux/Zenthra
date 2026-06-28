import { z } from "zod";

export const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Content is too long"),
  media: z.array(z.string().url()).optional(),
  communityId: z.string().optional(),
  scheduledAt: z.string().optional(),
  audience: z.enum(["everyone", "followers", "mentioned"]).default("everyone"),
  mood: z.enum(["neutral", "happy", "excited", "sad", "angry", "thoughtful", "funny", "inspirational"]).optional(),
  location: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
});

export type PostInput = z.infer<typeof postSchema>;