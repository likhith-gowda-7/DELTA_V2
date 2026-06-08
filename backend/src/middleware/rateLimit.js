import rateLimit from "express-rate-limit";
import { AppError } from "../lib/AppError.js";

/**
 * Reusable rate limiters. The `express-rate-limit` package is declared in
 * `package.json` but was never wired — these helpers expose it for use in
 * the auth and other sensitive route groups.
 *
 * Defaults are intentionally conservative for development; tune via env
 * (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX) before deploying to production.
 */

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min
const authMax = parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20; // 20 reqs / 15 min
const apiMax = parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 200; // 200 reqs / 15 min

const handler = (req, res) => {
  throw new AppError("Too many requests, please try again later.", 429);
};

/** Strict limiter for login/register/refresh — protect against brute force. */
export const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  message: { success: false, message: "Too many requests, slow down." },
});

/** Looser limiter for general API endpoints. */
export const apiLimiter = rateLimit({
  windowMs,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  message: { success: false, message: "Too many requests, slow down." },
});
