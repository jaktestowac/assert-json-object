# assert-json-object

🧪 Fluent, chainable assertions for JSON structures with dot-path access.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- Assert deeply nested JSON properties using dot-paths (e.g. `"foo.bar[0].baz"`)
- Type and value assertions
- Predicate-based assertions
- Negation (`not`) support
- **Soft assertion** mode: collect all errors instead of throwing immediately
- TypeScript support
- 🪶 Zero dependencies

---

## 📦 Install

```bash
npm install assert-json-object
```

## 🚀 Usage

```typescript
import { assertJson } from "assert-json-object";

const data = {
  user: {
    name: "Alice",
    age: 30,
    tags: ["admin", "editor"],
    address: { city: "NYC" },
  },
};

const assertion = assertJson(data);

assertion
  .toHaveKey("user.name")
  .toBeType("user.age", "number")
  .toMatchValue("user.address.city", "NYC")
  .not.toHaveKey("user.password");
// No error thrown
```

### Soft Assertion Mode

Collect all assertion errors and inspect them later:

```typescript
import { assertJson } from "assert-json-object";

const data = {
  user: {
    name: "Alice",
    age: 30,
    tags: ["admin", "editor"],
    address: { city: "NYC" },
  },
};

const assertion = assertJson(data, { soft: true });

assertion
  .toHaveKey("user.name")
  .toBeType("user.age", "string") // error
  .toMatchValue("user.address.city", "LA") // error
  .not.toHaveKey("user.name"); // error

console.log(assertion.getErrors());

// Output: Array of errors
// [
//   Error: Expected 'user.age' to be type 'string', but got 'number',
//   Error: Expected value at 'user.address.city' to equal "LA", but got "NYC",
//   Error: Expected key 'user.name' not to exist,
// ]
```

---

## ⚙️ API

### `assertJson(data, options?)`

- `data`: The JSON object to assert on.
- `options.soft` (optional): If `true`, enables soft assertion mode.

Returns a `JsonAssertion` instance.

### Assertion Methods

| Method                                                     | Description                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `.toHaveKey(path)`                                         | Asserts that the given dot-path exists.                                                                                 |
| `.toBeType(path, type)`                                    | Asserts the value at path is of the given type (`string`, `number`, `boolean`, `object`, `array`, `undefined`, `null`). |
| `.toMatchValue(path, expected)`                            | Asserts the value at path equals the expected value (deep equality).                                                    |
| `.toMatchValue(path, expected, { caseInsensitive: true })` | Asserts the value at path equals the expected value, ignoring case for strings.                                         |
| `.toSatisfy(path, predicate)`                              | Asserts the value at path satisfies the predicate function.                                                             |
| `.not`                                                     | Negates the next assertion.                                                                                             |
| `.getErrors()`                                             | Returns an array of errors (only in soft mode).                                                                         |

---

## ✅ Examples

### Basic

```typescript
assertJson({ foo: 1 }).toHaveKey("foo").toBeType("foo", "number");
// No error thrown
```

### Negation

```typescript
assertJson({ foo: 1 }).not.toHaveKey("bar");
// No error thrown

assertJson({ foo: 1 }).not.toHaveKey("foo");
// Throws: Error: Expected key 'foo' not to exist
```

### Array Indexing

```typescript
const data = { arr: [{ id: 1 }, { id: 2 }] };
assertJson(data).toHaveKey("arr[1].id").toMatchValue("arr[0].id", 1);
// No error thrown

assertJson(data).toHaveKey("arr[2].id");
// Throws: Error: Expected key 'arr[2].id' to exist
```

### Soft Assertion

```typescript
const assertion = assertJson({ foo: 1 }, { soft: true });
assertion.toHaveKey("foo").toBeType("foo", "string"); // error

console.log(assertion.getErrors().length);
// Output: 1

console.log(assertion.getErrors()[0].message);
// Output: Expected 'foo' to be type 'string', but got 'number'
```

### Case Insensitive Value Comparison

```typescript
const data = { greeting: "Hello World" };
assertJson(data).toMatchValue("greeting", "hello world", { caseInsensitive: true });
// No error thrown

assertJson(data).toMatchValue("greeting", "hello world");
// Throws: Error: Expected value at 'greeting' to equal "hello world", but got "Hello World"
```

---

## 🧩 More Examples

### Type and Value Checks

```typescript
const data = { a: 123, b: "hello", c: null, d: [1, 2], e: { x: 1 } };

assertJson(data)
  .toBeType("a", "number")
  .toBeType("b", "string")
  .toBeNull("c")
  .toBeType("d", "array")
  .toBeType("e", "object")
  .toBeDefined("a")
  .toBeTruthy("b")
  .toBeFalsy("c");
```

### Array and String Containment

```typescript
const data = { arr: [1, 2, 3], str: "hello world" };

assertJson(data).toContainValue("arr", 2).toContainValue("str", "world").not.toContainValue("arr", 5);
```

### Numeric Comparisons

```typescript
const data = { score: 42 };

assertJson(data)
  .toBeGreaterThan("score", 10)
  .toBeLessThan("score", 100)
  .not.toBeGreaterThan("score", 100)
  .not.toBeLessThan("score", 10);
```

### One Of / Enum

```typescript
const data = { status: "pending" };

assertJson(data).toBeOneOf("status", ["pending", "done", "failed"]).not.toBeOneOf("status", ["archived"]);
```

### Custom Predicate

```typescript
const data = { value: 15 };

assertJson(data)
  .toSatisfy("value", (v) => typeof v === "number" && v % 5 === 0)
  .not.toSatisfy("value", (v) => v < 0);
```

---

## 🔎 More Matchers

| Method                                   | Description                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `.toHaveKey(path)`                       | Asserts that the given dot-path exists.                                                                                 |
| `.not.toHaveKey(path)`                   | Asserts that the given dot-path does NOT exist.                                                                         |
| `.toBeType(path, type)`                  | Asserts the value at path is of the given type (`string`, `number`, `boolean`, `object`, `array`, `undefined`, `null`). |
| `.toBeDefined(path)`                     | Asserts the value at path is defined (not `undefined`).                                                                 |
| `.toBeNull(path)`                        | Asserts the value at path is `null`.                                                                                    |
| `.toBeTruthy(path)`                      | Asserts the value at path is truthy.                                                                                    |
| `.toBeFalsy(path)`                       | Asserts the value at path is falsy.                                                                                     |
| `.toMatchValue(path, expected)`          | Asserts the value at path equals the expected value (deep equality).                                                    |
| `.toMatchValue(path, expected, options)` | Asserts the value at path equals the expected value with options (`{ caseInsensitive: true }`).                         |
| `.toContainValue(path, value)`           | Asserts the value at path (array or string) contains the given value.                                                   |
| `.toBeGreaterThan(path, number)`         | Asserts the value at path is a number greater than the given number.                                                    |
| `.toBeLessThan(path, number)`            | Asserts the value at path is a number less than the given number.                                                       |
| `.toBeOneOf(path, [values])`             | Asserts the value at path matches any value in the provided array (deep equality).                                      |
| `.toSatisfy(path, predicate)`            | Asserts the value at path satisfies the predicate function.                                                             |
| `.not`                                   | Negates the next assertion.                                                                                             |
| `.getErrors()`                           | Returns an array of errors (only in soft mode).                                                                         |

---

## 📄 License

MIT © jaktestowac.pl

Powered by [jaktestowac.pl](https://www.jaktestowac.pl/) team!

🌐 Check out **[GitHub](https://github.com/jaktestowac) profile** for more open-source projects and resources.
