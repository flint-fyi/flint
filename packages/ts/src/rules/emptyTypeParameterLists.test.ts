import rule from "./emptyTypeParameterLists.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Foo<> = string;
`,
			snapshot: `
type Foo<> = string;
~~~~~~~~~~~~~~~~~~~~
Empty type parameter lists are unnecessary.
`,
		},
		{
			code: `
interface Bar<> {}
`,
			snapshot: `
interface Bar<> {}
~~~~~~~~~~~~~~~~~~
Empty type parameter lists are unnecessary.
`,
		},
		{
			code: `
type Generic<> = { value: number };
`,
			snapshot: `
type Generic<> = { value: number };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Empty type parameter lists are unnecessary.
`,
		},
		{
			code: `
interface Empty<> extends Base {}
`,
			snapshot: `
interface Empty<> extends Base {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Empty type parameter lists are unnecessary.
`,
		},
	],
	valid: [
		`type Foo = string;`,
		`interface Bar {}`,
		`type Generic<T> = T;`,
		`interface Container<T> { value: T }`,
		`type Multi<T, U> = [T, U];`,
		`function foo<T>(x: T): T { return x; }`,
		`class Container<T> { value: T; }`,
	],
});
