import { domLibRuleTester } from "./ruleTester.ts";
import rule from "./unnecessaryComparisons.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
if (value === value) {
	console.log("always true");
}
`,
			snapshot: `
declare const value: number;
if (value === value) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
declare const value: number;
if (value == value) {
	console.log("always true");
}
`,
			snapshot: `
declare const value: number;
if (value == value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
declare const value: number;
if (value !== value) {
	console.log("always false");
}
`,
			snapshot: `
declare const value: number;
if (value !== value) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
declare const value: number;
if (value != value) {
	console.log("always false");
}
`,
			snapshot: `
declare const value: number;
if (value != value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
declare const value: number;
if (value < value) {
	console.log("always false");
}
`,
			snapshot: `
declare const value: number;
if (value < value) {
    ~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
declare const value: number;
if (value <= value) {
	console.log("always true");
}
`,
			snapshot: `
declare const value: number;
if (value <= value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
declare const value: number;
if (value > value) {
	console.log("always false");
}
`,
			snapshot: `
declare const value: number;
if (value > value) {
    ~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
declare const value: number;
if (value >= value) {
	console.log("always true");
}
`,
			snapshot: `
declare const value: number;
if (value >= value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
declare const object: { property: number };
const result = object.property === object.property;
`,
			snapshot: `
declare const object: { property: number };
const result = object.property === object.property;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Comparing a value to itself is unnecessary and likely indicates a logic error.
`,
		},
		{
			code: `
declare const array: number[];
const result = array[0] === array[0];
`,
			snapshot: `
declare const array: number[];
const result = array[0] === array[0];
               ~~~~~~~~~~~~~~~~~~~~~
               Comparing a value to itself is unnecessary and likely indicates a logic error.
`,
		},
		{
			code: `
declare const value: number;
if ((value) === (value)) {
	console.log("with parentheses");
}
`,
			snapshot: `
declare const value: number;
if ((value) === (value)) {
    ~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("with parentheses");
}
`,
		},
		{
			code: `
declare const a: { b: { c: number } };
if (a.b.c === a.b.c) {
	console.log("deeply nested");
}
`,
			snapshot: `
declare const a: { b: { c: number } };
if (a.b.c === a.b.c) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("deeply nested");
}
`,
		},
		{
			code: `
declare const x: number;
if (x <= 400 && x > 500) {
	console.log("never");
}
`,
			snapshot: `
declare const x: number;
if (x <= 400 && x > 500) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("never");
}
`,
		},
		{
			code: `
declare const x: number;
if (x < 100 && x >= 200) {
	console.log("never");
}
`,
			snapshot: `
declare const x: number;
if (x < 100 && x >= 200) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("never");
}
`,
		},
		{
			code: `
declare const x: number;
if (x <= 5 && x > 5) {
	console.log("boundary impossible");
}
`,
			snapshot: `
declare const x: number;
if (x <= 5 && x > 5) {
    ~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("boundary impossible");
}
`,
		},
		{
			code: `
declare const x: number;
if (x < 5 && x >= 5) {
	console.log("boundary impossible");
}
`,
			snapshot: `
declare const x: number;
if (x < 5 && x >= 5) {
    ~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("boundary impossible");
}
`,
		},
		{
			code: `
declare const value: number;
declare const x: number;
if (x < 5 && x > 5) {
	console.log("impossible at same value");
}
`,
			snapshot: `
declare const value: number;
declare const x: number;
if (x < 5 && x > 5) {
    ~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("impossible at same value");
}
`,
		},
		{
			code: `
declare const x: number;
if (5 >= x && x > 10) {
	console.log("flipped operand order");
}
`,
			snapshot: `
declare const x: number;
if (5 >= x && x > 10) {
    ~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("flipped operand order");
}
`,
		},
		{
			code: `
declare const x: number;
if (x <= -5 && x > 0) {
	console.log("negative numbers");
}
`,
			snapshot: `
declare const x: number;
if (x <= -5 && x > 0) {
    ~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("negative numbers");
}
`,
		},
		{
			code: `
declare const x: number;
if (x > 500 && x <= 400) {
	console.log("order reversed");
}
`,
			snapshot: `
declare const x: number;
if (x > 500 && x <= 400) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("order reversed");
}
`,
		},
		{
			code: `
declare const obj: { value: number };
if (obj.value <= 10 && obj.value > 20) {
	console.log("property access");
}
`,
			snapshot: `
declare const obj: { value: number };
if (obj.value <= 10 && obj.value > 20) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("property access");
}
`,
		},
		{
			code: `
declare const a: { b: { c: number } };
if (a.b.c <= 10 && a.b.c > 20) {
	console.log("deeply nested impossible");
}
`,
			snapshot: `
declare const a: { b: { c: number } };
if (a.b.c <= 10 && a.b.c > 20) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("deeply nested impossible");
}
`,
		},
		{
			code: `
declare const x: number;
declare const y: number;
if (x === y || x < y) {
	console.log("can simplify to <=");
}
`,
			snapshot: `
declare const x: number;
declare const y: number;
if (x === y || x < y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("can simplify to <=");
}
`,
		},
		{
			code: `
declare const x: number;
declare const y: number;
if (x === y || x > y) {
	console.log("can simplify to >=");
}
`,
			snapshot: `
declare const x: number;
declare const y: number;
if (x === y || x > y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`>=\`.
	console.log("can simplify to >=");
}
`,
		},
		{
			code: `
declare const x: number;
declare const y: number;
if (x < y || x === y) {
	console.log("order reversed");
}
`,
			snapshot: `
declare const x: number;
declare const y: number;
if (x < y || x === y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("order reversed");
}
`,
		},
		{
			code: `
declare const x: number;
declare const y: number;
if (x == y || x < y) {
	console.log("loose equality");
}
`,
			snapshot: `
declare const x: number;
declare const y: number;
if (x == y || x < y) {
    ~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("loose equality");
}
`,
		},
		{
			code: `
declare const b: number;
declare const a: number;
if (a == b || a > b) {
	console.log("simplify to >=");
}
`,
			snapshot: `
declare const b: number;
declare const a: number;
if (a == b || a > b) {
    ~~~~~~~~~~~~~~~
    This comparison can be simplified to \`>=\`.
	console.log("simplify to >=");
}
`,
		},
		{
			code: `
declare const x: number;
if (x < 200 && x <= 299) {
	console.log("x <= 299 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x < 200 && x <= 299) {
               ~~~~~~~~
               The check \`x <= 299\` is redundant when \`x < 200\` is also checked.
	console.log("x <= 299 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x < 200 && x < 300) {
	console.log("x < 300 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x < 200 && x < 300) {
               ~~~~~~~
               The check \`x < 300\` is redundant when \`x < 200\` is also checked.
	console.log("x < 300 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x > 100 && x >= 50) {
	console.log("x >= 50 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x > 100 && x >= 50) {
               ~~~~~~~
               The check \`x >= 50\` is redundant when \`x > 100\` is also checked.
	console.log("x >= 50 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x <= 10 && x < 20) {
	console.log("x < 20 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x <= 10 && x < 20) {
               ~~~~~~
               The check \`x < 20\` is redundant when \`x <= 10\` is also checked.
	console.log("x < 20 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x > 200 && x > 100) {
	console.log("x > 100 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x > 200 && x > 100) {
               ~~~~~~~
               The check \`x > 100\` is redundant when \`x > 200\` is also checked.
	console.log("x > 100 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x >= 200 && x >= 100) {
	console.log("x >= 100 is redundant");
}
`,
			snapshot: `
declare const x: number;
if (x >= 200 && x >= 100) {
                ~~~~~~~~
                The check \`x >= 100\` is redundant when \`x >= 200\` is also checked.
	console.log("x >= 100 is redundant");
}
`,
		},
		{
			code: `
declare const x: number;
if (x < 5 && x <= 5) {
	console.log("x <= 5 is redundant when x < 5");
}
`,
			snapshot: `
declare const x: number;
if (x < 5 && x <= 5) {
             ~~~~~~
             The check \`x <= 5\` is redundant when \`x < 5\` is also checked.
	console.log("x <= 5 is redundant when x < 5");
}
`,
		},
		{
			code: `
declare const x: number;
if ((x) <= 400 && (x) > 500) {
	console.log("parenthesized");
}
`,
			snapshot: `
declare const x: number;
if ((x) <= 400 && (x) > 500) {
    ~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("parenthesized");
}
`,
		},
		{
			code: `
declare const other: number;
declare const x: number;
declare const a: unknown;
if (a && x <= 400 && x > 500) {
	console.log("mixed with other condition");
}
`,
			snapshot: `
declare const other: number;
declare const x: number;
declare const a: unknown;
if (a && x <= 400 && x > 500) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("mixed with other condition");
}
`,
		},
	],
	valid: [
		`declare const value1: number;
declare const value2: number;
if (value1 === value2) { console.log("different values"); }`,
		`declare const other: number;
declare const value: number;
if (value === other) { console.log("different values"); }`,
		`declare const object: {
    property: number;
    otherProperty: number;
};
if (object.property === object.otherProperty) { console.log("different properties"); }`,
		`declare const array: number[];
if (array[0] === array[1]) { console.log("different elements"); }`,
		`declare const value1: number;
declare const value2: number;
const result = value1 == value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 != value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 !== value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 < value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 <= value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 > value2;`,
		`declare const value1: number;
declare const value2: number;
const result = value1 >= value2;`,
		`declare const x: number;
if (x <= 500 && x > 400) { console.log("valid range"); }`,
		`declare const x: number;
if (x < 100 && x > 0) { console.log("valid range"); }`,
		`declare const x: number;
if (x <= 5 && x >= 5) { console.log("effectively x === 5"); }`,
		`declare const x: number;
if (x < 5 && x > 3) { console.log("valid narrow range"); }`,
		`declare const x: number;
declare const y: number;
declare const z: number;
if (x < y && x > z) { console.log("non-literal"); }`,
		`declare const x: number;
declare function getMax(): number;
declare function getMin(): number;
if (x < getMax() && x > getMin()) { console.log("function calls"); }`,
		`declare const x: number;
declare const y: number;
if (x < 200 && y < 300) { console.log("different variables"); }`,
		`declare const a: { x: number };
declare const b: { x: number };
if (a.x < 5 && b.x > 10) { console.log("different objects"); }`,
		`declare const x: number;
declare const y: number;
declare const z: number;
if (x === y || x < z) { console.log("different operands"); }`,
		`declare const x: number;
declare const y: number;
if (x !== y && x < y) { console.log("inequality with AND"); }`,
		`declare const x: number;
declare const y: number;
declare const z: number;
if (x === y || z < y) { console.log("different left operands"); }`,
		`declare const x: number;
if (x < 200 && x > 100) { console.log("both bounds needed"); }`,
		`declare const value: number;
if (Number.isNaN(value)) { console.log("checking for NaN correctly"); }`,
	],
});
