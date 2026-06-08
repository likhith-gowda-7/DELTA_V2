// Centralized environment-variable loading and validation.
// Keeps the list of required vars in one place and produces helpful error
// messages at startup.

import dotenv from "dotenv";

dotenv.config();

const REQUIRED_VARS = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const isProduction = process.env.NODE_ENV === "production";

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    const err = new Error(message);
    err.code = "ENV_VALIDATION_FAILED";
    throw err;
  }

  // Warn in production if obviously-dev defaults are still set.
  if (isProduction) {
    const devDefaults = [
      "your_access_token_secret",
      "your_refresh_token_secret",
      "your_cloudinary",
      "your_email",
    ];
    for (const key of Object.keys(process.env)) {
      const value = String(process.env[key] || "");
      if (devDefaults.some((d) => value.includes(d))) {
        // eslint-disable-next-line no-console
        console.warn(
          `[env] WARNING: ${key} appears to contain a placeholder value in production.`,
        );
      }
    }
  }
};

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || "15m",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  IS_PRODUCTION: isProduction,
};

export { config, validateEnv };
export default config;
