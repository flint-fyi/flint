import rule from "./nonNullAssertionPlacement.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: string | null;
value! == "test";
`,
			snapshot: `
declare const value: string | null;
value! == "test";
     ~
     Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
`,
		},
		{
			code: `
declare const value: string | null;
value! === "test";
`,
			snapshot: `
declare const value: string | null;
value! === "test";
     ~
     Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
`,
		},
		{
			code: `
declare let value: string | null;
value! = "new value";
`,
			snapshot: `
declare let value: string | null;
value! = "new value";
     ~
     Non-null assertion before assignment (\`a! = b\`) looks similar to not-equals (\`a != b\`).
`,
		},
		{
			code: `
declare const key: string | null;
declare const object: Record<string, number>;
key! in object;
`,
			snapshot: `
declare const key: string | null;
declare const object: Record<string, number>;
key! in object;
   ~
   Non-null assertion before \`in\` operator (\`a! in b\`) might be misread as \`!(a in b)\`.
`,
		},
		{
			code: `
declare const value: object | null;
declare class MyClass {}
value! instanceof MyClass;
`,
			snapshot: `
declare const value: object | null;
declare class MyClass {}
value! instanceof MyClass;
     ~
     Non-null assertion before \`instanceof\` operator (\`a! instanceof b\`) might be misread as \`!(a instanceof b)\`.
`,
		},
		{
			code: `
declare const first: number | null;
declare const second: number;
first! + second! == 10;
`,
			snapshot: `
declare const first: number | null;
declare const second: number;
first! + second! == 10;
               ~
               Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
`,
		},
		{
			code: `
declare const first: boolean | null;
declare const second: boolean;
(first == second)! == true;
`,
			snapshot: `
declare const first: boolean | null;
declare const second: boolean;
(first == second)! == true;
                 ~
                 Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
`,
		},
		{
			code: `
declare let first: boolean | null;
declare const second: boolean;
(first = second)! = true;
`,
			snapshot: `
declare let first: boolean | null;
declare const second: boolean;
(first = second)! = true;
                ~
                Non-null assertion before assignment (\`a! = b\`) looks similar to not-equals (\`a != b\`).
`,
		},
	],
	valid: [
		`
declare const value: string | null;
value !== "test";
`,
		`
declare const value: string | null;
(value!) == "test";
`,
		`
declare const value: string | null;
(value!) === "test";
`,
		`
declare const value: string | null;
value == "test"!;
`,
		`
declare const key: string | null;
declare const object: Record<string, number>;
(key!) in object;
`,
		`
declare const value: object | null;
declare class MyClass {}
(value!) instanceof MyClass;
`,
		`
declare const value: string | null;
value != "test";
`,
		`
declare const first: number | null;
declare const second: number;
first! + second == 10;
`,
		`
declare const first: number | null;
declare const second: number;
(first! + second!) == 10;
`,
		`
declare const first: number | null;
declare const second: number;
(first! || second!) in {};
`,
		`
declare let value: string | null;
value = "test";
`,
		`
declare const value: string | null;
value == "test";
`,
		`
declare const key: string | null;
declare const object: Record<string, number>;
key in object;
`,
	],
});
