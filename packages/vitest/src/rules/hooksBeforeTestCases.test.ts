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
suite("suite", () => {
	test("my test", () => {})
	aroundEach(async (runTest) => { await runTest() })
})
`,
			snapshot: `
suite("suite", () => {
	test("my test", () => {})
	aroundEach(async (runTest) => { await runTest() })
	~~~~~~~~~~
	This hook appears after a test case.
})
`,
		},
		{
			code: `
it("my test", () => {})
aroundAll(async (runSuite) => { await runSuite() })
`,
			snapshot: `
it("my test", () => {})
aroundAll(async (runSuite) => { await runSuite() })
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test("my test", () => {})
console.log()
afterEach(() => {})
`,
			snapshot: `
test("my test", () => {})
console.log()
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.skip.only("my test", () => {})
afterEach(() => {})
`,
			snapshot: `
test.skip.only("my test", () => {})
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.concurrent.fails.only("my test", () => {})
beforeEach(() => {})
`,
			snapshot: `
test.concurrent.fails.only("my test", () => {})
beforeEach(() => {})
~~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test["skip"].only("my test", () => {})
beforeAll(() => {})
`,
			snapshot: `
test["skip"].only("my test", () => {})
beforeAll(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.each([1, 2])("my test %i", () => {})
afterEach(() => {})
`,
			snapshot: `
test.each([1, 2])("my test %i", () => {})
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
it.skip.each([1, 2])("my test %i", () => {})
afterAll(() => {})
`,
			snapshot: `
it.skip.each([1, 2])("my test %i", () => {})
afterAll(() => {})
~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.each\`
	value
	\${1}
\`("my test $value", () => {})
beforeEach(() => {})
`,
			snapshot: `
test.each\`
	value
	\${1}
\`("my test $value", () => {})
beforeEach(() => {})
~~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.extend({})("my test", () => {})
beforeEach(() => {})
`,
			snapshot: `
test.extend({})("my test", () => {})
beforeEach(() => {})
~~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
it.runIf(true)("my test", () => {})
afterEach(() => {})
`,
			snapshot: `
it.runIf(true)("my test", () => {})
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.skipIf(false).each([1])("my test %i", () => {})
afterAll(() => {})
`,
			snapshot: `
test.skipIf(false).each([1])("my test %i", () => {})
afterAll(() => {})
~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test!("my test", () => {})
beforeEach!(() => {})
`,
			snapshot: `
test!("my test", () => {})
beforeEach!(() => {})
~~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
test.each([1])!("my test %i", () => {})
afterEach(() => {})
`,
			snapshot: `
test.each([1])!("my test %i", () => {})
afterEach(() => {})
~~~~~~~~~
This hook appears after a test case.
`,
		},
		{
			code: `
describe.each([1, 2])("suite %i", () => {
	it.only("my test", () => {})
	beforeEach(() => {})
})
`,
			snapshot: `
describe.each([1, 2])("suite %i", () => {
	it.only("my test", () => {})
	beforeEach(() => {})
	~~~~~~~~~~
	This hook appears after a test case.
})
`,
		},
		{
			code: `
describe.skip.concurrent("suite", () => {
	describe.only("inner", () => {
		test.todo("my test")
		afterEach(() => {})
	})
	test.fails("other test", () => {})
	afterAll(() => {})
})
`,
			snapshot: `
describe.skip.concurrent("suite", () => {
	describe.only("inner", () => {
		test.todo("my test")
		afterEach(() => {})
		~~~~~~~~~
		This hook appears after a test case.
	})
	test.fails("other test", () => {})
	afterAll(() => {})
	~~~~~~~~
	This hook appears after a test case.
})
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
		`
beforeEach(() => {})
test.skip.only("my test", () => {})
test.each([1])("my test %i", () => {})
`,
		`
describe.each([1, 2])("suite %i", () => {
	it.concurrent("my test", () => {})
})
afterEach(() => {})
`,
		`
test.runIf(true)
beforeEach(() => {})
`,
		"console.log()",
	],
});
