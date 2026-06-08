// Vitest setup: stub fetch/axios, mock localStorage, expose matchers.
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Polyfill localStorage (jsdom provides it but reset between tests)
afterEach(() => {
  localStorage.clear();
  cleanup();
  vi.restoreAllMocks();
});

// Silence expected React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) {
      return;
    }
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

import { beforeAll, afterAll } from "vitest";
