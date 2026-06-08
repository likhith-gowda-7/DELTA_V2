import { z } from "zod";

// Allowed file types for validation
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z
    .object({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.enum(ALLOWED_FILE_TYPES),
      size: z.number().max(10485760, "File size must not exceed 10MB"),
      buffer: z.instanceof(Buffer),
    })
    .strict(),
});
