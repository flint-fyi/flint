import rule from "./nonNullAssertedOptionalChains.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
foo?.bar!;
`,
			snapshot: `
foo?.bar!;
~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
foo?.bar;
`,
				},
			],
		},
		{
			code: `
foo?.["bar"]!;
`,
			snapshot: `
foo?.["bar"]!;
~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
foo?.["bar"];
`,
				},
			],
		},
		{
			code: `
foo?.bar()!;
`,
			snapshot: `
foo?.bar()!;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
foo?.bar();
`,
				},
			],
		},
		{
			code: `
foo.bar?.()!;
`,
			snapshot: `
foo.bar?.()!;
~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
foo.bar?.();
`,
				},
			],
		},
		{
			code: `
(foo?.bar)!;
`,
			snapshot: `
(foo?.bar)!;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar);
`,
				},
			],
		},
		{
			code: `
(foo?.bar)!.baz;
`,
			snapshot: `
(foo?.bar)!.baz;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar).baz;
`,
				},
			],
		},
		{
			code: `
(foo?.bar)!();
`,
			snapshot: `
(foo?.bar)!();
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar)();
`,
				},
			],
		},
		{
			code: `
(foo?.bar)!().baz;
`,
			snapshot: `
(foo?.bar)!().baz;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar)().baz;
`,
				},
			],
		},
		{
			code: `
(foo?.bar!)
`,
			snapshot: `
(foo?.bar!)
 ~~~~~~~~~
 Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar)
`,
				},
			],
		},
		{
			code: `
(foo?.bar!)();
`,
			snapshot: `
(foo?.bar!)();
 ~~~~~~~~~
 Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
(foo?.bar)();
`,
				},
			],
		},
		{
			code: `
object?.property.value!;
`,
			snapshot: `
object?.property.value!;
~~~~~~~~~~~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
object?.property.value;
`,
				},
			],
		},
		{
			code: `
object?.method().value!;
`,
			snapshot: `
object?.method().value!;
~~~~~~~~~~~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
object?.method().value;
`,
				},
			],
		},
	],
	valid: [
		`foo.bar!;`,
		`foo.bar!.baz;`,
		`foo.bar!.baz();`,
		`foo.bar()!;`,
		`foo.bar()!();`,
		`foo.bar()!.baz;`,
		`foo?.bar;`,
		`foo?.bar();`,
		`(foo?.bar).baz!;`,
		`(foo?.bar()).baz!;`,
		`foo?.bar!.baz;`,
		`foo?.bar!();`,
		`foo?.["bar"]!.baz;`,
	],
});
