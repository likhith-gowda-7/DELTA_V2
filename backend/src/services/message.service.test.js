// Message service tests. Skipped automatically if mongodb-memory-server
// is not installed.

import {
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
  if (e.message.includes("Cannot find module")) {
    // eslint-disable-next-line no-console
    console.warn("mongodb-memory-server not installed — skipping message.service tests");
  } else {
    throw e;
  }
}

const skipIfNoDB = !connectTestDB;
const tenMinutesAgo = () => new Date(Date.now() - 10 * 60 * 1000);

(skipIfNoDB ? describe.skip : describe)("message.service", () => {
  let messageService, Chat, User;

  let alice, bob, eve;
  let chatBetweenAliceAndBob;

  beforeAll(async () => {
    await connectTestDB();
    messageService = (await import("./message.service.js")).messageService;
    Chat = (await import("../models/Chat.js")).default;
    User = (await import("../models/User.js")).default;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    alice = await User.create({ name: "Alice", email: "alice@example.com", password: "Pass1234" });
    bob = await User.create({ name: "Bob", email: "bob@example.com", password: "Pass1234" });
    eve = await User.create({ name: "Eve", email: "eve@example.com", password: "Pass1234" });
    chatBetweenAliceAndBob = await Chat.create({
      users: [alice._id, bob._id],
      isGroupChat: false,
    });
  });

  describe("sendMessage()", () => {
    it("persists a message and updates the chat's latestMessage", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Hello, Bob!",
      );

      expect(msg.content).toBe("Hello, Bob!");
      expect(msg.sender._id.toString()).toBe(alice._id.toString());

      const reloaded = await Chat.findById(chatBetweenAliceAndBob._id);
      expect(reloaded.latestMessage.toString()).toBe(msg._id.toString());
      expect(reloaded.latestMessageTime).toBeInstanceOf(Date);
    });

    it("rejects non-member senders with 403", async () => {
      await expect(
        messageService.sendMessage(
          chatBetweenAliceAndBob._id,
          eve._id,
          "Sneaking in!",
        ),
      ).rejects.toThrow(/not a member/i);
    });

    it("rejects unknown chat ids with 404", async () => {
      const fakeId = "000000000000000000000000";
      await expect(
        messageService.sendMessage(fakeId, alice._id, "Hi?"),
      ).rejects.toThrow(/Chat not found/);
    });
  });

  describe("editMessage()", () => {
    it("allows the sender to edit within 5 minutes", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Original",
      );

      const edited = await messageService.editMessage(
        msg._id,
        "Edited!",
        alice._id,
      );
      expect(edited.content).toBe("Edited!");
      expect(edited.editedAt).toBeInstanceOf(Date);
    });

    it("rejects editing by non-sender with 403", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Original",
      );
      await expect(
        messageService.editMessage(msg._id, "Hijack", bob._id),
      ).rejects.toThrow(/Only sender/);
    });

    it("rejects editing after 5 minutes", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Old message",
      );

      // Backdate the message to 10 minutes ago
      const Message = (await import("../models/Message.js")).default;
      await Message.findByIdAndUpdate(msg._id, { createdAt: tenMinutesAgo() });

      await expect(
        messageService.editMessage(msg._id, "Too late", alice._id),
      ).rejects.toThrow(/within 5 minutes/);
    });
  });

  describe("deleteMessage()", () => {
    it("soft-deletes a message by its sender", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Oops",
      );
      await messageService.deleteMessage(msg._id, alice._id);

      const Message = (await import("../models/Message.js")).default;
      const reloaded = await Message.findById(msg._id);
      expect(reloaded.isDeleted).toBe(true);
    });

    it("rejects deletion by random non-admin user", async () => {
      const msg = await messageService.sendMessage(
        chatBetweenAliceAndBob._id,
        alice._id,
        "Mine",
      );
      await expect(
        messageService.deleteMessage(msg._id, eve._id),
      ).rejects.toThrow(/only delete your own/i);
    });
  });

  describe("markChatAsRead() / getUnreadCount()", () => {
    it("zero unread for a fresh chat, N unread after N messages, 0 after markChatAsRead", async () => {
      expect(
        await messageService.getUnreadCount(chatBetweenAliceAndBob._id, bob._id),
      ).toBe(0);

      await messageService.sendMessage(chatBetweenAliceAndBob._id, alice._id, "Hi");
      await messageService.sendMessage(chatBetweenAliceAndBob._id, alice._id, "Hi again");

      expect(
        await messageService.getUnreadCount(chatBetweenAliceAndBob._id, bob._id),
      ).toBe(2);

      await messageService.markChatAsRead(chatBetweenAliceAndBob._id, bob._id);

      expect(
        await messageService.getUnreadCount(chatBetweenAliceAndBob._id, bob._id),
      ).toBe(0);
    });
  });
});
