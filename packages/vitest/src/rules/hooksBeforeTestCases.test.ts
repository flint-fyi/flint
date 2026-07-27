import { ruleTester } from "../ruleTester.ts";
import rule from "./hooksBeforeTestCases.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
test("my test", () => {})
beforeEach(() => {})
`,
			snapshot: `
test("my test", () => {})
beforeEach(() => {})
~~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
describe("suite", () => {
	it("my test", () => {})
	afterEach(() => {})
})
`,
			snapshot: `
describe("suite", () => {
	it("my test", () => {})
	afterEach(() => {})
	~~~~~~~~~
	This hook appears after a test case.
})
`,
		},
		{
			code: `
describe("suite", () => {
	test("my test", () => {})
	beforeEach(() => {})
	afterAll(() => {})
})
`,
			snapshot: `
describe("suite", () => {
	test("my test", () => {})
	beforeEach(() => {})
	~~~~~~~~~~
	This hook appears after a test case.
	afterAll(() => {})
	~~~~~~~~
	This hook appears after a test case.
})
`,
		},
		{
			code: `
it.skip("my test", () => {})
beforeAll(() => {})
`,
			snapshot: `
it.skip("my test", () => {})
beforeAll(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test("first test", () => {})
beforeEach(() => {})
test("second test", () => {})
`,
			snapshot: `
test("first test", () => {})
beforeEach(() => {})
~~~~~~~~~~
This hook appears after a test case.
test("second test", () => {})
`,
		},
		{
			code: `
describe("suite", () => {
	beforeAll(() => {})
	it("my test", () => {})
	afterAll(() => {})
})
`,
			snapshot: `
describe("suite", () => {
	beforeAll(() => {})
	it("my test", () => {})
	afterAll(() => {})
	~~~~~~~~
	This hook appears after a test case.
})
`,
		},
		{
			code: `
test("my test", () => {})
foo()
afterEach(() => {})
`,
			snapshot: `
test("my test", () => {})
foo()
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
	],
	valid: [
		`
describe("suite", () => {
	beforeEach(() => {})
	it("my test", () => {})
})
`,
		`
describe("suite", () => {
	beforeEach(() => {})
	afterEach(() => {})
})
`,
		`
describe("suite", () => {
	describe("inner", () => {
		it("my test", () => {})
	})
	beforeEach(() => {})
})
`,
		`
const myTest = test.extend({})
beforeEach(() => {})
`,
		"foo()",
	],
});
