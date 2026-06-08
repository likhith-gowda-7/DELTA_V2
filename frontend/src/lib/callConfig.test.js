// Tests for the centralized WebRTC config.

import { describe, it, expect } from "vitest";

describe("callConfig", () => {
  it("exports ICE_SERVERS with at least one STUN entry", async () => {
    const { ICE_SERVERS } = await import("./callConfig.js");
    expect(ICE_SERVERS.length).toBeGreaterThan(0);
    expect(ICE_SERVERS.some((s) => s.urls.startsWith("stun:"))).toBe(true);
  });

  it("exports GROUP_CALL_LIMITS with sane defaults", async () => {
    const { GROUP_CALL_LIMITS } = await import("./callConfig.js");
    expect(GROUP_CALL_LIMITS.MAX_PARTICIPANTS).toBeGreaterThan(0);
    expect(GROUP_CALL_LIMITS.MAX_PARTICIPANTS).toBeLessThanOrEqual(6);
    expect(GROUP_CALL_LIMITS.INCOMING_TIMEOUT_MS).toBeGreaterThan(0);
    expect(GROUP_CALL_LIMITS.QUALITY_REPORT_INTERVAL_MS).toBeGreaterThan(0);
  });

  it("IS_TURN_CONFIGURED is a boolean", async () => {
    const { IS_TURN_CONFIGURED } = await import("./callConfig.js");
    expect(typeof IS_TURN_CONFIGURED).toBe("boolean");
  });
});
