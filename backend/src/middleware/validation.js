import { AppError } from "../lib/AppError.js";

// Middleware to validate request body/params/query using Zod schema
export const validate =
  (schema, target = "body") =>
  (req, res, next) => {
    try {
      let data;

      if (target === "body") {
        data = req.body;
      } else if (target === "params") {
        data = req.params;
      } else if (target === "query") {
        data = req.query;
      }

      const parsed = schema.parse(data);

      // Replace request data with validated data
      if (target === "body") {
        req.body = parsed;
      } else if (target === "params") {
        req.params = parsed;
      } else if (target === "query") {
        req.query = parsed;
      }

      next();
    } catch (error) {
      if (error.errors) {
        const message = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new AppError(message, 400);
      }
      throw new AppError("Validation error", 400);
    }
  };

/**
 * Alias for `validate` to match legacy route imports.
 * Allows routes that import `validateRequest` (e.g. calls.js, chats.js,
 * messages.js) to keep working with the canonical `validate` middleware.
 */
export const validateRequest = validate;
