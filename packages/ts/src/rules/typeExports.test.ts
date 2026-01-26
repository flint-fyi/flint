import rule from "./typeExports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import type { User } from "./types";
export { User };
`,
			snapshot: `
import type { User } from "./types";
export { User };
~~~~~~~~~~~~~~~~
Use 'export type' for type-only exports.
`,
		},
		{
			code: `
import type { User, Post } from "./types";
export { User, Post };
`,
			snapshot: `
import type { User, Post } from "./types";
export { User, Post };
~~~~~~~~~~~~~~~~~~~~~~
Use 'export type' for type-only exports.
`,
		},
		{
			code: `
import { type User } from "./types";
export { User };
`,
			snapshot: `
import { type User } from "./types";
export { User };
~~~~~~~~~~~~~~~~
Use 'export type' for type-only exports.
`,
		},
	],
	valid: [
		`import type { User } from "./types";
export type { User };`,
		`import { User } from "./types";
export { User };`,
		`import { value } from "./module";
export { value };`,
		`import type { User } from "./types";
import { createUser } from "./module";
export { createUser };`,
		`export type { User } from "./types";`,
		`export { value } from "./module";`,
	],
});
