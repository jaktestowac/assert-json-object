import { getValueAtPath } from "./utils";

/**
 * Supported primitive types for type assertions.
 */
type PrimitiveType = "string" | "number" | "boolean" | "object" | "array" | "undefined" | "null";

/**
 * Options for soft assertion mode.
 */
type SoftOptions = { soft?: boolean; maxErrors?: number };

/**
 * Options for value matching.
 */
type MatchValueOptions = {
  caseInsensitive?: boolean;
};

/**
 * Fluent assertion class for JSON objects.
 * Supports dot-path access, negation, and soft assertion mode.
 */
export class JsonAssertion {
  private negated = false;
  private soft = false;
  private errors: Error[] = [];
  private maxErrors?: number;

  /**
   * @param target The JSON object to assert on.
   * @param opts Optional options. If `soft` is true, enables soft assertion mode.
   * @param sharedErrors Internal: shared error array for soft mode chaining.
   * @param sharedMaxErrors Internal: shared maxErrors for soft mode chaining.
   */
  constructor(
    private target: Record<string, any>,
    opts?: SoftOptions,
    sharedErrors?: Error[],
    sharedMaxErrors?: number,
  ) {
    if (opts?.soft) this.soft = true;
    if (this.soft && sharedErrors) {
      this.errors = sharedErrors;
    }
    if (this.soft) {
      this.maxErrors = sharedMaxErrors ?? opts?.maxErrors;
    }
  }

  /**
   * Negates the next assertion.
   * @returns A new JsonAssertion instance with negation toggled.
   */
  get not() {
    // In soft mode, share the same error array and maxErrors
    const clone = new JsonAssertion(
      this.target,
      { soft: this.soft, maxErrors: this.maxErrors },
      this.soft ? this.errors : undefined,
      this.soft ? this.maxErrors : undefined,
    );
    clone.negated = !this.negated;
    return clone;
  }

  /**
   * Returns true if soft assertion mode is enabled.
   */
  get isSoft() {
    return this.soft;
  }

  /**
   * Returns an array of collected errors (only in soft mode).
   */
  getErrors() {
    return [...this.errors];
  }

  private canCollectError() {
    return !this.soft || this.maxErrors === undefined || this.errors.length < this.maxErrors;
  }

  private handleError(err: Error) {
    if (this.soft) {
      if (this.maxErrors !== undefined && this.errors.length >= this.maxErrors) {
        throw new Error(
          `Maximum number of errors (${this.maxErrors}) reached in soft mode. Further assertions throw immediately.`,
        );
      }
      this.errors.push(err);
      return this;
    }
    throw err;
  }

  /**
   * Asserts that the given dot-path exists in the JSON object.
   * @param path Dot-path string (e.g. "foo.bar[0].baz")
   * .toHaveKey(path): Asserts key exists at given path
   * .not.toHaveKey(path): Asserts key does NOT exist
   */
  toHaveKey(path: string) {
    const value = getValueAtPath(this.target, path);
    const exists = value !== undefined;

    if (exists === this.negated) {
      const err = new Error(`Expected key '${path}' ${this.negated ? "not " : ""}to exist`);
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path is of the specified primitive type.
   * @param path Dot-path string
   * @param type Expected primitive type: "string", "number", "boolean", "object", "array", "null", "undefined"
   */
  toBeType(path: string, type: PrimitiveType) {
    const value = getValueAtPath(this.target, path);

    let actualType: PrimitiveType =
      value === null ? "null" : Array.isArray(value) ? "array" : (typeof value as PrimitiveType);

    const match = actualType === type;

    if (match === this.negated) {
      const err = new Error(
        `Expected '${path}' ${this.negated ? "not " : ""}to be type '${type}', but got '${actualType}'`,
      );
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path is defined (not undefined).
   * @param path Dot-path string
   */
  toBeDefined(path: string) {
    const value = getValueAtPath(this.target, path);
    const isDefined = value !== undefined;

    if (isDefined === this.negated) {
      const err = new Error(`Expected '${path}' ${this.negated ? "not " : ""}to be defined`);
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path is null.
   * @param path Dot-path string
   */
  toBeNull(path: string) {
    const value = getValueAtPath(this.target, path);
    const isNull = value === null;

    if (isNull === this.negated) {
      const err = new Error(`Expected '${path}' ${this.negated ? "not " : ""}to be null`);
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path is truthy.
   * @param path Dot-path string
   */
  toBeTruthy(path: string) {
    const value = getValueAtPath(this.target, path);
    const isTruthy = !!value;

    if (isTruthy === this.negated) {
      const err = new Error(`Expected '${path}' ${this.negated ? "not " : ""}to be truthy`);
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path is falsy.
   * @param path Dot-path string
   */
  toBeFalsy(path: string) {
    const value = getValueAtPath(this.target, path);
    const isFalsy = !value;

    if (isFalsy === this.negated) {
      const err = new Error(`Expected '${path}' ${this.negated ? "not " : ""}to be falsy`);
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path equals the expected value (deep equality).
   * @param path Dot-path string
   * @param expected Expected value
   * @param options Optional configuration for value matching
   * .toMatchValue(path, value): Asserts value is exactly equal (deep)
   * .toMatchValue(path, value, { caseInsensitive: true }): For strings, ignores case
   */
  toMatchValue(path: string, expected: unknown, options?: MatchValueOptions) {
    const value = getValueAtPath(this.target, path);
    let match = false;

    // Handle case insensitive string comparison
    if (options?.caseInsensitive && typeof value === "string" && typeof expected === "string") {
      match = value.toLowerCase() === expected.toLowerCase();
    } else {
      // Default deep equality comparison
      match = JSON.stringify(value) === JSON.stringify(expected);
    }

    if (match === this.negated) {
      const err = new Error(
        `Expected value at '${path}' ${this.negated ? "not " : ""}to equal ${JSON.stringify(expected)}${options?.caseInsensitive ? " (case insensitive)" : ""}, but got ${JSON.stringify(value)}`,
      );
      return this.handleError(err);
    }

    return this;
  }

  /**
   * Asserts that the value at the given path contains the expected value (for arrays or strings).
   * @param path Dot-path string
   * @param expected Expected value to be contained
   * .toContainValue(path, value): Works for arrays or strings
   */
  toContainValue(path: string, expected: unknown) {
    const value = getValueAtPath(this.target, path);
    let contains = false;
    if (Array.isArray(value)) {
      contains = value.some((v) => JSON.stringify(v) === JSON.stringify(expected));
    } else if (typeof value === "string") {
      contains = value.includes(String(expected));
    }
    if (contains === this.negated) {
      const err = new Error(
        `Expected value at '${path}' ${this.negated ? "not " : ""}to contain ${JSON.stringify(expected)}, but got ${JSON.stringify(value)}`,
      );
      return this.handleError(err);
    }
    return this;
  }

  /**
   * Asserts that the value at the given path is greater than the given number.
   * @param path Dot-path string
   * @param num Number to compare
   * .toBeGreaterThan(path, number): Only for numeric values
   */
  toBeGreaterThan(path: string, num: number) {
    const value = getValueAtPath(this.target, path);
    const isGreater = typeof value === "number" && value > num;
    if (isGreater === this.negated) {
      const err = new Error(
        `Expected value at '${path}' ${this.negated ? "not " : ""}to be greater than ${num}, but got ${JSON.stringify(value)}`,
      );
      return this.handleError(err);
    }
    return this;
  }

  /**
   * Asserts that the value at the given path is less than the given number.
   * @param path Dot-path string
   * @param num Number to compare
   * .toBeLessThan(path, number): Only for numeric values
   */
  toBeLessThan(path: string, num: number) {
    const value = getValueAtPath(this.target, path);
    const isLess = typeof value === "number" && value < num;
    if (isLess === this.negated) {
      const err = new Error(
        `Expected value at '${path}' ${this.negated ? "not " : ""}to be less than ${num}, but got ${JSON.stringify(value)}`,
      );
      return this.handleError(err);
    }
    return this;
  }

  /**
   * Asserts that the value at the given path matches any value in the provided list.
   * @param path Dot-path string
   * @param values Array of allowed values
   * .toBeOneOf(path, [values]): Assert that value matches any in a list
   */
  toBeOneOf(path: string, values: unknown[]) {
    const value = getValueAtPath(this.target, path);
    const found = values.some((v) => JSON.stringify(v) === JSON.stringify(value));
    if (found === this.negated) {
      const err = new Error(
        `Expected value at '${path}' ${this.negated ? "not " : ""}to be one of ${JSON.stringify(values)}, but got ${JSON.stringify(value)}`,
      );
      return this.handleError(err);
    }
    return this;
  }

  /**
   * Asserts that the value at the given path satisfies the provided predicate function.
   * @param path Dot-path string
   * @param predicate Predicate function to test the value
   * .toSatisfy(path, fn): Apply any custom predicate on a value
   */
  toSatisfy<T = unknown>(path: string, predicate: (val: T) => boolean) {
    const value = getValueAtPath(this.target, path);
    let result: boolean;
    try {
      result = predicate(value);
    } catch (err) {
      // If the predicate throws, propagate the error (do not collect in soft mode)
      throw err;
    }

    if (result === this.negated) {
      const err = new Error(`Expected '${path}' ${this.negated ? "not " : ""}to satisfy predicate.`);
      return this.handleError(err);
    }

    return this;
  }
}

/**
 * Entry point for JSON assertions.
 * @param data The JSON object to assert on.
 * @param opts Optional options. If `soft` is true, enables soft assertion mode.
 * @returns JsonAssertion instance
 */
export function assertJson(data: Record<string, any>, opts?: SoftOptions) {
  return new JsonAssertion(data, opts);
}

export function assertJsonSoft(data: Record<string, any>, opts?: Omit<SoftOptions, "soft">) {
  // This is a soft assertion function that always enables soft mode.
  return new JsonAssertion(data, { ...opts, soft: true });
}
