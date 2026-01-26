import { ruleTester } from "./ruleTester.ts";
import rule from "./setHasExistenceChecks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const items = [1, 2, 3];
function check(value: number) {
    return items.includes(value);
}
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
function check(value: number) {
    return items.includes(value);
}
`,
		},
		{
			code: `
const items = [1, 2, 3];
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = [1, 2, 3];
for (const value of [1, 2]) {
    items.includes(value);
}
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
for (const value of [1, 2]) {
    items.includes(value);
}
`,
		},
		{
			code: `
const items = Array(1, 2, 3);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = Array(1, 2, 3);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = new Array(1, 2, 3);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = new Array(1, 2, 3);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = Array.from([1, 2, 3]);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = Array.from([1, 2, 3]);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = Array.of(1, 2, 3);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = Array.of(1, 2, 3);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = [1, 2, 3].filter(Boolean);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = [1, 2, 3].filter(Boolean);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = [1, 2, 3].map((value) => value * 2);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = [1, 2, 3].map((value) => value * 2);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
		{
			code: `
const items = [1, 2, 3];
const check = (value: number) => items.includes(value);
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
const check = (value: number) => items.includes(value);
`,
		},
		{
			code: `
const items = [1, 2, 3];
while (true) {
    items.includes(1);
}
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
while (true) {
    items.includes(1);
}
`,
		},
		{
			code: `
const items = [1, 2, 3];
for (let index = 0; index < 10; index++) {
    items.includes(index);
}
`,
			snapshot: `
const items = [1, 2, 3];
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
for (let index = 0; index < 10; index++) {
    items.includes(index);
}
`,
		},
		{
			code: `
const items = [1, 2, 3].slice(0, 2);
items.includes(1);
items.includes(2);
`,
			snapshot: `
const items = [1, 2, 3].slice(0, 2);
      ~~~~~
      This array is only used for existence checks. Prefer \`Set\` with \`.has()\` for better performance.
items.includes(1);
items.includes(2);
`,
		},
	],
	valid: [
		`const items = [1, 2, 3]; items.includes(1);`,
		`const items = [1, 2, 3]; items.push(4); items.includes(1);`,
		`export const items = [1, 2, 3]; items.includes(1); items.includes(2);`,
		`const items = [1, 2, 3]; items?.includes(1); items?.includes(2);`,
		`const items = new Set([1, 2, 3]); items.has(1);`,
		`const items = [1, 2, 3]; items.includes(1, 0);`,
		`const items = [1, 2, 3]; const copy = items;`,
		`const items = [1, 2, 3]; console.log(items);`,
		`const items = [1, 2, 3]; items.length;`,
		`const items = [1, 2, 3];`,
		`let items = [1, 2, 3]; items.includes(1); items.includes(2);`,
	],
});
