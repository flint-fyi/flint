import rule from "./dynamicDeletes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj: { [key: string]: number } = {};
const key = "property";
delete obj[key];
`,
			snapshot: `
const obj: { [key: string]: number } = {};
const key = "property";
delete obj[key];
           ~~~
           Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const obj: { [key: string]: number } = {};
function getKey() {
    return "property";
}
delete obj[getKey()];
`,
			snapshot: `
const obj: { [key: string]: number } = {};
function getKey() {
    return "property";
}
delete obj[getKey()];
           ~~~~~~~~
           Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const arr: { [index: number]: number } = {};
const i = 0;
delete arr[i];
`,
			snapshot: `
const arr: { [index: number]: number } = {};
const i = 0;
delete arr[i];
           ~
           Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container['aa' + 'b'];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container['aa' + 'b'];
                 ~~~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[+7];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[+7];
                 ~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[-Infinity];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[-Infinity];
                 ~~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[+Infinity];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[+Infinity];
                 ~~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[NaN];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[NaN];
                 ~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
const name = { foo: { bar: 'bar' } };
delete container[name.foo.bar];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
const name = { foo: { bar: 'bar' } };
delete container[name.foo.bar];
                 ~~~~~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[+'Infinity'];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[+'Infinity'];
                 ~~~~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
		{
			code: `
const container: { [i: string]: 0 } = {};
delete container[typeof 1];
`,
			snapshot: `
const container: { [i: string]: 0 } = {};
delete container[typeof 1];
                 ~~~~~~~~
                 Using the \`delete\` operator on a computed key can be dangerous and is often not well optimized.
`,
		},
	],
	valid: [
		`const obj: { property?: number } = {};
delete obj.property;`,
		`const obj: { literal?: number } = {};
delete obj['literal'];`,
		`const obj: { 0?: number } = {};
delete obj[0];`,
		`const obj: { a?: number } = { a: 1 };
delete obj.a;`,
		"const container: { [i: string]: 0 } = {}; delete container.aaa;",
		"const container: { [i: string]: 0 } = {}; delete container.delete;",
		"const container: { [i: string]: 0 } = {}; delete container[7];",
		"const container: { [i: string]: 0 } = {}; delete container[-7];",
		"const container: { [i: string]: 0 } = {}; delete container['-Infinity'];",
		"const container: { [i: string]: 0 } = {}; delete container['+Infinity'];",
		"const container: { [i: string]: 0 } = {}; delete container['aaa'];",
		"const container: { [i: string]: 0 } = {}; delete container['delete'];",
		"const container: { [i: string]: 0 } = {}; delete container['NaN'];",
	],
});
