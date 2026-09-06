import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeAssertions.ts";

const noUncheckedIndexedAccessFiles = createRuleTesterTSConfig({
	noUncheckedIndexedAccess: true,
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const name: string;
name as string;
`,
			output: `
declare const name: string;
name;
`,
			snapshot: `
declare const name: string;
name as string;
~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare const count: number;
<number>count;
`,
			output: `
declare const count: number;
count;
`,
			snapshot: `
declare const count: number;
<number>count;
~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
const name = "value";
name!;
`,
			output: `
const name = "value";
name;
`,
			snapshot: `
const name = "value";
name!;
    ~
    This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare const name: string;
name as /* retained */ string;
`,
			snapshot: `
declare const name: string;
name as /* retained */ string;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
interface Named { name: string }
interface Labelled { name: string }
declare const value: Named;
value as Labelled;
`,
			output: `
interface Named { name: string }
interface Labelled { name: string }
declare const value: Named;
value;
`,
			snapshot: `
interface Named { name: string }
interface Labelled { name: string }
declare const value: Named;
value as Labelled;
~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare function consume(value: number): void;
consume(1 as any);
`,
			output: `
declare function consume(value: number): void;
consume(1);
`,
			snapshot: `
declare function consume(value: number): void;
consume(1 as any);
        ~~~~~~~~
        The expression's original type is already accepted here.
`,
		},
		{
			code: `
declare const count: number;
count as unknown as number;
`,
			output: `
declare const count: number;
count;
`,
			snapshot: `
declare const count: number;
count as unknown as number;
~~~~~~~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare const count: number;
(count as unknown) as number;
`,
			output: `
declare const count: number;
count;
`,
			snapshot: `
declare const count: number;
(count as unknown) as number;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare const name: string | null;
const displayedName: string | null = name!;
`,
			output: `
declare const name: string | null;
const displayedName: string | null = name;
`,
			snapshot: `
declare const name: string | null;
const displayedName: string | null = name!;
                                         ~
                                         The expression's original type is already accepted here.
`,
		},
		{
			code: `
declare let name: string;
name! = "updated";
`,
			output: `
declare let name: string;
name = "updated";
`,
			snapshot: `
declare let name: string;
name! = "updated";
    ~
    The expression's original type is already accepted here.
`,
		},
		{
			code: `
const count = 1 as 1;
`,
			output: `
const count = 1;
`,
			snapshot: `
const count = 1 as 1;
              ~~~~~~
              This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare function getCount(): number;
getCount() as number;
`,
			output: `
declare function getCount(): number;
getCount();
`,
			snapshot: `
declare function getCount(): number;
getCount() as number;
~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare function identity<T>(value: T): T;
identity<number>(1) as number;
`,
			output: `
declare function identity<T>(value: T): T;
identity<number>(1);
`,
			snapshot: `
declare function identity<T>(value: T): T;
identity<number>(1) as number;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
class Container {
    readonly value = "content" as "content";
}
`,
			output: `
class Container {
    readonly value = "content";
}
`,
			snapshot: `
class Container {
    readonly value = "content" as "content";
                     ~~~~~~~~~~~~~~~~~~~~~~
                     This assertion does not change the expression's type.
}
`,
		},
		{
			code: `
declare function getName(): string;
getName()!;
`,
			output: `
declare function getName(): string;
getName();
`,
			snapshot: `
declare function getName(): string;
getName()!;
         ~
         This assertion does not change the expression's type.
`,
		},
		{
			code: `
declare let name: string;
name!;
`,
			output: `
declare let name: string;
name;
`,
			snapshot: `
declare let name: string;
name!;
    ~
    This assertion does not change the expression's type.
`,
		},
		{
			code: `
interface Original { [key: string]: number }
interface Asserted { [key: string]: number }
declare const value: Original;
value as Asserted;
`,
			output: `
interface Original { [key: string]: number }
interface Asserted { [key: string]: number }
declare const value: Original;
value;
`,
			snapshot: `
interface Original { [key: string]: number }
interface Asserted { [key: string]: number }
declare const value: Original;
value as Asserted;
~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
interface Original<T> { value: T }
interface Asserted<T> { value: T }
declare const value: Original<string>;
value as Asserted<string>;
`,
			output: `
interface Original<T> { value: T }
interface Asserted<T> { value: T }
declare const value: Original<string>;
value;
`,
			snapshot: `
interface Original<T> { value: T }
interface Asserted<T> { value: T }
declare const value: Original<string>;
value as Asserted<string>;
~~~~~~~~~~~~~~~~~~~~~~~~~
This assertion does not change the expression's type.
`,
		},
		{
			code: `
interface Recursive { child?: Recursive }
declare function consume(value: Recursive): void;
declare const value: Recursive;
consume(value as unknown);
`,
			output: `
interface Recursive { child?: Recursive }
declare function consume(value: Recursive): void;
declare const value: Recursive;
consume(value);
`,
			snapshot: `
interface Recursive { child?: Recursive }
declare function consume(value: Recursive): void;
declare const value: Recursive;
consume(value as unknown);
        ~~~~~~~~~~~~~~~~
        The expression's original type is already accepted here.
`,
		},
		{
			code: `
function read(name: string) {
    return name!;
}
`,
			output: `
function read(name: string) {
    return name;
}
`,
			snapshot: `
function read(name: string) {
    return name!;
               ~
               This assertion does not change the expression's type.
}
`,
		},
	],
	valid: [
		`declare const value: any; value as any;`,
		`declare function consume(value: string): void; declare const value: any; consume(value as string);`,
		`declare const value: { readonly name: string }; value as { name: string };`,
		`declare const value: { name: any }; value as { name: any };`,
		`type Value = { name: any }; declare const value: Value; value as Value;`,
		`interface Original { [key: string]: number } interface Asserted { readonly [key: string]: number } declare const value: Original; value as Asserted;`,
		`interface Recursive { child?: Recursive } declare const value: Recursive; value as { child?: Recursive };`,
		`interface Left { child?: Left } interface Right { child?: Right } declare const value: Left; value as Right;`,
		`function read<T extends string | undefined>(value: T) { return value!; }`,
		`function read<T>(value: T) { return value!; }`,
		`function update<T extends { name: string }>(value: T) { (value as T).name = "updated"; }`,
		`function convert<T, U>(value: T): U { return value as unknown as U; }`,
		`let name: string; name!;`,
		`let name: string | undefined; name!;`,
		`let target = ""; declare const value: string; target = value!;`,
		`declare let target: string; declare const value: string; target = value as string;`,
		`declare let target: string; declare const value: string; target ||= value as string;`,
		`const value = "value" as const;`,
		`const value = "value" as string;`,
		`class Container { value = "content" as "content"; }`,
		`declare const value: string; (value as string) satisfies string;`,
		`declare const value: string; const values = [...(value as string)];`,
		`declare const values: [string]; const [value] = values as [string];`,
		`const value = { name: "value" } as { name: string };`,
		`declare function consume<T>(value: T): void; declare const value: string; consume(value as string);`,
		`declare function create<T = unknown>(): T; const value = create() as number;`,
		`declare function create<T = unknown>(): Promise<T>; async function read() { const value = (await create()) as number; }`,
		"declare function tag<T = unknown>(strings: TemplateStringsArray): T; const value = tag`` as number;",
		`declare const value: string; const count: number = value as number;`,
		`declare const value: string | null; const count: number = value!;`,
		`declare const value: string; value as number;`,
		{
			code: `
declare const values: Record<string, string>;
declare const key: string;
values[key as string];
`,
			files: noUncheckedIndexedAccessFiles,
		},
	],
});
