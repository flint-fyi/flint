import rule from "./objectEntriesMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const entries: [string, number][];
entries.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});
`,
			snapshot: `
declare const entries: [string, number][];
entries.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
declare const entries: [string, string][];
entries.reduce((result, [key, value]) => Object.assign(result, { [key]: value }), {});
`,
			snapshot: `
declare const entries: [string, string][];
entries.reduce((result, [key, value]) => Object.assign(result, { [key]: value }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
declare const items: { id: string; name: string }[];
items.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item.name }), {});
`,
			snapshot: `
declare const items: { id: string; name: string }[];
items.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item.name }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
declare const pairs: [string, boolean][];
pairs.reduce((obj, [key, value]) => Object.assign(obj, { [key]: value }), Object.create(null));
`,
			snapshot: `
declare const pairs: [string, boolean][];
pairs.reduce((obj, [key, value]) => Object.assign(obj, { [key]: value }), Object.create(null));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
declare const data: [string, number][];
data.reduce((acc, [key, val]) => ({ ...acc, [key]: val }), Object.create(null));
`,
			snapshot: `
declare const data: [string, number][];
data.reduce((acc, [key, val]) => ({ ...acc, [key]: val }), Object.create(null));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
Object.entries({ first: 1, second: 2 }).reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value * 2 }), {});
`,
			snapshot: `
Object.entries({ first: 1, second: 2 }).reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value * 2 }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
Object.keys({ first: 1, second: 2 }).reduce((accumulator, key) => ({ ...accumulator, [key]: key.length }), {});
`,
			snapshot: `
Object.keys({ first: 1, second: 2 }).reduce((accumulator, key) => ({ ...accumulator, [key]: key.length }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
[["first", 1], ["second", 2]].reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});
`,
			snapshot: `
[["first", 1], ["second", 2]].reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
		{
			code: `
declare const entries: [string, number][];
entries.reduce((accumulator, [key, value]) => (({ ...accumulator, [key]: value })), ({}));
`,
			snapshot: `
declare const entries: [string, number][];
entries.reduce((accumulator, [key, value]) => (({ ...accumulator, [key]: value })), ({}));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().
`,
		},
	],
	valid: [
		`declare const entries: [string, number][]; Object.fromEntries(entries);`,
		`declare const entries: [string, number][]; Object.fromEntries(entries.map(([key, value]) => [key, value * 2]));`,
		`declare const entries: [string, number][]; entries.reduce((sum, [, value]) => sum + value, 0);`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => { accumulator[key] = value; return accumulator; }, {});`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value, extra: true }), {});`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => ({ [key]: value, ...accumulator }), {});`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), { initial: 0 });`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => Object.assign(accumulator, { [key]: value, extra: true }), {});`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => Object.assign({}, accumulator, { [key]: value }), {});`,
		`declare const obj: { reduce: (fn: Function, init: object) => object }; obj.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce?.((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }));`,
		`declare const entries: [string, number][]; entries.reduce((accumulator, [key, value]) => ({ ...accumulator, staticKey: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce(() => ({}), {});`,
		`declare const entries: [string, number][]; entries.reduce(function(acc, [k, v]) { return { ...acc, [k]: v }; }, {});`,
		`declare const entries: [string, number][]; entries["reduce"]((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.map((x) => x);`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => Object.assign(other, { [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => Object.assign(acc, value), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => ({ ...other, [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => ({ ...acc }), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => myAssign(acc, { [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce(({ ...acc }, [key, value]) => ({ ...acc, [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => Object.create({ [key]: value }), {});`,
		`declare const entries: [string, number][]; entries.reduce((acc, [key, value]) => Object.assign(acc, { [key]: value }), Object.create({}));`,
	],
});
