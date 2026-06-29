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
    ? "mongodb-memory-server not installed — skipping user.service tests"
    : e.message;
  console.warn(msg);
}

const skipIfNoDB = !connectTestDB;

(skipIfNoDB ? describe.skip : describe)("user.service", () => {
  let userService;
  let User;

  beforeAll(async () => {
    await connectTestDB();
    userService = (await import("./user.service.js")).userService;
    User = (await import("../models/User.js")).default;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("searchUsers()", () => {
    it("finds users by name prefix", async () => {
      await User.create({ name: "Alice", email: "alice@t.com", password: "Pass1234" });
      await User.create({ name: "Bob", email: "bob@t.com", password: "Pass1234" });
      await User.create({ name: "Charlie", email: "charlie@t.com", password: "Pass1234" });

      const currentUser = await User.create({ name: "Admin", email: "admin@t.com", password: "Pass1234" });
      const { users } = await userService.searchUsers("Ali", 20, 0, currentUser._id);

      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Alice");
    });

    it("excludes current user from results", async () => {
      const currentUser = await User.create({ name: "Admin", email: "admin@t.com", password: "Pass1234" });

      const { users } = await userService.searchUsers("Admin", 20, 0, currentUser._id);
      expect(users.length).toBe(0);
    });
  });

  describe("blockUser() / unblockUser()", () => {
    it("blocks a user", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });

      await userService.blockUser(userA._id, userB._id);

      const updated = await User.findById(userA._id);
      expect(updated.blockedUsers.length).toBe(1);
      expect(updated.blockedUsers[0].toString()).toBe(userB._id.toString());
    });

    it("prevents self-block", async () => {
      const user = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });

      await expect(
        userService.blockUser(user._id, user._id),
      ).rejects.toThrow(/cannot block yourself/);
    });

    it("unblocks a user", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });

      await userService.blockUser(userA._id, userB._id);
      await userService.unblockUser(userA._id, userB._id);

      const updated = await User.findById(userA._id).lean();
      expect(updated.blockedUsers.length).toBe(0);
    });
  });

  describe("getMultipleUsersStatus()", () => {
    it("returns status map for given user IDs", async () => {
      const userA = await User.create({ name: "Alice", email: "a@t.com", password: "Pass1234" });
      const userB = await User.create({ name: "Bob", email: "b@t.com", password: "Pass1234" });

      const statusMap = await userService.getMultipleUsersStatus([userA._id, userB._id]);
      expect(statusMap[userA._id]).toBeDefined();
      expect(statusMap[userA._id].isOnline).toBe(false);
      expect(statusMap[userB._id].isOnline).toBe(false);
    });
  });
});
