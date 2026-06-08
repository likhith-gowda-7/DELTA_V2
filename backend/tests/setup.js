// Test setup: load test env, provide a clean Mongo for integration tests.
// Run with: NODE_ENV=test npm test

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.test" });

// Common test helpers
export const TEST_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "TestPass123",
};
