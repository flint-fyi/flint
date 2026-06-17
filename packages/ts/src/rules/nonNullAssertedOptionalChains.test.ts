import rule from "./nonNullAssertedOptionalChains.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const foo: { bar: string } | undefined;
foo?.bar!;
`,
			snapshot: `
declare const foo: { bar: string } | undefined;
foo?.bar!;
~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: string } | undefined;
foo?.bar;
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: string } | undefined;
foo?.["bar"]!;
`,
			snapshot: `
declare const foo: { bar: string } | undefined;
foo?.["bar"]!;
~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: string } | undefined;
foo?.["bar"];
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar(): string } | undefined;
foo?.bar()!;
`,
			snapshot: `
declare const foo: { bar(): string } | undefined;
foo?.bar()!;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar(): string } | undefined;
foo?.bar();
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar?: () => string };
foo.bar?.()!;
`,
			snapshot: `
declare const foo: { bar?: () => string };
foo.bar?.()!;
~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar?: () => string };
foo.bar?.();
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: string } | undefined;
(foo?.bar)!;
`,
			snapshot: `
declare const foo: { bar: string } | undefined;
(foo?.bar)!;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: string } | undefined;
(foo?.bar);
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: { baz: string } } | undefined;
(foo?.bar)!.baz;
`,
			snapshot: `
declare const foo: { bar: { baz: string } } | undefined;
(foo?.bar)!.baz;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: { baz: string } } | undefined;
(foo?.bar).baz;
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar)!();
`,
			snapshot: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar)!();
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar)();
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: () => { baz: string } } | undefined;
(foo?.bar)!().baz;
`,
			snapshot: `
declare const foo: { bar: () => { baz: string } } | undefined;
(foo?.bar)!().baz;
~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: () => { baz: string } } | undefined;
(foo?.bar)().baz;
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: string } | undefined;
(foo?.bar!)
`,
			snapshot: `
declare const foo: { bar: string } | undefined;
(foo?.bar!)
 ~~~~~~~~~
 Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: string } | undefined;
(foo?.bar)
`,
				},
			],
		},
		{
			code: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar!)();
`,
			snapshot: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar!)();
 ~~~~~~~~~
 Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const foo: { bar: () => void } | undefined;
(foo?.bar)();
`,
				},
			],
		},
		{
			code: `
declare const object: { property: { value?: string } } | undefined;
object?.property.value!;
`,
			snapshot: `
declare const object: { property: { value?: string } } | undefined;
object?.property.value!;
~~~~~~~~~~~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const object: { property: { value?: string } } | undefined;
object?.property.value;
`,
				},
			],
		},
		{
			code: `
declare const object: { method(): { value?: string } } | undefined;
object?.method().value!;
`,
			snapshot: `
declare const object: { method(): { value?: string } } | undefined;
object?.method().value!;
~~~~~~~~~~~~~~~~~~~~~~~
Non-null assertions are unsafe on optional chain expressions because they can still return undefined.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const object: { method(): { value?: string } } | undefined;
object?.method().value;
`,
				},
			],
		},
	],
	valid: [
		`
declare const foo: { bar: string };
foo.bar!;
`,
		`
declare const foo: { bar: { baz: string } };
foo.bar!.baz;
`,
		`
declare const foo: { bar: { baz(): void } };
foo.bar!.baz();
`,
		`
declare const foo: { bar(): string };
foo.bar()!;
`,
		`
declare const foo: { bar(): () => void };
foo.bar()!();
`,
		`
declare const foo: { bar(): { baz: string } };
foo.bar()!.baz;
`,
		`
declare const foo: { bar: string };
foo?.bar;
`,
		`
declare const foo: { bar(): void };
foo?.bar();
`,
		`
declare const foo: { bar: { baz?: string } };
(foo?.bar).baz!;
`,
		`
declare const foo: { bar(): { baz?: string } };
(foo?.bar()).baz!;
`,
		`
declare const foo: { bar?: { baz: string } } | undefined;
foo?.bar!.baz;
`,
		`
declare const foo: { bar?: () => void } | undefined;
foo?.bar!();
`,
		`
declare const foo: { bar?: { baz: string } } | undefined;
foo?.["bar"]!.baz;
`,
	],
});
