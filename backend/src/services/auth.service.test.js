// Auth service tests. Run with:
//   NODE_OPTIONS=--experimental-vm-modules npx jest src/services/auth.service.test.js
//
// Requires `mongodb-memory-server`. If the package is missing, the suite
// is skipped automatically so CI doesn't fail on fresh checkouts.

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";

let connectTestDB, clearTestDB, disconnectTestDB;

try {
  const dbModule = await import("../../tests/db.js");
  connectTestDB = dbModule.connectTestDB;
  clearTestDB = dbModule.clearTestDB;
  disconnectTestDB = dbModule.disconnectTestDB;
} catch (e) {
  // mongodb-memory-server not installed
  const msg = e.message.includes("Cannot find package")
    ? "mongodb-memory-server not installed — skipping auth.service tests"
    : e.message;
  // eslint-disable-next-line no-console
  console.warn(msg);
}

const skipIfNoDB = !connectTestDB;

(skipIfNoDB ? describe.skip : describe)("auth.service", () => {
  let authService;
  let generateAccessToken, verifyAccessToken;

  beforeAll(async () => {
    await connectTestDB();
    authService = (await import("./auth.service.js")).authService;
    const jwt = await import("../config/jwt.js");
    generateAccessToken = jwt.generateAccessToken;
    verifyAccessToken = jwt.verifyAccessToken;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("register()", () => {
    it("creates a user and returns tokens", async () => {
      const result = await authService.register("Alice", "alice@example.com", "Pass1234");

      expect(result.user.email).toBe("alice@example.com");
      expect(result.user.name).toBe("Alice");
      expect(result.user.password).toBeUndefined(); // toJSON strips it
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();

      // Access token is verifiable
      const decoded = verifyAccessToken(result.accessToken);
      expect(decoded.userId).toBe(result.user._id);
    });

    it("rejects duplicate emails", async () => {
      await authService.register("Alice", "alice@example.com", "Pass1234");
      await expect(
        authService.register("Alice2", "alice@example.com", "Pass1234"),
      ).rejects.toThrow(/Email already registered/);
    });
  });

  describe("login()", () => {
    beforeEach(async () => {
      await authService.register("Bob", "bob@example.com", "Pass1234");
    });

    it("returns user + tokens on correct password", async () => {
      const result = await authService.login("bob@example.com", "Pass1234");
      expect(result.user.email).toBe("bob@example.com");
      expect(result.accessToken).toBeTruthy();
    });

    it("rejects wrong password", async () => {
      await expect(
        authService.login("bob@example.com", "WrongPass"),
      ).rejects.toThrow(/Invalid email or password/);
    });

    it("rejects unknown email", async () => {
      await expect(
        authService.login("nobody@example.com", "Pass1234"),
      ).rejects.toThrow(/Invalid email or password/);
    });
  });

  describe("refreshAccessToken()", () => {
    it("issues a new access token for a valid refresh token", async () => {
      const { refreshToken, user } = await authService.register(
        "Carol",
        "carol@example.com",
        "Pass1234",
      );
      const result = await authService.refreshAccessToken(refreshToken);
      expect(result.accessToken).toBeTruthy();
      const decoded = verifyAccessToken(result.accessToken);
      expect(decoded.userId).toBe(user._id);
    });

    it("rejects garbage tokens", async () => {
      await expect(
        authService.refreshAccessToken("not-a-real-token"),
      ).rejects.toThrow(/Invalid or expired refresh token/);
    });
  });

  describe("changePassword()", () => {
    it("rejects if current password is wrong", async () => {
      const { user } = await authService.register(
        "Dan",
        "dan@example.com",
        "Pass1234",
      );
      await expect(
        authService.changePassword(user._id, "WrongPass", "NewPass5678"),
      ).rejects.toThrow(/Current password is incorrect/);
    });

    it("succeeds with correct current password", async () => {
      const { user } = await authService.register(
        "Eve",
        "eve@example.com",
        "Pass1234",
      );
      await expect(
        authService.changePassword(user._id, "Pass1234", "NewPass5678"),
      ).resolves.toEqual({ message: "Password changed successfully" });

      // Can log in with new password
      const result = await authService.login("eve@example.com", "NewPass5678");
      expect(result.user.email).toBe("eve@example.com");
    });
  });
});
