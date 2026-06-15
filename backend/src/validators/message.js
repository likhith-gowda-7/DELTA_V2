import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/, "Invalid ID");

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const sendMessageSchema = z.object({
  chatId: objectIdSchema,
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
  fileUrl: z.string().url("Invalid file URL").optional().or(z.literal(null)),
  fileType: z.enum(allowedFileTypes).optional().or(z.literal(null)),
  fileName: z.string().min(1).max(255).optional().or(z.literal(null)),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024).optional().or(z.literal(null)),
});

export const editMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

export const chatIdParamSchema = z.object({
  chatId: objectIdSchema,
});

export const messageIdParamSchema = z.object({
  messageId: objectIdSchema,
});

export const markAsReadSchema = z.object({
  messageId: objectIdSchema,
});

export const deleteMessageSchema = z.object({
  messageId: objectIdSchema,
});

export const searchMessagesSchema = z.object({
  keyword: z
    .string()
    .min(1, "Search keyword is required")
    .max(100, "Search keyword cannot exceed 100 characters"),
});

export const getMessagesSchema = z.object({
  skip: z.coerce.number().int().min(0).default(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
