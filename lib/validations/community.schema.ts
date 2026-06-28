import { z } from "zod";

export const communitySchema = z.object({
  name: z.string().min(3, "Name too short").max(50),
  description: z.string().max(200).optional(),
});