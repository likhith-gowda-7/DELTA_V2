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
    ? "mongodb-memory-server not installed — skipping message.service tests"
    : e.message;
  console.warn(msg);
}

const skipIfNoDB = !connectTestDB;

(skipIfNoDB ? describe.skip : describe)("message.service", () => {
  let messageService;
  let User, Chat;

  beforeAll(async () => {
    await connectTestDB();
    messageService = (await import("./message.service.js")).messageService;
    User = (await import("../models/User.js")).default;
    Chat = (await import("../models/Chat.js")).default;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("sendMessage()", () => {
    it("sends a text message and updates latestMessage on chat", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      const message = await messageService.sendMessage(chat._id, userA._id, "Hello!");

      expect(message.content).toBe("Hello!");
      expect(message.sender._id.toString()).toBe(userA._id.toString());
      expect(message.chat.toString()).toBe(chat._id.toString());

      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.latestMessage.toString()).toBe(message._id.toString());
    });

    it("rejects message from non-member", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const userC = await User.create({ name: "Carol", email: "c@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      await expect(
        messageService.sendMessage(chat._id, userC._id, "Hello!"),
      ).rejects.toThrow(/not a member/);
    });
  });

  describe("editMessage()", () => {
    it("allows sender to edit within 5 minutes", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      const message = await messageService.sendMessage(chat._id, userA._id, "Hello!");
      const edited = await messageService.editMessage(message._id, "Edited!", userA._id.toString());

      expect(edited.content).toBe("Edited!");
      expect(edited.editedAt).toBeTruthy();
    });

    it("rejects edit by non-sender", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      const message = await messageService.sendMessage(chat._id, userA._id, "Hello!");

      await expect(
        messageService.editMessage(message._id, "Hacked!", userB._id.toString()),
      ).rejects.toThrow(/Only sender/);
    });
  });

  describe("getUnreadCount()", () => {
    it("returns correct unread count", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      await messageService.sendMessage(chat._id, userA._id, "Msg 1");
      await messageService.sendMessage(chat._id, userA._id, "Msg 2");

      const count = await messageService.getUnreadCount(chat._id, userB._id);
      expect(count).toBe(2);

      const countA = await messageService.getUnreadCount(chat._id, userA._id);
      expect(countA).toBe(0);
    });
  });

  describe("searchMessages()", () => {
    it("finds messages by keyword", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });
      const chat = await Chat.create({ isGroupChat: false, users: [userA._id, userB._id] });

      await messageService.sendMessage(chat._id, userA._id, "Hello world");
      await messageService.sendMessage(chat._id, userA._id, "Goodbye");

      const results = await messageService.searchMessages(chat._id, "world", userB._id);
      expect(results.length).toBe(1);
      expect(results[0].content).toBe("Hello world");
    });
  });
});
