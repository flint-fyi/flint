import rule from "./assertStrict.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import assert from "assert";
`,
			snapshot: `
import assert from "assert";
                   ~~~~~~~~
                   Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
		{
			code: `
import assert from "node:assert";
`,
			snapshot: `
import assert from "node:assert";
                   ~~~~~~~~~~~~~
                   Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
		{
			code: `
import { deepEqual } from "assert";
`,
			snapshot: `
import { deepEqual } from "assert";
                          ~~~~~~~~
                          Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
		{
			code: `
import { deepEqual } from "node:assert";
`,
			snapshot: `
import { deepEqual } from "node:assert";
                          ~~~~~~~~~~~~~
                          Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
		{
			code: `
import assert = require("assert");
`,
			snapshot: `
import assert = require("assert");
                        ~~~~~~~~
                        Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
		{
			code: `
import assert = require("node:assert");
`,
			snapshot: `
import assert = require("node:assert");
                        ~~~~~~~~~~~~~
                        Prefer importing from \`node:assert/strict\` or using \`{ strict as assert }\` from \`node:assert\`.
`,
		},
	],
	valid: [
		`import assert from "assert/strict";`,
		`import assert from "node:assert/strict";`,
		`import { strict as assert } from "assert";`,
		`import { strict as assert } from "node:assert";`,
		`import { strict } from "node:assert";`,
		`import { strict, deepEqual } from "node:assert";`,
		`import { deepEqual } from "./custom-assert";`,
		`const assert = require("node:assert/strict");`,
	],
});
