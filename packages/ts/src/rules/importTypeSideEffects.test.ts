import rule from "./importTypeSideEffects.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { type A } from "mod";
`,
			snapshot: `
import { type A } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use a top-level \`import type\` instead of inline type qualifiers on every specifier.
`,
		},
		{
			code: `
import { type A, type B } from "mod";
`,
			snapshot: `
import { type A, type B } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use a top-level \`import type\` instead of inline type qualifiers on every specifier.
`,
		},
		{
			code: `
import { type A, type B, type C } from "mod";
`,
			snapshot: `
import { type A, type B, type C } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use a top-level \`import type\` instead of inline type qualifiers on every specifier.
`,
		},
	],
	valid: [
		// Top-level type import is correct
		`import type { A, B } from "mod";`,
		// Mixed type and value imports are allowed
		`import { type A, value } from "mod";`,
		`import { value, type B } from "mod";`,
		// Value-only imports
		`import { value } from "mod";`,
		`import { a, b } from "mod";`,
		// Default import with inline types is allowed
		`import Default, { type A } from "mod";`,
		// Side-effect imports
		`import "mod";`,
		// Namespace imports
		`import * as mod from "mod";`,
	],
});
