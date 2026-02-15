import rule from "./objectSpreadUnnecessaryFallbacks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const merged = { ...options || {} };
`,
			snapshot: `
const merged = { ...options || {} };
                               ~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const merged = { ...(options || {}) };
`,
			snapshot: `
const merged = { ...(options || {}) };
                                ~~
                                Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const config = { ...settings ?? {} };
`,
			snapshot: `
const config = { ...settings ?? {} };
                                ~~
                                Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const result = { ...getValue() || {} };
`,
			snapshot: `
const result = { ...getValue() || {} };
                                  ~~
                                  Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const data = { ...nested.property ?? {} };
`,
			snapshot: `
const data = { ...nested.property ?? {} };
                                     ~~
                                     Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const merged = { ...options || { } };
`,
			snapshot: `
const merged = { ...options || { } };
                               ~~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const merged = { ...options || (  {}  ) };
`,
			snapshot: `
const merged = { ...options || (  {}  ) };
                               ~~~~~~~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const outer = { first: true, ...inner || {} };
`,
			snapshot: `
const outer = { first: true, ...inner || {} };
                                         ~~
                                         Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
		{
			code: `
const combined = { ...alpha || {}, ...beta ?? {} };
`,
			snapshot: `
const combined = { ...alpha || {}, ...beta ?? {} };
                               ~~
                               Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
                                              ~~
                                              Spreading \`undefined\` or \`null\` in an object literal has no effect, making this empty object fallback unnecessary.
`,
		},
	],
	valid: [
		`const merged = { ...options };`,
		`const config = { ...settings };`,
		`const result = { ...getValue() };`,
		`const merged = { ...options || { defaultValue: true } };`,
		`const config = { ...settings ?? { enabled: false } };`,
		`const items = [...values || []];`,
		`const elements = [...getItems() ?? []];`,
		`const emptySpread = { ...{} };`,
		`const emptyFallback = options || {};`,
		`const emptyNullish = settings ?? {};`,
		`const objectOnly = { key: options || {} };`,
		`const arraySpread = [...options || []];`,
		`const obj = { key: "value" };`,
		`const obj = { ...options && {} };`,
		`const obj = { ...options + {} };`,
		`const obj = { prop: true, method() {} };`,
	],
});
