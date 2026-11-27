import { ruleTester } from "../ruleTester.ts";
import rule from "./conditionalExpects.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    something ? expect(something).toBe(true) : null;
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    something ? expect(something).toBe(true) : null;
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    switch (something) {
        case true:
            expect(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    switch (something) {
        case true:
            expect(something).toBe(true);
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    something && expect(something).toBe(true);
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    something && expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    something || expect(something).toBe(true);
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    something || expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    something ?? expect(something).toBe(true);
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    something ?? expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
declare const somethingThatThrows: () => void;
test("test", () => {
    try {
        somethingThatThrows();
    } catch (error) {
        expect(error).toBeDefined();
    }
});
`,
			snapshot: `
declare const somethingThatThrows: () => void;
test("test", () => {
    try {
        somethingThatThrows();
    } catch (error) {
        expect(error).toBeDefined();
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
it("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
it("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const promise: Promise<void>;
promise.catch(() => {
    expect(true).toBe(false);
});
`,
			snapshot: `
declare const promise: Promise<void>;
promise.catch(() => {
    expect(true).toBe(false);
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Avoid calling \`expect\` inside a \`.catch()\` handler
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    expect.assertions(1);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    expect.assertions(1);
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
function assertSomething() {
    if (something) {
        expect(something).toBe(true);
    }
}

test("test", assertSomething);
`,
			snapshot: `
declare const something: boolean;
function assertSomething() {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
}

test("test", assertSomething);
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    if (something) {
        function helper() {}
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    if (something) {
        function helper() {}
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    expect.hasAssertions();
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
declare const something: boolean;
test("test", () => {
    expect.hasAssertions();
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const count: number;
declare const something: boolean;
test("test", () => {
    expect.assertions(count);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
declare const count: number;
declare const something: boolean;
test("test", () => {
    expect.assertions(count);
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect.hasAssertions();
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect.hasAssertions();
        ~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect.soft(something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", () => {
    if (something) {
        expect.soft(something).toBe(true);
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const something: boolean;
test("test", async () => {
    if (something) {
        await expect.poll(() => something).toBe(true);
    }
});
`,
			snapshot: `
declare const something: boolean;
test("test", async () => {
    if (something) {
        await expect.poll(() => something).toBe(true);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
declare const promise: Promise<void>;
promise["catch"](() => {
    expect(true).toBe(false);
});
`,
			snapshot: `
declare const promise: Promise<void>;
promise["catch"](() => {
    expect(true).toBe(false);
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Avoid calling \`expect\` inside a \`.catch()\` handler
});
`,
		},
	],
	valid: [
		`test("test", () => { expect(true).toBe(true); });`,
		`test("test", () => { expect(1 + 1).toBe(2); });`,
		`
declare const doSomething: () => void;
declare const something: boolean;
test("test", () => { if (something) { doSomething(); } });
`,
		`
declare const something: boolean;
if (something) { expect(something).toBe(true); }
`,
		`
declare const something: boolean;
describe("suite", () => { if (something) { expect(something).toBe(true); } });
`,
		`
declare const something: boolean;
test("test", () => { if (something) { expectTypeOf(something).toEqualTypeOf<true>(); } });
`,
		{
			code: `
declare const something: boolean;
test("test", () => {
    expect.assertions(1);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
		},
		{
			code: `
declare const something: boolean;
test("test", () => {
    expect.assertions(1_000);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
		},
		`
declare const something: boolean;
function helper() {
    if (something) {
        expect(something).toBe(true);
    }
}
`,
	],
});
