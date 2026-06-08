// First unit test — the simplest place to start.
// Run with: NODE_OPTIONS=--experimental-vm-modules npx jest src/middleware/validation.test.js
import { jest, describe, it, expect } from "@jest/globals";
import { validate } from "./validation.js";
import { z } from "zod";

describe("validate middleware", () => {
  const schema = z.object({ name: z.string().min(2) });

  it("passes valid body to the next handler", () => {
    const middleware = validate(schema);
    const req = { body: { name: "Alice" } };
    const res = {};
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe("Alice");
  });

  it("rejects invalid body with 400", () => {
    const middleware = validate(schema);
    const req = { body: { name: "A" } };
    const res = {};
    const next = jest.fn();
    expect(() => middleware(req, res, next)).toThrow(/name: /);
  });

  it("targets params when specified", () => {
    const middleware = validate(schema, "params");
    const req = { params: { name: "Bob" } };
    const res = {};
    const next = jest.fn();
    middleware(req, res, next);
    expect(req.params.name).toBe("Bob");
  });

  it("targets query when specified", () => {
    const middleware = validate(schema, "query");
    const req = { query: { name: "Carol" } };
    const res = {};
    const next = jest.fn();
    middleware(req, res, next);
    expect(req.query.name).toBe("Carol");
  });
});

describe("validateRequest alias", () => {
  it("is the same function as validate", async () => {
    const { validateRequest } = await import("./validation.js");
    const { validate } = await import("./validation.js");
    expect(validateRequest).toBe(validate);
  });
});
