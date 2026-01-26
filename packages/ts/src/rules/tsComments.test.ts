import { ruleTester } from "./ruleTester.ts";
import rule from "./tsComments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `// @ts-ignore
const value: string = 123;`,
			snapshot: `// @ts-ignore
~~~~~~~~~~~~~
Use @ts-expect-error instead of @ts-ignore.
const value: string = 123;`,
		},
		{
			code: `///@ts-ignore
const value: string = 123;`,
			snapshot: `///@ts-ignore
~~~~~~~~~~~~~
Use @ts-expect-error instead of @ts-ignore.
const value: string = 123;`,
		},
		{
			code: `// @ts-ignore: some reason
const value: string = 123;`,
			snapshot: `// @ts-ignore: some reason
~~~~~~~~~~~~~~~~~~~~~~~~~~
Use @ts-expect-error instead of @ts-ignore.
const value: string = 123;`,
		},
		{
			code: `// @ts-nocheck
const value = 1;`,
			snapshot: `// @ts-nocheck
~~~~~~~~~~~~~~
Do not use @ts-nocheck to disable type checking.
const value = 1;`,
		},
		{
			code: `/* @ts-ignore */
const value: string = 123;`,
			snapshot: `/* @ts-ignore */
~~~~~~~~~~~~~~~~
Use @ts-expect-error instead of @ts-ignore.
const value: string = 123;`,
		},
	],
	valid: [
		`// @ts-expect-error
const value: string = 123;`,
		`// @ts-expect-error: some reason
const value: string = 123;`,
		`// @ts-check
const value = 1;`,
		`// Regular comment`,
		`const value = 1;`,
		`// This is not a @ts-ignore directive`,
	],
});
