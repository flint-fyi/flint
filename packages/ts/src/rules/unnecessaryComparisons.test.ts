import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryComparisons.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (value === value) {
	console.log("always true");
}
`,
			snapshot: `
if (value === value) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
if (value == value) {
	console.log("always true");
}
`,
			snapshot: `
if (value == value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
if (value !== value) {
	console.log("always false");
}
`,
			snapshot: `
if (value !== value) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
if (value != value) {
	console.log("always false");
}
`,
			snapshot: `
if (value != value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
if (value < value) {
	console.log("always false");
}
`,
			snapshot: `
if (value < value) {
    ~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
if (value <= value) {
	console.log("always true");
}
`,
			snapshot: `
if (value <= value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
if (value > value) {
	console.log("always false");
}
`,
			snapshot: `
if (value > value) {
    ~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always false");
}
`,
		},
		{
			code: `
if (value >= value) {
	console.log("always true");
}
`,
			snapshot: `
if (value >= value) {
    ~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("always true");
}
`,
		},
		{
			code: `
const result = object.property === object.property;
`,
			snapshot: `
const result = object.property === object.property;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Comparing a value to itself is unnecessary and likely indicates a logic error.
`,
		},
		{
			code: `
const result = array[0] === array[0];
`,
			snapshot: `
const result = array[0] === array[0];
               ~~~~~~~~~~~~~~~~~~~~~
               Comparing a value to itself is unnecessary and likely indicates a logic error.
`,
		},
		{
			code: `
if ((value) === (value)) {
	console.log("with parentheses");
}
`,
			snapshot: `
if ((value) === (value)) {
    ~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("with parentheses");
}
`,
		},
		{
			code: `
if (a.b.c === a.b.c) {
	console.log("deeply nested");
}
`,
			snapshot: `
if (a.b.c === a.b.c) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("deeply nested");
}
`,
		},
		{
			code: `
if (x <= 400 && x > 500) {
	console.log("never");
}
`,
			snapshot: `
if (x <= 400 && x > 500) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("never");
}
`,
		},
		{
			code: `
if (x < 100 && x >= 200) {
	console.log("never");
}
`,
			snapshot: `
if (x < 100 && x >= 200) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("never");
}
`,
		},
		{
			code: `
if (x <= 5 && x > 5) {
	console.log("boundary impossible");
}
`,
			snapshot: `
if (x <= 5 && x > 5) {
    ~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("boundary impossible");
}
`,
		},
		{
			code: `
if (x < 5 && x >= 5) {
	console.log("boundary impossible");
}
`,
			snapshot: `
if (x < 5 && x >= 5) {
    ~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("boundary impossible");
}
`,
		},
		{
			code: `
if (x < 5 && x > 5) {
	console.log("impossible at same value");
}
`,
			snapshot: `
if (x < 5 && x > 5) {
    ~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("impossible at same value");
}
`,
		},
		{
			code: `
if (5 >= x && x > 10) {
	console.log("flipped operand order");
}
`,
			snapshot: `
if (5 >= x && x > 10) {
    ~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("flipped operand order");
}
`,
		},
		{
			code: `
if (x <= -5 && x > 0) {
	console.log("negative numbers");
}
`,
			snapshot: `
if (x <= -5 && x > 0) {
    ~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("negative numbers");
}
`,
		},
		{
			code: `
if (x > 500 && x <= 400) {
	console.log("order reversed");
}
`,
			snapshot: `
if (x > 500 && x <= 400) {
    ~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("order reversed");
}
`,
		},
		{
			code: `
if (obj.value <= 10 && obj.value > 20) {
	console.log("property access");
}
`,
			snapshot: `
if (obj.value <= 10 && obj.value > 20) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("property access");
}
`,
		},
		{
			code: `
if (a.b.c <= 10 && a.b.c > 20) {
	console.log("deeply nested impossible");
}
`,
			snapshot: `
if (a.b.c <= 10 && a.b.c > 20) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("deeply nested impossible");
}
`,
		},
		{
			code: `
if (x === y || x < y) {
	console.log("can simplify to <=");
}
`,
			snapshot: `
if (x === y || x < y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("can simplify to <=");
}
`,
		},
		{
			code: `
if (x === y || x > y) {
	console.log("can simplify to >=");
}
`,
			snapshot: `
if (x === y || x > y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`>=\`.
	console.log("can simplify to >=");
}
`,
		},
		{
			code: `
if (x < y || x === y) {
	console.log("order reversed");
}
`,
			snapshot: `
if (x < y || x === y) {
    ~~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("order reversed");
}
`,
		},
		{
			code: `
if (x == y || x < y) {
	console.log("loose equality");
}
`,
			snapshot: `
if (x == y || x < y) {
    ~~~~~~~~~~~~~~~
    This comparison can be simplified to \`<=\`.
	console.log("loose equality");
}
`,
		},
		{
			code: `
if (a == b || a > b) {
	console.log("simplify to >=");
}
`,
			snapshot: `
if (a == b || a > b) {
    ~~~~~~~~~~~~~~~
    This comparison can be simplified to \`>=\`.
	console.log("simplify to >=");
}
`,
		},
		{
			code: `
if (x < 200 && x <= 299) {
	console.log("x <= 299 is redundant");
}
`,
			snapshot: `
if (x < 200 && x <= 299) {
               ~~~~~~~~
               The check \`x <= 299\` is redundant when \`x < 200\` is also checked.
	console.log("x <= 299 is redundant");
}
`,
		},
		{
			code: `
if (x < 200 && x < 300) {
	console.log("x < 300 is redundant");
}
`,
			snapshot: `
if (x < 200 && x < 300) {
               ~~~~~~~
               The check \`x < 300\` is redundant when \`x < 200\` is also checked.
	console.log("x < 300 is redundant");
}
`,
		},
		{
			code: `
if (x > 100 && x >= 50) {
	console.log("x >= 50 is redundant");
}
`,
			snapshot: `
if (x > 100 && x >= 50) {
               ~~~~~~~
               The check \`x >= 50\` is redundant when \`x > 100\` is also checked.
	console.log("x >= 50 is redundant");
}
`,
		},
		{
			code: `
if (x <= 10 && x < 20) {
	console.log("x < 20 is redundant");
}
`,
			snapshot: `
if (x <= 10 && x < 20) {
               ~~~~~~
               The check \`x < 20\` is redundant when \`x <= 10\` is also checked.
	console.log("x < 20 is redundant");
}
`,
		},
		{
			code: `
if (x > 200 && x > 100) {
	console.log("x > 100 is redundant");
}
`,
			snapshot: `
if (x > 200 && x > 100) {
               ~~~~~~~
               The check \`x > 100\` is redundant when \`x > 200\` is also checked.
	console.log("x > 100 is redundant");
}
`,
		},
		{
			code: `
if (x >= 200 && x >= 100) {
	console.log("x >= 100 is redundant");
}
`,
			snapshot: `
if (x >= 200 && x >= 100) {
                ~~~~~~~~
                The check \`x >= 100\` is redundant when \`x >= 200\` is also checked.
	console.log("x >= 100 is redundant");
}
`,
		},
		{
			code: `
if (x < 5 && x <= 5) {
	console.log("x <= 5 is redundant when x < 5");
}
`,
			snapshot: `
if (x < 5 && x <= 5) {
             ~~~~~~
             The check \`x <= 5\` is redundant when \`x < 5\` is also checked.
	console.log("x <= 5 is redundant when x < 5");
}
`,
		},
		{
			code: `
if ((x) <= 400 && (x) > 500) {
	console.log("parenthesized");
}
`,
			snapshot: `
if ((x) <= 400 && (x) > 500) {
    ~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("parenthesized");
}
`,
		},
		{
			code: `
if (a && x <= 400 && x > 500) {
	console.log("mixed with other condition");
}
`,
			snapshot: `
if (a && x <= 400 && x > 500) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    This range comparison can never be true.
	console.log("mixed with other condition");
}
`,
		},
	],
	valid: [
		`if (value1 === value2) { console.log("different values"); }`,
		`if (value === other) { console.log("different values"); }`,
		`if (object.property === object.otherProperty) { console.log("different properties"); }`,
		`if (array[0] === array[1]) { console.log("different elements"); }`,
		`const result = value1 == value2;`,
		`const result = value1 != value2;`,
		`const result = value1 !== value2;`,
		`const result = value1 < value2;`,
		`const result = value1 <= value2;`,
		`const result = value1 > value2;`,
		`const result = value1 >= value2;`,
		`if (x <= 500 && x > 400) { console.log("valid range"); }`,
		`if (x < 100 && x > 0) { console.log("valid range"); }`,
		`if (x <= 5 && x >= 5) { console.log("effectively x === 5"); }`,
		`if (x < 5 && x > 3) { console.log("valid narrow range"); }`,
		`if (x < y && x > z) { console.log("non-literal"); }`,
		`if (x < getMax() && x > getMin()) { console.log("function calls"); }`,
		`if (x < 200 && y < 300) { console.log("different variables"); }`,
		`if (a.x < 5 && b.x > 10) { console.log("different objects"); }`,
		`if (x === y || x < z) { console.log("different operands"); }`,
		`if (x !== y && x < y) { console.log("inequality with AND"); }`,
		`if (x === y || z < y) { console.log("different left operands"); }`,
		`if (x < 200 && x > 100) { console.log("both bounds needed"); }`,
		`if (Number.isNaN(value)) { console.log("checking for NaN correctly"); }`,
	],
});
