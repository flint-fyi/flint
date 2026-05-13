import rule from "./nonNullableTypeAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: string | null;
value as string;
`,
			output: `
declare const value: string | null;
value!;
`,
			snapshot: `
declare const value: string | null;
value as string;
~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const value: string | undefined;
value as string;
`,
			output: `
declare const value: string | undefined;
value!;
`,
			snapshot: `
declare const value: string | undefined;
value as string;
~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const value: string | null | undefined;
value as string;
`,
			output: `
declare const value: string | null | undefined;
value!;
`,
			snapshot: `
declare const value: string | null | undefined;
value as string;
~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const value: number | null;
<number>value;
`,
			output: `
declare const value: number | null;
value!;
`,
			snapshot: `
declare const value: number | null;
<number>value;
~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const value: string | number | null;
value as string | number;
`,
			output: `
declare const value: string | number | null;
value!;
`,
			snapshot: `
declare const value: string | number | null;
value as string | number;
~~~~~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare function getValue(): string | null;
getValue() as string;
`,
			output: `
declare function getValue(): string | null;
getValue()!;
`,
			snapshot: `
declare function getValue(): string | null;
getValue() as string;
~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const left: string | null;
declare const right: string | null;
(left || right) as string;
`,
			output: `
declare const left: string | null;
declare const right: string | null;
(left || right)!;
`,
			snapshot: `
declare const left: string | null;
declare const right: string | null;
(left || right) as string;
~~~~~~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
async function test() {
    declare const getValue: () => Promise<string | null>;
    await getValue() as string;
}
`,
			output: `
async function test() {
    declare const getValue: () => Promise<string | null>;
    (await getValue())!;
}
`,
			snapshot: `
async function test() {
    declare const getValue: () => Promise<string | null>;
    await getValue() as string;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
    Use a non-null assertion (\`!\`) instead of an explicit type assertion.
}
`,
		},
		{
			code: `
declare const value: { nested: string | null };
value.nested as string;
`,
			output: `
declare const value: { nested: string | null };
value.nested!;
`,
			snapshot: `
declare const value: { nested: string | null };
value.nested as string;
~~~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
declare const values: (string | null)[];
values[0] as string;
`,
			output: `
declare const values: (string | null)[];
values[0]!;
`,
			snapshot: `
declare const values: (string | null)[];
values[0] as string;
~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
function withConstrainedGeneric<T extends string>(value: T | null): T {
    return value as T;
}
`,
			output: `
function withConstrainedGeneric<T extends string>(value: T | null): T {
    return value!;
}
`,
			snapshot: `
function withConstrainedGeneric<T extends string>(value: T | null): T {
    return value as T;
           ~~~~~~~~~~
           Use a non-null assertion (\`!\`) instead of an explicit type assertion.
}
`,
		},
		{
			code: `
type Value = string | null;
declare const value: Value;
value as NonNullable<Value>;
`,
			output: `
type Value = string | null;
declare const value: Value;
value!;
`,
			snapshot: `
type Value = string | null;
declare const value: Value;
value as NonNullable<Value>;
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
		{
			code: `
type Value = string | null | undefined;
declare const value: Value;
value as NonNullable<Value>;
`,
			output: `
type Value = string | null | undefined;
declare const value: Value;
value!;
`,
			snapshot: `
type Value = string | null | undefined;
declare const value: Value;
value as NonNullable<Value>;
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use a non-null assertion (\`!\`) instead of an explicit type assertion.
`,
		},
	],
	valid: [
		`declare const value: string; value as string;`,
		`declare const value: string | null; value as const;`,
		`declare const value: string | number | null; value as string;`,
		`declare const value: string | null; value as string | null;`,
		`declare const value: any; value as string;`,
		`declare const value: unknown; value as string;`,
		`declare const value: string; value as unknown;`,
		`declare const value: string | null | undefined; value as string | null;`,
		`declare const value: object | null; value as Record<string, unknown>;`,
		`declare const value: string | null; value!;`,
		`declare const value: number | any; value as string | number | undefined;`,
		`declare const value: number | undefined; value as any;`,
		`const values = [] as const;`,
		`const value = 1 as 1;`,
		`declare function getValue<T = any>(): T; const value = getValue() as number;`,
		`
function withGeneric<T>(value: T | null): T {
    return value as T;
}
`,
		`
function withNullableConstrainedGeneric<T extends string | null>(value: T | null): T {
    return value as T;
}
`,
	],
});
