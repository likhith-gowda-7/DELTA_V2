// First test for env validation
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

describe("config/env", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("exports a config object with sane defaults", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "x".repeat(40);
    process.env.JWT_REFRESH_SECRET = "y".repeat(40);

    const { config } = await import("../src/config/env.js");
    expect(config.PORT).toBeGreaterThan(0);
    expect(config.JWT_ACCESS_EXPIRE).toBe("15m");
    expect(config.JWT_REFRESH_EXPIRE).toBe("7d");
    expect(config.FRONTEND_URL).toMatch(/^https?:\/\//);
  });

  it("validateEnv throws on missing required vars", async () => {
    // Use a stub path to prevent dotenv from loading the project's .env
    jest.unstable_mockModule("dotenv", () => ({
      default: { config: () => ({}) },
      config: () => ({}),
    }));
    delete process.env.MONGODB_URI;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    const { validateEnv } = await import("../src/config/env.js");
    expect(() => validateEnv()).toThrow(/Missing required environment variables/);
  });
});
