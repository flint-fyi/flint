import rule from "./objectSpreadUnnecessaryFallbacks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const options: { value?: number } | undefined;
const merged = { ...options || {} };
`,
			snapshot: `
declare const options: { value?: number } | undefined;
const merged = { ...options || {} };
                               ~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const options: { value?: number } | undefined;
const merged = { ...(options || {}) };
`,
			snapshot: `
declare const options: { value?: number } | undefined;
const merged = { ...(options || {}) };
                                ~~
                                Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const settings: { enabled?: boolean } | undefined;
const config = { ...settings ?? {} };
`,
			snapshot: `
declare const settings: { enabled?: boolean } | undefined;
const config = { ...settings ?? {} };
                                ~~
                                Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare function getValue(): { value?: number } | undefined;
const result = { ...getValue() || {} };
`,
			snapshot: `
declare function getValue(): { value?: number } | undefined;
const result = { ...getValue() || {} };
                                  ~~
                                  Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const nested: { property: { value?: number } | undefined };
const data = { ...nested.property ?? {} };
`,
			snapshot: `
declare const nested: { property: { value?: number } | undefined };
const data = { ...nested.property ?? {} };
                                     ~~
                                     Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const options: { value?: number } | undefined;
const merged = { ...options || { } };
`,
			snapshot: `
declare const options: { value?: number } | undefined;
const merged = { ...options || { } };
                               ~~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const options: { value?: number } | undefined;
const merged = { ...options || (  {}  ) };
`,
			snapshot: `
declare const options: { value?: number } | undefined;
const merged = { ...options || (  {}  ) };
                               ~~~~~~~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const inner: { value?: number } | undefined;
const outer = { first: true, ...inner || {} };
`,
			snapshot: `
declare const inner: { value?: number } | undefined;
const outer = { first: true, ...inner || {} };
                                         ~~
                                         Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
declare const alpha: { value?: number } | undefined;
declare const beta: { enabled?: boolean } | undefined;
const combined = { ...alpha || {}, ...beta ?? {} };
`,
			snapshot: `
declare const alpha: { value?: number } | undefined;
declare const beta: { enabled?: boolean } | undefined;
const combined = { ...alpha || {}, ...beta ?? {} };
                               ~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
                                              ~~
                                              Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
	],
	valid: [
		`
declare const options: { value?: number } | undefined;
const merged = { ...options };
`,
		`
declare const settings: { enabled?: boolean } | undefined;
const config = { ...settings };
`,
		`
declare function getValue(): { value?: number } | undefined;
const result = { ...getValue() };
`,
		`
declare const options: { value?: number } | undefined;
const merged = { ...options || { defaultValue: true } };
`,
		`
declare const settings: { enabled?: boolean } | undefined;
const config = { ...settings ?? { enabled: false } };
`,
		`
declare const values: number[] | undefined;
const items = [...values || []];
`,
		`
declare function getItems(): number[] | undefined;
const elements = [...getItems() ?? []];
`,
		`const emptySpread = { ...{} };`,
		`
declare const options: { value?: number } | undefined;
const emptyFallback = options || {};
`,
		`
declare const settings: { enabled?: boolean } | undefined;
const emptyNullish = settings ?? {};
`,
		`
declare const options: { value?: number } | undefined;
const objectOnly = { key: options || {} };
`,
		`
declare const options: number[] | undefined;
const arraySpread = [...options || []];
`,
		`const obj = { key: "value" };`,
		`
declare const options: { value?: number } | undefined;
const obj = { ...options && {} };
`,
		`
declare const options: string;
const obj = { ...((options + {}) as unknown as object) };
`,
		`const obj = { prop: true, method() {} };`,
	],
});
