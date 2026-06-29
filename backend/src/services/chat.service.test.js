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
  const msg = e.message.includes("Cannot find package")
    ? "mongodb-memory-server not installed — skipping chat.service tests"
    : e.message;
  console.warn(msg);
}

const skipIfNoDB = !connectTestDB;

(skipIfNoDB ? describe.skip : describe)("chat.service", () => {
  let chatService;
  let User;

  beforeAll(async () => {
    await connectTestDB();
    chatService = (await import("./chat.service.js")).chatService;
    User = (await import("../models/User.js")).default;
    // Register Message model so populate on latestMessage works
    await import("../models/Message.js");
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("createOrAccessChat()", () => {
    it("creates a new 1-to-1 chat between two users", async () => {
      const userA = await User.create({ name: "Alice", email: "alice@test.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "bob@test.com", password: "Pass1234" });

      const chat = await chatService.createOrAccessChat(userA._id, userB._id);

      expect(chat.isGroupChat).toBe(false);
      expect(chat.users.length).toBe(2);
    });

    it("returns existing chat if one already exists", async () => {
      const userA = await User.create({ name: "Alice", email: "alice@test.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "bob@test.com", password: "Pass1234" });

      const first = await chatService.createOrAccessChat(userA._id, userB._id);
      const second = await chatService.createOrAccessChat(userA._id, userB._id);

      expect(second._id.toString()).toBe(first._id.toString());
    });

    it("throws if other user does not exist", async () => {
      const fakeId = "000000000000000000000000";
      const userA = await User.create({ name: "Alice", email: "alice@test.com", password: "Pass1234" });

      await expect(
        chatService.createOrAccessChat(userA._id, fakeId),
      ).rejects.toThrow(/User not found/);
    });
  });

  describe("getUserChats()", () => {
    it("returns empty array when user has no chats", async () => {
      const user = await User.create({ name: "Alice", email: "alice@test.com", password: "Pass1234" });
      const chats = await chatService.getUserChats(user._id);
      expect(chats).toEqual([]);
    });
  });
});
