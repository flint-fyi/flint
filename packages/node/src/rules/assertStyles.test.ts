import rule from "./assertStyles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: unknown;
import assert from "node:assert";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import assert from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import assert from "node:assert/strict";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import assert from "node:assert/strict";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import assert from "assert";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import assert from "assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import assert from "assert/strict";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import assert from "assert/strict";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import { strict as assert } from "node:assert";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import { strict as assert } from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import * as assert from "node:assert";
assert(value);
`,
			snapshot: `
declare const value: unknown;
import * as assert from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare const value: unknown;
import assert = require("node:assert");
assert(value);
`,
			snapshot: `
declare const value: unknown;
import assert = require("node:assert");
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
declare function divide(a: number, b: number): number;
import assert from "node:assert";
assert(divide(10, 2) === 5);
`,
			snapshot: `
declare function divide(a: number, b: number): number;
import assert from "node:assert";
assert(divide(10, 2) === 5);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
	],
	valid: [
		`
declare const value: unknown;
import assert from "node:assert";
assert.ok(value);
`,
		`
declare const value: unknown;
import assert from "node:assert/strict";
assert.ok(value);
`,
		`
declare const value: unknown;
import assert from "assert";
assert.ok(value);
`,
		`
declare const value: unknown;
import assert from "assert/strict";
assert.ok(value);
`,
		`
declare const value: unknown;
import { strict as assert } from "node:assert";
assert.ok(value);
`,
		`
declare const value: unknown;
import * as assert from "node:assert";
assert.ok(value);
`,
		`
declare const actual: unknown;
declare const expected: unknown;
import assert from "node:assert";
assert.strictEqual(actual, expected);
`,
		`
declare const actual: unknown;
declare const expected: unknown;
import assert from "node:assert";
assert.deepStrictEqual(actual, expected);
`,
		`
declare const value: unknown;
const assert = require("node:assert");
assert.ok(value);
`,
		{
			code: `
declare const value: unknown;
import assert from "./custom-assert";
assert(value);
`,
			files: {
				"custom-assert.ts": `export default function assert(value?: unknown) {}`,
			},
		},
		`
declare const value: unknown;
import { ok } from "node:assert";
ok(value);
`,
		`
declare function assert(...args: unknown[]): void;
declare const value: unknown;
assert(value);
`,
	],
});
