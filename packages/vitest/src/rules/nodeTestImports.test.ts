import { ruleTester } from "../ruleTester.ts";
import rule from "./nodeTestImports.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { describe } from "node:test";
`,
			output: `
import { describe } from "vitest";
`,
			snapshot: `
import { describe } from "node:test";
                         ~~~~~~~~~~~
                         This \`node:test\` import will not work when using Vitest.
`,
		},
		{
			code: `
import * as test from "node:test";
`,
			output: `
import * as test from "vitest";
`,
			snapshot: `
import * as test from "node:test";
                      ~~~~~~~~~~~
                      This \`node:test\` import will not work when using Vitest.
`,
		},
	],
	valid: [
		`import { describe } from "other";`,
		`import { describe } from "vitest";`,
		`import * as vitest from "vitest";`,
	],
});
