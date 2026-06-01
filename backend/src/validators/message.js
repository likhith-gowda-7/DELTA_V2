import { z } from "zod";

export const sendMessageSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid chat ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
  fileUrl: z.string().url("Invalid file URL").optional().or(z.literal(null)),
  fileType: z.enum(["image", "audio", "document"]).optional().or(z.literal(null)),
});

export const editMessageSchema = z.object({
  messageId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid message ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

export const markAsReadSchema = z.object({
  messageId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid message ID"),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid message ID"),
});

export const searchMessagesSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid chat ID"),
  keyword: z
    .string()
    .min(1, "Search keyword is required")
    .max(100, "Search keyword cannot exceed 100 characters"),
});

export const getMessagesSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid chat ID"),
  skip: z.coerce.number().int().min(0).default(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
