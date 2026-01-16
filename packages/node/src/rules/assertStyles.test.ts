import rule from "./assertStyles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import assert from "node:assert";
assert(value);
`,
			snapshot: `
import assert from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import assert from "node:assert/strict";
assert(value);
`,
			snapshot: `
import assert from "node:assert/strict";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import assert from "assert";
assert(value);
`,
			snapshot: `
import assert from "assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import assert from "assert/strict";
assert(value);
`,
			snapshot: `
import assert from "assert/strict";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import { strict as assert } from "node:assert";
assert(value);
`,
			snapshot: `
import { strict as assert } from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import * as assert from "node:assert";
assert(value);
`,
			snapshot: `
import * as assert from "node:assert";
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import assert = require("node:assert");
assert(value);
`,
			snapshot: `
import assert = require("node:assert");
assert(value);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
		{
			code: `
import assert from "node:assert";
assert(divide(10, 2) === 5);
`,
			snapshot: `
import assert from "node:assert";
assert(divide(10, 2) === 5);
~~~~~~
Prefer \`assert.ok()\` over \`assert()\` for explicit intent and better readability.
`,
		},
	],
	valid: [
		`
import assert from "node:assert";
assert.ok(value);
`,
		`
import assert from "node:assert/strict";
assert.ok(value);
`,
		`
import assert from "assert";
assert.ok(value);
`,
		`
import assert from "assert/strict";
assert.ok(value);
`,
		`
import { strict as assert } from "node:assert";
assert.ok(value);
`,
		`
import * as assert from "node:assert";
assert.ok(value);
`,
		`
import assert from "node:assert";
assert.strictEqual(actual, expected);
`,
		`
import assert from "node:assert";
assert.deepStrictEqual(actual, expected);
`,
		`
const assert = require("node:assert");
assert.ok(value);
`,
		`
import assert from "./custom-assert";
assert(value);
`,
		`
import { ok } from "node:assert";
ok(value);
`,
		`
declare function assert(...args: unknown[]): void;
assert(value);
`,
	],
});
