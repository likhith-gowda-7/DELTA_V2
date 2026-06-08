import { z } from "zod";

const notificationTypes = [
  "new_message",
  "mention",
  "user_joined",
  "user_left",
  "member_added",
];

// Schema for creating a notification (backend use only)
export const createNotificationSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
  type: z.enum(notificationTypes),
  chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid chat ID"),
  triggerUserId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid trigger user ID"),
  content: z.string().min(1).max(500),
  messageId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid message ID")
    .optional()
    .nullable(),
});

// Schema for pagination query parameters
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a number")
    .transform(Number)
    .refine((n) => n > 0, "Page must be greater than 0")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, "Limit must be between 1 and 100")
    .optional()
    .default("20"),
});

// Schema for unread notifications query
export const unreadQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .refine((n) => n > 0 && n <= 50, "Limit must be between 1 and 50")
    .optional()
    .default("10"),
});

// Schema for notification ID parameter
export const notificationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID"),
});
