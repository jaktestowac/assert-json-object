import { describe, test, expect } from "vitest";
import { assertJson } from "../src/assertJson";

describe("JsonAssertion", () => {
  test("toHaveKey - success", () => {
    // Arrange
    const data = { foo: { bar: 123 } };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toHaveKey("foo.bar")).not.toThrow();
  });

  test("toHaveKey - failure", () => {
    // Arrange
    const data = { foo: { bar: 123 } };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toHaveKey("foo.baz")).toThrow(/to exist/);
  });

  test("not.toHaveKey - negated", () => {
    // Arrange
    const data = { foo: { bar: 123 } };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.not.toHaveKey("foo.baz")).not.toThrow();
    expect(() => assertion.not.toHaveKey("foo.bar")).toThrow(/not to exist/);
  });

  test("toBeType - matches type", () => {
    // Arrange
    const data = { foo: [1, 2, 3], bar: null, baz: 42 };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toBeType("foo", "array")).not.toThrow();
    expect(() => assertion.toBeType("bar", "null")).not.toThrow();
    expect(() => assertion.toBeType("baz", "number")).not.toThrow();
  });

  test("toBeType - fails on wrong type", () => {
    // Arrange
    const data = { foo: [1, 2, 3] };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toBeType("foo", "object")).toThrow(/to be type/);
  });

  test("toMatchValue - matches value", () => {
    // Arrange
    const data = { foo: { bar: [1, 2] } };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toMatchValue("foo.bar", [1, 2])).not.toThrow();
  });

  test("toMatchValue - fails on mismatch", () => {
    // Arrange
    const data = { foo: { bar: [1, 2] } };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toMatchValue("foo.bar", [2, 1])).toThrow(/to equal/);
  });

  test("toSatisfy - predicate passes", () => {
    // Arrange
    const data = { foo: 10 };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toSatisfy("foo", (v) => v > 5)).not.toThrow();
  });

  test("toSatisfy - predicate fails", () => {
    // Arrange
    const data = { foo: 3 };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toSatisfy("foo", (v) => v > 5)).toThrow(/to satisfy predicate/);
  });

  test("not.toSatisfy - negated", () => {
    // Arrange
    const data = { foo: 3 };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.not.toSatisfy("foo", (v) => v > 5)).not.toThrow();
    expect(() => assertion.not.toSatisfy("foo", (v) => v < 5)).toThrow(/not to satisfy predicate/);
  });

  test("soft assertion collects errors instead of throwing", () => {
    // Arrange
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJson(data, { soft: true });

    // Act
    assertion.toHaveKey("foo"); // ok
    assertion.toHaveKey("missing"); // error
    assertion.toBeType("bar", "number"); // error
    assertion.toMatchValue("foo", 2); // error
    assertion.not.toHaveKey("foo"); // error

    // Assert
    const errors = assertion.getErrors();
    expect(errors.length).toBe(4);
    expect(errors[0].message).toMatch(/missing/);
    expect(errors[1].message).toMatch(/to be type/);
    expect(errors[2].message).toMatch(/to equal/);
    expect(errors[3].message).toMatch(/not to exist/);
  });

  test("toHaveKey works with array indices", () => {
    // Arrange
    const data = { arr: [{ foo: 1 }, { bar: 2 }] };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toHaveKey("arr[0].foo")).not.toThrow();
    expect(() => assertion.toHaveKey("arr[1].bar")).not.toThrow();
    expect(() => assertion.toHaveKey("arr[2].baz")).toThrow(/to exist/);
  });

  test("toBeType handles undefined and null", () => {
    // Arrange
    const data = { a: undefined, b: null };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toBeType("a", "undefined")).not.toThrow();
    expect(() => assertion.toBeType("b", "null")).not.toThrow();
    expect(() => assertion.toBeType("b", "object")).toThrow(/to be type/);
  });

  test("toMatchValue with objects and arrays", () => {
    // Arrange
    const data = { obj: { x: 1 }, arr: [1, 2, 3] };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toMatchValue("obj", { x: 1 })).not.toThrow();
    expect(() => assertion.toMatchValue("arr", [1, 2, 3])).not.toThrow();
    expect(() => assertion.toMatchValue("arr", [3, 2, 1])).toThrow(/to equal/);
  });

  test("chaining assertions returns the same instance", () => {
    // Arrange
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toHaveKey("foo").toBeType("foo", "number").toMatchValue("bar", "baz")).not.toThrow();
  });

  test("soft mode: chaining collects all errors", () => {
    // Arrange
    const data = { foo: 1, bar: "baz" };
    const assertion = assertJson(data, { soft: true });

    // Act
    assertion
      .toHaveKey("foo")
      .toBeType("foo", "string") // error
      .toMatchValue("bar", "qux") // error
      .toHaveKey("missing"); // error

    // Assert
    const errors = assertion.getErrors();
    expect(errors.length).toBe(3);
    expect(errors[0].message).toMatch(/to be type/);
    expect(errors[1].message).toMatch(/to equal/);
    expect(errors[2].message).toMatch(/missing/);
  });

  test("soft mode: negated assertions collect errors", () => {
    // Arrange
    const data = { foo: 1 };
    const assertion = assertJson(data, { soft: true });

    // Act
    assertion.not.toHaveKey("missing"); // ok
    assertion.not.toHaveKey("foo"); // error
    assertion.not.toBeType("foo", "number"); // error

    // Assert
    const errors = assertion.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toMatch(/not to exist/);
    expect(errors[1].message).toMatch(/not to be type/);
  });

  test("toSatisfy throws if predicate throws", () => {
    // Arrange
    const data = { foo: 1 };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() =>
      assertion.toSatisfy("foo", () => {
        throw new Error("predicate error");
      }),
    ).toThrow("predicate error");
  });

  test("toBeDefined - passes and fails", () => {
    const data = { a: 1, b: undefined, c: null };
    const assertion = assertJson(data);

    expect(() => assertion.toBeDefined("a")).not.toThrow();
    expect(() => assertion.toBeDefined("b")).toThrow(/to be defined/);
    expect(() => assertion.toBeDefined("c")).not.toThrow();
    expect(() => assertion.not.toBeDefined("b")).not.toThrow();
    expect(() => assertion.not.toBeDefined("a")).toThrow(/not to be defined/);
  });

  test("toBeNull - passes and fails", () => {
    const data = { a: null, b: 0, c: undefined };
    const assertion = assertJson(data);

    expect(() => assertion.toBeNull("a")).not.toThrow();
    expect(() => assertion.toBeNull("b")).toThrow(/to be null/);
    expect(() => assertion.not.toBeNull("b")).not.toThrow();
    expect(() => assertion.not.toBeNull("a")).toThrow(/not to be null/);
  });

  test("toBeTruthy - passes and fails", () => {
    const data = { a: 1, b: 0, c: "hello", d: "", e: true, f: false, g: null, h: undefined };
    const assertion = assertJson(data);

    expect(() => assertion.toBeTruthy("a")).not.toThrow();
    expect(() => assertion.toBeTruthy("c")).not.toThrow();
    expect(() => assertion.toBeTruthy("e")).not.toThrow();
    expect(() => assertion.toBeTruthy("b")).toThrow(/to be truthy/);
    expect(() => assertion.toBeTruthy("d")).toThrow(/to be truthy/);
    expect(() => assertion.toBeTruthy("f")).toThrow(/to be truthy/);
    expect(() => assertion.toBeTruthy("g")).toThrow(/to be truthy/);
    expect(() => assertion.toBeTruthy("h")).toThrow(/to be truthy/);

    expect(() => assertion.not.toBeTruthy("b")).not.toThrow();
    expect(() => assertion.not.toBeTruthy("a")).toThrow(/not to be truthy/);
  });

  test("toBeFalsy - passes and fails", () => {
    const data = { a: 0, b: "", c: false, d: null, e: undefined, f: 1, g: "x", h: true };
    const assertion = assertJson(data);

    expect(() => assertion.toBeFalsy("a")).not.toThrow();
    expect(() => assertion.toBeFalsy("b")).not.toThrow();
    expect(() => assertion.toBeFalsy("c")).not.toThrow();
    expect(() => assertion.toBeFalsy("d")).not.toThrow();
    expect(() => assertion.toBeFalsy("e")).not.toThrow();
    expect(() => assertion.toBeFalsy("f")).toThrow(/to be falsy/);
    expect(() => assertion.toBeFalsy("g")).toThrow(/to be falsy/);
    expect(() => assertion.toBeFalsy("h")).toThrow(/to be falsy/);

    expect(() => assertion.not.toBeFalsy("f")).not.toThrow();
    expect(() => assertion.not.toBeFalsy("a")).toThrow(/not to be falsy/);
  });

  test("negated chaining for toBeDefined, toBeNull, toBeTruthy, toBeFalsy", () => {
    const data = { a: undefined, b: null, c: 0, d: 1, e: false, f: true, g: "" };
    const assertion = assertJson(data);

    expect(() => assertion.not.toBeDefined("a")).not.toThrow();
    expect(() => assertion.not.toBeNull("d")).not.toThrow();
    expect(() => assertion.not.toBeTruthy("c")).not.toThrow();
    expect(() => assertion.not.toBeFalsy("f")).not.toThrow();

    expect(() => assertion.not.toBeDefined("d")).toThrow(/not to be defined/);
    expect(() => assertion.not.toBeNull("b")).toThrow(/not to be null/);
    expect(() => assertion.not.toBeTruthy("d")).toThrow(/not to be truthy/);
    expect(() => assertion.not.toBeFalsy("c")).toThrow(/not to be falsy/);
  });

  test("toBeType with all primitive types", () => {
    const data = {
      str: "abc",
      num: 123,
      bool: true,
      obj: {},
      arr: [],
      undef: undefined,
      nil: null,
    };
    const assertion = assertJson(data);

    expect(() => assertion.toBeType("str", "string")).not.toThrow();
    expect(() => assertion.toBeType("num", "number")).not.toThrow();
    expect(() => assertion.toBeType("bool", "boolean")).not.toThrow();
    expect(() => assertion.toBeType("obj", "object")).not.toThrow();
    expect(() => assertion.toBeType("arr", "array")).not.toThrow();
    expect(() => assertion.toBeType("undef", "undefined")).not.toThrow();
    expect(() => assertion.toBeType("nil", "null")).not.toThrow();
  });

  test("chaining with negation and soft mode", () => {
    const data = { a: undefined, b: null, c: 0, d: 1, e: false, f: true, g: "" };
    const assertion = assertJson(data, { soft: true });

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

  test("toBeType throws for unknown path", () => {
    const data = {};
    const assertion = assertJson(data);

    expect(() => assertion.toBeType("missing", "string")).toThrow(/to be type/);
    expect(() => assertion.not.toBeType("missing", "string")).not.toThrow();
  });

  test("toContainValue - arrays and strings", () => {
    const data = {
      arr: [1, 2, 3, { x: 5 }],
      str: "hello world",
      empty: [],
      notStr: 123,
    };
    const assertion = assertJson(data);

    expect(() => assertion.toContainValue("arr", 2)).not.toThrow();
    expect(() => assertion.toContainValue("arr", { x: 5 })).not.toThrow();
    expect(() => assertion.toContainValue("arr", 4)).toThrow(/to contain/);
    expect(() => assertion.toContainValue("str", "world")).not.toThrow();
    expect(() => assertion.toContainValue("str", "nope")).toThrow(/to contain/);
    expect(() => assertion.toContainValue("empty", 1)).toThrow(/to contain/);
    expect(() => assertion.toContainValue("notStr", 1)).toThrow(/to contain/);

    expect(() => assertion.not.toContainValue("arr", 4)).not.toThrow();
    expect(() => assertion.not.toContainValue("arr", 2)).toThrow(/not to contain/);
  });

  test("toContainValue - negation and edge types", () => {
    const data = {
      arr: [null, undefined, false, 0, "", "abc", { foo: 1 }],
      str: "abc123abc",
      nested: [[1], [2]],
      notArr: 42,
    };
    const assertion = assertJson(data);

    expect(() => assertion.toContainValue("arr", null)).not.toThrow();
    expect(() => assertion.toContainValue("arr", undefined)).not.toThrow();
    expect(() => assertion.toContainValue("arr", false)).not.toThrow();
    expect(() => assertion.toContainValue("arr", 0)).not.toThrow();
    expect(() => assertion.toContainValue("arr", "")).not.toThrow();
    expect(() => assertion.toContainValue("arr", { foo: 1 })).not.toThrow();
    expect(() => assertion.toContainValue("nested", [1])).not.toThrow();
    expect(() => assertion.toContainValue("str", "123")).not.toThrow();
    expect(() => assertion.not.toContainValue("arr", 999)).not.toThrow();
    expect(() => assertion.not.toContainValue("arr", null)).toThrow(/not to contain/);
    expect(() => assertion.toContainValue("notArr", 42)).toThrow(/to contain/);
  });

  test("toBeGreaterThan - numbers", () => {
    const data = { a: 5, b: 10, c: "notnum" };
    const assertion = assertJson(data);

    expect(() => assertion.toBeGreaterThan("b", 5)).not.toThrow();
    expect(() => assertion.toBeGreaterThan("a", 10)).toThrow(/to be greater than/);
    expect(() => assertion.toBeGreaterThan("c", 1)).toThrow(/to be greater than/);

    expect(() => assertion.not.toBeGreaterThan("a", 10)).not.toThrow();
    expect(() => assertion.not.toBeGreaterThan("b", 5)).toThrow(/not to be greater than/);
  });

  test("toBeGreaterThan - negation and non-numeric", () => {
    const data = { a: 5, b: 0, c: -10, d: "10", e: null, f: undefined };
    const assertion = assertJson(data);

    expect(() => assertion.toBeGreaterThan("a", 4)).not.toThrow();
    expect(() => assertion.toBeGreaterThan("b", -1)).not.toThrow();
    expect(() => assertion.toBeGreaterThan("c", -5)).toThrow(/to be greater than/);
    expect(() => assertion.toBeGreaterThan("d", 5)).toThrow(/to be greater than/);
    expect(() => assertion.toBeGreaterThan("e", 0)).toThrow(/to be greater than/);
    expect(() => assertion.toBeGreaterThan("f", 0)).toThrow(/to be greater than/);

    expect(() => assertion.not.toBeGreaterThan("a", 4)).toThrow(/not to be greater than/);
    expect(() => assertion.not.toBeGreaterThan("c", -5)).not.toThrow();
  });

  test("toBeLessThan - numbers", () => {
    const data = { a: 5, b: 10, c: "notnum" };
    const assertion = assertJson(data);

    expect(() => assertion.toBeLessThan("a", 10)).not.toThrow();
    expect(() => assertion.toBeLessThan("b", 5)).toThrow(/to be less than/);
    expect(() => assertion.toBeLessThan("c", 1)).toThrow(/to be less than/);

    expect(() => assertion.not.toBeLessThan("b", 5)).not.toThrow();
    expect(() => assertion.not.toBeLessThan("a", 10)).toThrow(/not to be less than/);
  });

  test("toBeLessThan - negation and non-numeric", () => {
    const data = { a: 5, b: 0, c: -10, d: "10", e: null, f: undefined };
    const assertion = assertJson(data);

    expect(() => assertion.toBeLessThan("c", -5)).not.toThrow();
    expect(() => assertion.toBeLessThan("b", 1)).not.toThrow();
    expect(() => assertion.toBeLessThan("a", 2)).toThrow(/to be less than/);
    expect(() => assertion.toBeLessThan("d", 5)).toThrow(/to be less than/);
    expect(() => assertion.toBeLessThan("e", 0)).toThrow(/to be less than/);
    expect(() => assertion.toBeLessThan("f", 0)).toThrow(/to be less than/);

    expect(() => assertion.not.toBeLessThan("c", -5)).toThrow(/not to be less than/);
    expect(() => assertion.not.toBeLessThan("a", 2)).not.toThrow();
  });

  test("toBeOneOf - matches any in list", () => {
    const data = { a: 1, b: "foo", c: { x: 1 }, d: 5 };
    const assertion = assertJson(data);

    expect(() => assertion.toBeOneOf("a", [1, 2, 3])).not.toThrow();
    expect(() => assertion.toBeOneOf("b", ["bar", "foo"])).not.toThrow();
    expect(() => assertion.toBeOneOf("c", [{ x: 1 }, { y: 2 }])).not.toThrow();
    expect(() => assertion.toBeOneOf("d", [1, 2, 3])).toThrow(/to be one of/);

    expect(() => assertion.not.toBeOneOf("d", [1, 2, 3])).not.toThrow();
    expect(() => assertion.not.toBeOneOf("a", [1, 2, 3])).toThrow(/not to be one of/);
  });

  test("toBeOneOf - negation, deep, and primitive values", () => {
    const data = {
      a: 1,
      b: "foo",
      c: { x: 1 },
      d: [1, 2],
      e: true,
      f: null,
      g: undefined,
      h: 0,
    };
    const assertion = assertJson(data);

    expect(() => assertion.toBeOneOf("a", [1, 2, 3])).not.toThrow();
    expect(() => assertion.toBeOneOf("b", ["foo", "bar"])).not.toThrow();
    expect(() => assertion.toBeOneOf("c", [{ x: 1 }, { y: 2 }])).not.toThrow();
    expect(() =>
      assertion.toBeOneOf("d", [
        [1, 2],
        [2, 3],
      ]),
    ).not.toThrow();
    expect(() => assertion.toBeOneOf("e", [false, true])).not.toThrow();
    expect(() => assertion.toBeOneOf("f", [null, 0])).not.toThrow();
    expect(() => assertion.toBeOneOf("g", [undefined, null])).not.toThrow();
    expect(() => assertion.toBeOneOf("h", [1, 2, 3])).toThrow(/to be one of/);

    expect(() => assertion.not.toBeOneOf("h", [1, 2, 3])).not.toThrow();
    expect(() => assertion.not.toBeOneOf("a", [1, 2, 3])).toThrow(/not to be one of/);
    expect(() => assertion.not.toBeOneOf("c", [{ x: 1 }, { y: 2 }])).toThrow(/not to be one of/);
    expect(() => assertion.not.toBeOneOf("g", [undefined, null])).toThrow(/not to be one of/);
  });

  test("toMatchValue with caseInsensitive option", () => {
    // Arrange
    const data = { greeting: "Hello World", name: "John Doe" };
    const assertion = assertJson(data);

    // Act & Assert
    expect(() => assertion.toMatchValue("greeting", "hello world", { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.toMatchValue("greeting", "HELLO WORLD", { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.toMatchValue("name", "john doe", { caseInsensitive: true })).not.toThrow();

    // Should fail without caseInsensitive
    expect(() => assertion.toMatchValue("greeting", "hello world")).toThrow(/to equal/);

    // Should fail even with caseInsensitive when strings don't match
    expect(() => assertion.toMatchValue("greeting", "hi world", { caseInsensitive: true })).toThrow(/to equal/);

    // Should correctly handle negation
    expect(() => assertion.not.toMatchValue("greeting", "hi world", { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.not.toMatchValue("greeting", "hello world", { caseInsensitive: true })).toThrow(
      /not to equal/,
    );
  });

  test("toMatchValue caseInsensitive only applies to strings", () => {
    // Arrange
    const data = {
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      obj: { a: 1 },
    };
    const assertion = assertJson(data);

    // Act & Assert - caseInsensitive should be ignored for non-string values
    expect(() => assertion.toMatchValue("num", 42, { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.toMatchValue("bool", true, { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.toMatchValue("arr", [1, 2, 3], { caseInsensitive: true })).not.toThrow();
    expect(() => assertion.toMatchValue("obj", { a: 1 }, { caseInsensitive: true })).not.toThrow();
  });
});
