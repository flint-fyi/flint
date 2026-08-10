import rule from "./emptyDestructures.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const object: {};
const {} = object;
`,
			snapshot: `
declare const object: {};
const {} = object;
      ~~
      Destructuring patterns that don't extract at least one value are unnecessary.
`,
		},
		{
			code: `
declare const array: [];
const [] = array;
`,
			snapshot: `
declare const array: [];
const [] = array;
      ~~
      Destructuring patterns that don't extract at least one value are unnecessary.
`,
		},
		{
			code: `
function process({}: {}) {
    console.log("processed");
}
`,
			snapshot: `
function process({}: {}) {
                 ~~
                 Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("processed");
}
`,
		},
		{
			code: `
function process([]: []) {
    console.log("processed");
}
`,
			snapshot: `
function process([]: []) {
                 ~~
                 Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("processed");
}
`,
		},
		{
			code: `
const process = ({}: {}) => {
    console.log("processed");
};
`,
			snapshot: `
const process = ({}: {}) => {
                 ~~
                 Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("processed");
};
`,
		},
		{
			code: `
const process = ([]: []) => {
    console.log("processed");
};
`,
			snapshot: `
const process = ([]: []) => {
                 ~~
                 Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("processed");
};
`,
		},
		{
			code: `
declare const object: { prop: {} };
const { prop: {} } = object;
`,
			snapshot: `
declare const object: { prop: {} };
const { prop: {} } = object;
              ~~
              Destructuring patterns that don't extract at least one value are unnecessary.
`,
		},
		{
			code: `
declare const object: { prop: [] };
const { prop: [] } = object;
`,
			snapshot: `
declare const object: { prop: [] };
const { prop: [] } = object;
              ~~
              Destructuring patterns that don't extract at least one value are unnecessary.
`,
		},
		{
			code: `
declare const objects: {}[];
for (const {} of objects) {
    console.log("iterating");
}
`,
			snapshot: `
declare const objects: {}[];
for (const {} of objects) {
           ~~
           Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("iterating");
}
`,
		},
		{
			code: `
declare const arrays: Array<[]>;
for (const [] of arrays) {
    console.log("iterating");
}
`,
			snapshot: `
declare const arrays: Array<[]>;
for (const [] of arrays) {
           ~~
           Destructuring patterns that don't extract at least one value are unnecessary.
    console.log("iterating");
}
`,
		},
	],
	valid: [
		`
declare const object: { a: string };
const { a } = object;
`,
		`
declare const object: { a: string; b: string };
const { a, b } = object;
`,
		`
declare const array: [string];
const [a] = array;
`,
		`
declare const array: [string, string];
const [a, b] = array;
`,
		`function process({ a }: { a: string }) { console.log(a); }`,
		`function process([a]: [string]) { console.log(a); }`,
		`const process = ({ a }: { a: string }) => console.log(a);`,
		`const process = ([a]: [string]) => console.log(a);`,
		`
declare const object: { prop: { nested: string } };
const { prop: { nested } } = object;
`,
		`
declare const object: { prop: [string] };
const { prop: [element] } = object;
`,
		`
declare const objects: Array<{ value: string }>;
for (const { value } of objects) {
    console.log(value);
}
`,
		`
declare const arrays: Array<[string]>;
for (const [value] of arrays) {
    console.log(value);
}
`,
		`const object = {};`,
		`const array = [];`,
		`function returnEmpty() { return {}; }`,
		`function returnEmptyArray() { return []; }`,
	],
});
