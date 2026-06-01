import { z } from "zod";

export const createChatSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});

export const createGroupChatSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name cannot exceed 50 characters"),
  userIds: z
    .array(z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"))
    .min(2, "Group must have at least 2 members"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const renameChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(50, "Chat name cannot exceed 50 characters"),
});

export const addMemberSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});

export const removeMemberSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});

export const promoteAdminSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
});

export const deleteChatSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid chat ID"),
});
