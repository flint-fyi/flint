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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const value: string | null;
value == "test";
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const value: string | null;
(value!) == "test";
`,
				},
			],
		},
		{
			code: `
declare const value: string | null;
value! /* ) */ == "test";
`,
			snapshot: `
declare const value: string | null;
value! /* ) */ == "test";
     ~
     Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
`,
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const value: string | null;
value /* ) */ == "test";
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const value: string | null;
(value!) /* ) */ == "test";
`,
				},
			],
		},
		{
			code: `
declare const value: string | null;
value! // )
== "test";
`,
			snapshot: `
declare const value: string | null;
value! // )
     ~
     Non-null assertion before equality test (\`a! == b\`) looks similar to strict not-equals (\`a !== b\`).
== "test";
`,
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const value: string | null;
value // )
== "test";
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const value: string | null;
(value!) // )
== "test";
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const value: string | null;
value === "test";
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const value: string | null;
(value!) === "test";
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare let value: string | null;
value = "new value";
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare let value: string | null;
(value!) = "new value";
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const key: string | null;
declare const object: Record<string, number>;
key in object;
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const key: string | null;
declare const object: Record<string, number>;
(key!) in object;
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const value: object | null;
declare class MyClass {}
value instanceof MyClass;
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const value: object | null;
declare class MyClass {}
(value!) instanceof MyClass;
`,
				},
			],
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
			suggestions: [
				{
					id: "wrapInParentheses",
					updated: `
declare const first: number | null;
declare const second: number;
(first! + second!) == 10;
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare const first: boolean | null;
declare const second: boolean;
(first == second) == true;
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare const first: boolean | null;
declare const second: boolean;
((first == second)!) == true;
`,
				},
			],
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
			suggestions: [
				{
					id: "removeAssertion",
					updated: `
declare let first: boolean | null;
declare const second: boolean;
(first = second) = true;
`,
				},
				{
					id: "wrapInParentheses",
					updated: `
declare let first: boolean | null;
declare const second: boolean;
((first = second)!) = true;
`,
				},
			],
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
