import { z } from "zod";

export const userSearchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export const userIdSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});

export const blockUserSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});
