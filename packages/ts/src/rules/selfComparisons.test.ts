import { ruleTester } from "./ruleTester.ts";
import rule from "./selfComparisons.ts";

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
if (calculate() === calculate()) {
	console.log("functions");
}
`,
			snapshot: `
if (calculate() === calculate()) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("functions");
}
`,
		},
		{
			code: `
if (value /* comment */ === value) {
	console.log("with comment");
}
`,
			snapshot: `
if (value /* comment */ === value) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("with comment");
}
`,
		},
		{
			code: `
if (object.property /* comment */ === object.property) {
	console.log("with comment in property access");
}
`,
			snapshot: `
if (object.property /* comment */ === object.property) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("with comment in property access");
}
`,
		},
		{
			code: `
if (array /* comment */ [0] === array[0]) {
	console.log("with comment in array access");
}
`,
			snapshot: `
if (array /* comment */ [0] === array[0]) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("with comment in array access");
}
`,
		},
		{
			code: `
if (value === value /* comment */) {
	console.log("comment on right side");
}
`,
			snapshot: `
if (value === value /* comment */) {
    ~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("comment on right side");
}
`,
		},
		{
			code: `
if (value /* left */ === value /* right */) {
	console.log("comments on both sides");
}
`,
			snapshot: `
if (value /* left */ === value /* right */) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("comments on both sides");
}
`,
		},
		{
			code: `
if (object.property === object /* comment */ .property) {
	console.log("comment on right property access");
}
`,
			snapshot: `
if (object.property === object /* comment */ .property) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("comment on right property access");
}
`,
		},
		{
			code: `
if (array[0] === array /* comment */ [0]) {
	console.log("comment on right array access");
}
`,
			snapshot: `
if (array[0] === array /* comment */ [0]) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("comment on right array access");
}
`,
		},
		{
			code: `
if (/* before */ value === value /* after */) {
	console.log("comments before and after");
}
`,
			snapshot: `
if (/* before */ value === value /* after */) {
                 ~~~~~~~~~~~~~~~
                 Comparing a value to itself is unnecessary and likely indicates a logic error.
	console.log("comments before and after");
}
`,
		},
		{
			code: `
const result = value /* a */ /* b */ === value /* c */ /* d */;
`,
			snapshot: `
const result = value /* a */ /* b */ === value /* c */ /* d */;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Comparing a value to itself is unnecessary and likely indicates a logic error.
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
		`if (Number.isNaN(value)) { console.log("checking for NaN correctly"); }`,
		`if (value1 /* comment */ === value2) { console.log("different with comment on left"); }`,
		`if (value1 === value2 /* comment */) { console.log("different with comment on right"); }`,
		`if (value1 /* left */ === value2 /* right */) { console.log("different with comments on both"); }`,
		`if (object /* comment */ .property === object.otherProperty) { console.log("different properties with comment"); }`,
		`if (object.property === object /* comment */ .otherProperty) { console.log("different properties with comment on right"); }`,
		`if (array /* comment */ [0] === array[1]) { console.log("different elements with comment on left"); }`,
		`if (array[0] === array /* comment */ [1]) { console.log("different elements with comment on right"); }`,
		`if (/* before */ value1 === value2 /* after */) { console.log("different with surrounding comments"); }`,
		`const result = value1 /* a */ /* b */ === value2 /* c */ /* d */;`,
	],
});
