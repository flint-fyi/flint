import rule from "./emptyObjectTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Empty = {};
`,
			snapshot: `
type Empty = {};
             ~~
             The \`{}\` type means 'any non-nullish value' and is often used incorrectly.
`,
		},
		{
			code: `
interface Empty {}
`,
			snapshot: `
interface Empty {}
~~~~~~~~~~~~~~~~~~
Empty interfaces are often used incorrectly and should be avoided.
`,
		},
		{
			code: `
let value: {};
`,
			snapshot: `
let value: {};
           ~~
           The \`{}\` type means 'any non-nullish value' and is often used incorrectly.
`,
		},
		{
			code: `
function foo(param: {}) {}
`,
			snapshot: `
function foo(param: {}) {}
                    ~~
                    The \`{}\` type means 'any non-nullish value' and is often used incorrectly.
`,
		},
		{
			code: `
const fn: () => {} = () => ({});
`,
			snapshot: `
const fn: () => {} = () => ({});
                ~~
                The \`{}\` type means 'any non-nullish value' and is often used incorrectly.
`,
		},
		{
			code: `
interface Foo extends Bar {}
`,
			snapshot: `
interface Foo extends Bar {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Empty interfaces are often used incorrectly and should be avoided.
`,
		},
	],
	valid: [
		`type NonNullable<T> = T & {};`,
		`type HasMembers = { foo: string };`,
		`interface HasMembers { foo: string }`,
		`interface ExtendsMultiple extends Foo, Bar {}`,
		`let value: object;`,
		`let value: unknown;`,
		`type Mapped = { [K in keyof T]: T[K] };`,
	],
});
