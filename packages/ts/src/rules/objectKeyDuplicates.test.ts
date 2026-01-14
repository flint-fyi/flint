import rule from "./objectKeyDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = { a: 1, a: 2 };
`,
			snapshot: `
const object = { a: 1, a: 2 };
                 ~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = { "a": 1, "a": 2 };
`,
			snapshot: `
const object = { "a": 1, "a": 2 };
                 ~~~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = { a: 1, "a": 2 };
`,
			snapshot: `
const object = { a: 1, "a": 2 };
                 ~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = { "a": 1, a: 2 };
`,
			snapshot: `
const object = { "a": 1, a: 2 };
                 ~~~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = { 123: "first", 123: "second" };
`,
			snapshot: `
const object = { 123: "first", 123: "second" };
                 ~~~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = {
    value: "first",
    value: "second",
};
`,
			snapshot: `
const object = {
    value: "first",
    ~~~~~
    This key is made redundant by an identical key later in the object.
    value: "second",
};
`,
		},
		{
			code: `
const object = {
    key: 1,
    other: 2,
    key: 3,
};
`,
			snapshot: `
const object = {
    key: 1,
    ~~~
    This key is made redundant by an identical key later in the object.
    other: 2,
    key: 3,
};
`,
		},
		{
			code: `
const first = { a: 1, a: 2 };
const second = { b: 1, b: 2 };
`,
			snapshot: `
const first = { a: 1, a: 2 };
                ~
                This key is made redundant by an identical key later in the object.
const second = { b: 1, b: 2 };
                 ~
                 This key is made redundant by an identical key later in the object.
`,
		},
		{
			code: `
const object = {
    method() { return 1; },
    method() { return 2; },
};
`,
			snapshot: `
const object = {
    method() { return 1; },
    ~~~~~~
    This key is made redundant by an identical key later in the object.
    method() { return 2; },
};
`,
		},
		{
			code: `
const object = {
    get accessor() { return 1; },
    get accessor() { return 2; },
};
`,
			snapshot: `
const object = {
    get accessor() { return 1; },
        ~~~~~~~~
        This key is made redundant by an identical key later in the object.
    get accessor() { return 2; },
};
`,
		},
		{
			code: `
const object = {
    set accessor(value: number) {},
    set accessor(value: number) {},
};
`,
			snapshot: `
const object = {
    set accessor(value: number) {},
        ~~~~~~~~
        This key is made redundant by an identical key later in the object.
    set accessor(value: number) {},
};
`,
		},
		{
			code: `
const nested = { outer: { inner: 1, inner: 2 } };
`,
			snapshot: `
const nested = { outer: { inner: 1, inner: 2 } };
                          ~~~~~
                          This key is made redundant by an identical key later in the object.
`,
		},
	],
	valid: [
		`const object = {};`,
		`const object = { a: 1 };`,
		`const object = { a: 1, b: 2 };`,
		`const object = { a: 1, b: 2, c: 3 };`,
		`const object = { "a": 1, "b": 2 };`,
		`const object = { 123: 1, 456: 2 };`,
		`const object = { a: 1, ...spread };`,
		`const object = { [key]: 1, [key]: 2 };`,
		`const object = { ["computed"]: 1, ["computed"]: 2 };`,
		`const object = { a, b };`,
		`const object = { a: 1, b };`,
		`const object = { method() { return 1; } };`,
		`const object = { get accessor() { return 1; } };`,
		`const object = { set accessor(value: number) {} };`,
		`const object = { get accessor() { return 1; }, set accessor(value: number) {} };`,
	],
});
