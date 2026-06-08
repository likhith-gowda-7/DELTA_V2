// Call service tests. Skipped automatically if mongodb-memory-server
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
    console.warn("mongodb-memory-server not installed — skipping call.service tests");
  } else {
    throw e;
  }
}

const skipIfNoDB = !connectTestDB;

(skipIfNoDB ? describe.skip : describe)("call.service", () => {
  let createCall, acceptCall, rejectCall, endCall, getCallById;
  let User;

  let alice, bob;

  beforeAll(async () => {
    await connectTestDB();
    const svc = await import("./call.service.js");
    createCall = svc.createCall;
    acceptCall = svc.acceptCall;
    rejectCall = svc.rejectCall;
    endCall = svc.endCall;
    getCallById = svc.getCallById;
    User = (await import("../models/User.js")).default;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    alice = await User.create({ name: "Alice", email: "alice@example.com", password: "Pass1234" });
    bob = await User.create({ name: "Bob", email: "bob@example.com", password: "Pass1234" });
  });

  it("createCall produces a pending 1-to-1 call", async () => {
    const call = await createCall(alice._id, bob._id, "video");
    expect(call.status).toBe("pending");
    expect(call.callType).toBe("1-to-1");
    expect(call.initiatorId.toString()).toBe(alice._id.toString());
    expect(call.recipientId.toString()).toBe(bob._id.toString());
    expect(call.mediaType).toBe("video");
  });

  it("createCall rejects a duplicate pending call", async () => {
    await createCall(alice._id, bob._id, "video");
    await expect(createCall(alice._id, bob._id, "video")).rejects.toThrow(
      /Call already in progress/i,
    );
  });

  it("acceptCall transitions status to accepted and sets startedAt", async () => {
    const call = await createCall(alice._id, bob._id, "audio");
    const accepted = await acceptCall(call._id, bob._id);
    expect(accepted.status).toBe("accepted");
    expect(accepted.startedAt).toBeInstanceOf(Date);
  });

  it("acceptCall rejects when caller is not the recipient", async () => {
    const call = await createCall(alice._id, bob._id, "audio");
    await expect(acceptCall(call._id, alice._id)).rejects.toThrow(
      /not the recipient/i,
    );
  });

  it("rejectCall marks call rejected with reason", async () => {
    const call = await createCall(alice._id, bob._id, "audio");
    const rejected = await rejectCall(call._id, bob._id, "busy");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("busy");
  });

  it("endCall on an accepted call records duration and ended status", async () => {
    const call = await createCall(alice._id, bob._id, "video");
    await acceptCall(call._id, bob._id);
    const ended = await endCall(call._id, alice._id, 60);
    expect(ended.status).toBe("ended");
    expect(ended.endedAt).toBeInstanceOf(Date);
    expect(ended.duration).toBe(60);
  });

  it("endCall on a still-pending call marks it missed", async () => {
    const call = await createCall(alice._id, bob._id, "video");
    const ended = await endCall(call._id, alice._id);
    expect(ended.status).toBe("missed");
  });

  it("getCallById returns a populated call", async () => {
    const call = await createCall(alice._id, bob._id, "video");
    const fetched = await getCallById(call._id);
    expect(fetched.initiatorId.email).toBe("alice@example.com");
    expect(fetched.recipientId.email).toBe("bob@example.com");
  });
});
