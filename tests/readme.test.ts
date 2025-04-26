import { describe, test, expect } from "vitest";
import { assertJson, assertJsonSoft } from "../src/assertJson";

describe("README examples", () => {
  test("Basic example", () => {
    const data = { foo: 1 };

    expect(() => assertJson(data).toHaveKey("foo").toBeType("foo", "number")).not.toThrow();
  });

  test("User object example", () => {
    const data = {
      user: {
        name: "John",
        email: "john@example.com",
      },
    };

    expect(() => assertJson(data).toHaveKey("user.name").not.toHaveKey("user.password")).not.toThrow();
  });

  test("Soft assertion mode example", () => {
    const data = {
      user: {
        name: "John",
      },
    };

    const assertion = assertJson(data, { soft: true });

    assertion
      .toHaveKey("user.name") // ok
      .not.toHaveKey("user.name"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/not to exist/);
  });

  test("Array indexing example", () => {
    const data = { arr: [{ id: 1 }, { id: 2 }] };

    expect(() => assertJson(data).toHaveKey("arr[1].id").toMatchValue("arr[0].id", 1)).not.toThrow();

    expect(() => assertJson(data).toHaveKey("arr[2].id")).toThrow(/to exist/);
  });

  test("Type and value checks example", () => {
    const data = { a: 123, b: "hello", c: null, d: [1, 2], e: { x: 1 } };

    expect(() => assertJson(data).toBeType("a", "number").toBeFalsy("c")).not.toThrow();
  });

  test("Array and string containment example", () => {
    const data = { arr: [1, 2, 3], str: "hello world" };

    expect(() =>
      assertJson(data).toContainValue("arr", 2).toContainValue("str", "world").not.toContainValue("arr", 5),
    ).not.toThrow();
  });

  test("Numeric comparisons example", () => {
    const data = { score: 42 };

    expect(() => assertJson(data).toBeGreaterThan("score", 10).not.toBeLessThan("score", 10)).not.toThrow();
  });

  test("One of / enum example", () => {
    const data = { status: "pending" };

    expect(() =>
      assertJson(data).toBeOneOf("status", ["pending", "done", "failed"]).not.toBeOneOf("status", ["archived"]),
    ).not.toThrow();
  });

  test("Custom predicate example", () => {
    const data = { value: 15 };

    expect(() =>
      assertJson(data)
        .toSatisfy("value", (v) => typeof v === "number" && v % 5 === 0)
        .not.toSatisfy("value", (v) => v < 0),
    ).not.toThrow();
  });

  test("assertJsonSoft utility function example", () => {
    const data = { foo: 1, bar: "baz" };

    const assertion = assertJsonSoft(data);

    // Testing that soft mode is indeed enabled
    expect(assertion.isSoft).toBe(true);

    assertion
      .toHaveKey("foo") // ok
      .toHaveKey("missing") // error
      .toBeType("foo", "string"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/missing/);
    expect(errors[1].message).toMatch(/to be type/);
  });

  test("Advanced chaining with multiple different assertions", () => {
    const data = {
      user: {
        name: "John",
        age: 30,
        roles: ["admin", "editor"],
        settings: {
          theme: "dark",
          notifications: true,
        },
        active: true,
        lastLogin: "2023-01-01",
      },
    };

    expect(() =>
      assertJson(data)
        .toHaveKey("user.name")
        .toBeType("user.name", "string")
        .toBeType("user.age", "number")
        .toBeGreaterThan("user.age", 18)
        .toBeType("user.roles", "array")
        .toContainValue("user.roles", "admin")
        .toBeType("user.settings", "object")
        .toHaveKey("user.settings.theme")
        .toBeTruthy("user.active")
        .toBeOneOf("user.settings.theme", ["light", "dark"])
        .not.toHaveKey("user.password"),
    ).not.toThrow();
  });

  test("Soft mode with maxErrors example", () => {
    const data = {
      user: {
        name: 123,
        active: "not a boolean",
        role: null,
      },
    };

    const assertion = assertJson(data, { soft: true, maxErrors: 2 });

    // These will collect errors but not throw
    assertion
      .toBeType("user.name", "string") // error 1
      .toBeType("user.active", "boolean"); // error 2

    // This would exceed maxErrors, so it should throw
    expect(() => assertion.toBeTruthy("user.role")).toThrow(/Maximum number of errors/);

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
  });
});
