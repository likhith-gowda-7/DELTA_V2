import z from "zod";
import mongoose from "mongoose";

/**
 * Validate MongoDB ObjectId
 */
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID format",
  });

/**
 * Schema for initiating a call
 */
export const initiateCallSchema = z.object({
  recipientId: objectIdSchema,
  mediaType: z.enum(["audio", "video", "audio-video"]).default("audio-video"),
  chatId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val))
    .optional(),
});

/**
 * Schema for accepting a call
 */
export const acceptCallSchema = z.object({
  // No body required - just path param
});

/**
 * Schema for rejecting a call
 */
export const rejectCallSchema = z.object({
  reason: z.enum(["busy", "declined", "no_answer", "network_error"]).optional(),
});

/**
 * Schema for ending a call
 */
export const endCallSchema = z.object({
  duration: z.number().int().positive().optional(),
});

/**
 * Schema for call ID parameter
 */
export const callIdSchema = z.object({
  id: objectIdSchema,
});

/**
 * Schema for pagination
 */
export const callHistorySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .default("20"),
});

/**
 * Schema for updating call metadata
 */
export const updateCallMetadataSchema = z.object({
  audioEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  connectionQuality: z.enum(["good", "fair", "poor"]).optional(),
  iceCandidatesExchanged: z.boolean().optional(),
});
