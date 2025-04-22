import { describe, test, expect } from "vitest";
import { assertJsonSoft } from "../src/assertJson";

describe("assertJsonSoft", () => {
  test("always enables soft mode", () => {
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJsonSoft(data);

    assertion.toHaveKey("foo"); // ok
    assertion.toHaveKey("missing"); // error
    assertion.toBeType("bar", "number"); // error
    assertion.toMatchValue("foo", 2); // error
    assertion.not.toHaveKey("foo"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(4);
    expect(errors[0].message).toMatch(/missing/);
    expect(errors[1].message).toMatch(/to be type/);
    expect(errors[2].message).toMatch(/to equal/);
    expect(errors[3].message).toMatch(/not to exist/);
  });

  test("chaining collects all errors", () => {
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJsonSoft(data);

    assertion
      .toHaveKey("foo")
      .toBeType("foo", "string") // error
      .toMatchValue("bar", "qux") // error
      .toHaveKey("missing"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(3);
    expect(errors[0].message).toMatch(/to be type/);
    expect(errors[1].message).toMatch(/to equal/);
    expect(errors[2].message).toMatch(/missing/);
  });

  test("negated assertions collect errors", () => {
    const data = { foo: 1 };
    const assertion = assertJsonSoft(data);

    assertion.not.toHaveKey("missing"); // ok
    assertion.not.toHaveKey("foo"); // error
    assertion.not.toBeType("foo", "number"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/not to exist/);
    expect(errors[1].message).toMatch(/not to be type/);
  });

  test("toHaveKey works with array indices", () => {
    const data = { arr: [{ foo: 1 }, { bar: 2 }] };
    const assertion = assertJsonSoft(data);

    assertion.toHaveKey("arr[0].foo");
    assertion.toHaveKey("arr[1].bar");
    assertion.toHaveKey("arr[2].baz"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to exist/);
  });

  test("toBeType handles undefined and null", () => {
    const data = { a: undefined, b: null };
    const assertion = assertJsonSoft(data);

    assertion.toBeType("a", "undefined");
    assertion.toBeType("b", "null");
    assertion.toBeType("b", "object"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to be type/);
  });

  test("toMatchValue with objects and arrays", () => {
    const data = { obj: { x: 1 }, arr: [1, 2, 3] };
    const assertion = assertJsonSoft(data);

    assertion.toMatchValue("obj", { x: 1 });
    assertion.toMatchValue("arr", [1, 2, 3]);
    assertion.toMatchValue("arr", [3, 2, 1]); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to equal/);
  });

  test("chaining returns the same instance", () => {
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJsonSoft(data);

    const result = assertion.toHaveKey("foo").toBeType("foo", "number").toMatchValue("bar", "baz");

    expect(result).toBe(assertion);
    expect(assertion.getErrors().length).toBe(0);
  });

  test("soft mode: negated assertions collect errors with chaining", () => {
    const data = { foo: 1 };
    const assertion = assertJsonSoft(data);

    assertion.not.toHaveKey("missing"); // ok
    assertion.not.toHaveKey("foo"); // error
    assertion.not.toBeType("foo", "number"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/not to exist/);
    expect(errors[1].message).toMatch(/not to be type/);
  });

  test("toSatisfy collects error if predicate fails", () => {
    const data = { foo: 3 };
    const assertion = assertJsonSoft(data);

    assertion.toSatisfy("foo", (v) => v > 5); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to satisfy predicate/);
  });

  test("not.toSatisfy collects error if predicate passes", () => {
    const data = { foo: 3 };
    const assertion = assertJsonSoft(data);

    assertion.not.toSatisfy("foo", (v) => v < 5); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/not to satisfy predicate/);
  });

  test("toSatisfy does not collect error if predicate throws", () => {
    const data = { foo: 1 };
    const assertion = assertJsonSoft(data);

    expect(() =>
      assertion.toSatisfy("foo", () => {
        throw new Error("predicate error");
      }),
    ).toThrow("predicate error");

    // Should not collect error for thrown predicate
    expect(assertion.getErrors().length).toBe(0);
  });

  test("toBeDefined, toBeNull, toBeTruthy, toBeFalsy in soft mode", () => {
    const data = {
      a: 1,
      b: undefined,
      c: null,
      d: 0,
      e: "",
      f: false,
      g: true,
      h: "hello",
    };
    const assertion = assertJsonSoft(data);

    assertion.toBeDefined("a");
    assertion.toBeDefined("b"); // error
    assertion.toBeNull("c");
    assertion.toBeNull("a"); // error
    assertion.toBeTruthy("a");
    assertion.toBeTruthy("d"); // error
    assertion.toBeFalsy("d");
    assertion.toBeFalsy("g"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(4);
    expect(errors[0].message).toMatch(/to be defined/);
    expect(errors[1].message).toMatch(/to be null/);
    expect(errors[2].message).toMatch(/to be truthy/);
    expect(errors[3].message).toMatch(/to be falsy/);
  });

  test("negated chaining for toBeDefined, toBeNull, toBeTruthy, toBeFalsy in soft mode", () => {
    const data = { a: undefined, b: null, c: 0, d: 1, e: false, f: true, g: "" };
    const assertion = assertJsonSoft(data);

    assertion.not.toBeDefined("a"); // ok
    assertion.not.toBeNull("d"); // ok
    assertion.not.toBeTruthy("c"); // ok
    assertion.not.toBeFalsy("f"); // ok
    assertion.not.toBeDefined("d"); // error
    assertion.not.toBeNull("b"); // error
    assertion.not.toBeTruthy("d"); // error
    assertion.not.toBeFalsy("c"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(4);
    expect(errors[0].message).toMatch(/not to be defined/);
    expect(errors[1].message).toMatch(/not to be null/);
    expect(errors[2].message).toMatch(/not to be truthy/);
    expect(errors[3].message).toMatch(/not to be falsy/);
  });

  test("toBeType with all primitive types in soft mode", () => {
    const data = {
      str: "abc",
      num: 123,
      bool: true,
      obj: {},
      arr: [],
      undef: undefined,
      nil: null,
    };
    const assertion = assertJsonSoft(data);

    assertion.toBeType("str", "string");
    assertion.toBeType("num", "number");
    assertion.toBeType("bool", "boolean");
    assertion.toBeType("obj", "object");
    assertion.toBeType("arr", "array");
    assertion.toBeType("undef", "undefined");
    assertion.toBeType("nil", "null");
    assertion.toBeType("missing", "string"); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to be type/);
  });

  test("toContainValue in soft mode", () => {
    const data = {
      arr: [1, 2, 3, { x: 5 }],
      str: "hello world",
      empty: [],
      notArr: 123,
    };
    const assertion = assertJsonSoft(data);

    assertion.toContainValue("arr", 2);
    assertion.toContainValue("arr", { x: 5 });
    assertion.toContainValue("arr", 4); // error
    assertion.toContainValue("str", "world");
    assertion.toContainValue("str", "nope"); // error
    assertion.toContainValue("empty", 1); // error
    assertion.toContainValue("notArr", 1); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(4);
    expect(errors[0].message).toMatch(/to contain/);
    expect(errors[1].message).toMatch(/to contain/);
    expect(errors[2].message).toMatch(/to contain/);
    expect(errors[3].message).toMatch(/to contain/);
  });

  test("toBeGreaterThan in soft mode", () => {
    const data = { a: 5, b: 10, c: "notnum" };
    const assertion = assertJsonSoft(data);

    assertion.toBeGreaterThan("b", 5);
    assertion.toBeGreaterThan("a", 10); // error
    assertion.toBeGreaterThan("c", 1); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/to be greater than/);
    expect(errors[1].message).toMatch(/to be greater than/);
  });

  test("toBeLessThan in soft mode", () => {
    const data = { a: 5, b: 10, c: "notnum" };
    const assertion = assertJsonSoft(data);

    assertion.toBeLessThan("a", 10);
    assertion.toBeLessThan("b", 5); // error
    assertion.toBeLessThan("c", 1); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/to be less than/);
    expect(errors[1].message).toMatch(/to be less than/);
  });

  test("toBeOneOf in soft mode", () => {
    const data = { a: 1, b: "foo", c: { x: 1 }, d: 5 };
    const assertion = assertJsonSoft(data);

    assertion.toBeOneOf("a", [1, 2, 3]);
    assertion.toBeOneOf("b", ["bar", "foo"]);
    assertion.toBeOneOf("c", [{ x: 1 }, { y: 2 }]);
    assertion.toBeOneOf("d", [1, 2, 3]); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to be one of/);
  });

  test("toSatisfy in soft mode", () => {
    const data = { a: 10, b: "hello", c: [1, 2, 3], d: null };
    const assertion = assertJsonSoft(data);

    assertion.toSatisfy("a", (v) => typeof v === "number" && v > 5);
    assertion.toSatisfy("b", (v) => typeof v === "string" && v.startsWith("h"));
    assertion.toSatisfy("c", (v) => Array.isArray(v) && v.length === 3);
    assertion.toSatisfy("d", (v) => v === null);
    assertion.toSatisfy("a", (v) => v < 0); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/to satisfy predicate/);
  });

  test("negated soft mode for .toContainValue, .toBeGreaterThan, .toBeLessThan, .toBeOneOf, .toSatisfy", () => {
    const data = {
      arr: [1, 2, 3],
      num: 5,
      str: "abc",
      obj: { x: 1 },
      val: 2,
    };
    const assertion = assertJsonSoft(data);

    assertion.not.toContainValue("arr", 4); // ok
    assertion.not.toContainValue("arr", 2); // error
    assertion.not.toBeGreaterThan("num", 10); // ok
    assertion.not.toBeGreaterThan("num", 1); // error
    assertion.not.toBeLessThan("num", 1); // ok
    assertion.not.toBeLessThan("num", 10); // error
    assertion.not.toBeOneOf("val", [1, 3, 4]); // ok
    assertion.not.toBeOneOf("val", [1, 2, 3]); // error
    assertion.not.toSatisfy("num", (v) => v < 0); // ok
    assertion.not.toSatisfy("num", (v) => v > 0); // error

    const errors = assertion.getErrors();
    expect(errors.length).toBe(5);
    expect(errors[0].message).toMatch(/not to contain/);
    expect(errors[1].message).toMatch(/not to be greater than/);
    expect(errors[2].message).toMatch(/not to be less than/);
    expect(errors[3].message).toMatch(/not to be one of/);
    expect(errors[4].message).toMatch(/not to satisfy predicate/);
  });
});
