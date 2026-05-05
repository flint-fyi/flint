import { ruleTester } from "../ruleTester.ts";
import rule from "./testCasesWithinDescribes.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
beforeEach("my test", () => {})
`,
			snapshot: `
beforeEach("my test", () => {})
~~~~~~~~~~
Prefer wrapping \`beforeEach()\` hooks in a \`describe()\` block.
`,
		},
		{
			code: `
test("my test", () => {})
describe("test suite", () => {});
`,
			snapshot: `
test("my test", () => {})
~~~~
Prefer wrapping \`test()\` tests in a \`describe()\` block.
describe("test suite", () => {});
`,
		},
		{
			code: `
test("my test", () => {})
describe("test suite", () => {
	it("test", () => {})
});
`,
			snapshot: `
test("my test", () => {})
~~~~
Prefer wrapping \`test()\` tests in a \`describe()\` block.
describe("test suite", () => {
	it("test", () => {})
});
`,
		},
		{
			code: `
describe("test suite", () => {});
afterAll("my test", () => {})
`,
			snapshot: `
describe("test suite", () => {});
afterAll("my test", () => {})
~~~~~~~~
Prefer wrapping \`afterAll()\` hooks in a \`describe()\` block.
`,
		},
		{
			code: `
it.skip("test", () => {});
`,
			snapshot: `
it.skip("test", () => {});
~~~~~~~
Prefer wrapping \`it()\` tests in a \`describe()\` block.
`,
		},
		{
			code: `
it.each([1, 2, 3])("%n", () => {});
`,
			snapshot: `
it.each([1, 2, 3])("%n", () => {});
~~~~~~~
Prefer wrapping \`it()\` tests in a \`describe()\` block.
`,
		},
		{
			code: `
it.skip.each([1, 2, 3])("%n", () => {});
`,
			snapshot: `
it.skip.each([1, 2, 3])("%n", () => {});
~~~~~~~~~~~~
Prefer wrapping \`it()\` tests in a \`describe()\` block.
`,
		},
		{
			code: `
it.skip.each\`\`("%n", () => {});
`,
			snapshot: `
it.skip.each\`\`("%n", () => {});
~~~~~~~~~~~~
Prefer wrapping \`it()\` tests in a \`describe()\` block.
`,
		},
		{
			code: `
it.each\`\`("%n", () => {});
`,
			snapshot: `
it.each\`\`("%n", () => {});
~~~~~~~
Prefer wrapping \`it()\` tests in a \`describe()\` block.
`,
		},
	],
	valid: [
		"it.each()",
		`
import { it } from "vitest";
it.extend()
`,
		`describe("test suite", () => { test("my test") });`,
		`describe("test suite", () => { it("my test") });`,
		`
describe("test suite", () => {
	beforeEach("a", () => {});
	describe("b", () => {});
	test("c", () => {})
});
`,
		`describe("test suite", () => { beforeAll("my beforeAll") });`,
		`describe("test suite", () => { afterEach("my afterEach") });`,
		`describe("test suite", () => { afterAll("my afterAll") });`,
		`
describe("test suite", () => {
	it("my test", () => {})
	describe("another test suite", () => {
	});
	test("my other test", () => {})
});
`,
		"foo()",
		`describe.each([1, true])("trues", value => { it("an it", () => expect(value).toBe(true) ); });`,
		`
describe("%s", () => {
	it("is fine", () => {
		//
	});
});

describe.each("world")("%s", () => {
	it.each([1, 2, 3])("%n", () => {
		//
	});
});
`,
		`
describe.each("hello")("%s", () => {
	it("is fine", () => {
		//
	});
});

describe.each("world")("%s", () => {
	it.each([1, 2, 3])("%n", () => {
		//
	});
});
`,
	],
});
