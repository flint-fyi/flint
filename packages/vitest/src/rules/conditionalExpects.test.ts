import { createRuleTester } from "../ruleTester.ts";
import rule from "./conditionalExpects.ts";

const ruleTester = createRuleTester({
	"conditionalExpects.globals.d.ts": `
declare const count: number;
declare const doSomething: () => void;
declare const promise: Promise<void>;
declare const something: boolean;
declare const somethingThatThrows: () => void;
`,
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
test("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
test("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
test("test", () => {
    something ? expect(something).toBe(true) : null;
});
`,
			snapshot: `
test("test", () => {
    something ? expect(something).toBe(true) : null;
                ~~~~~~~~~~~~~~~~~
                Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
test("test", () => {
    switch (something) {
        case true:
            expect(something).toBe(true);
    }
});
`,
			snapshot: `
test("test", () => {
    switch (something) {
        case true:
            expect(something).toBe(true);
            ~~~~~~~~~~~~~~~~~
            Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
test("test", () => {
    something && expect(something).toBe(true);
});
`,
			snapshot: `
test("test", () => {
    something && expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
test("test", () => {
    something || expect(something).toBe(true);
});
`,
			snapshot: `
test("test", () => {
    something || expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
test("test", () => {
    something ?? expect(something).toBe(true);
});
`,
			snapshot: `
test("test", () => {
    something ?? expect(something).toBe(true);
                 ~~~~~~~~~~~~~~~~~
                 Avoid calling \`expect\` inside conditional statements
});
`,
		},
		{
			code: `
test("test", () => {
    try {
        somethingThatThrows();
    } catch (error) {
        expect(error).toBeDefined();
    }
});
`,
			snapshot: `
test("test", () => {
    try {
        somethingThatThrows();
    } catch (error) {
        expect(error).toBeDefined();
        ~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
it("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
it("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
promise.catch(() => {
    expect(true).toBe(false);
});
`,
			snapshot: `
promise.catch(() => {
    expect(true).toBe(false);
    ~~~~~~~~~~~~
    Avoid calling \`expect\` inside a \`.catch()\` handler
});
`,
		},
		{
			code: `
test("test", () => {
    expect.assertions(1);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
test("test", () => {
    expect.assertions(1);
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
function assertSomething() {
    if (something) {
        expect(something).toBe(true);
    }
}

test("test", assertSomething);
`,
			snapshot: `
function assertSomething() {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
}

test("test", assertSomething);
`,
		},
		{
			code: `
test("test", () => {
    if (something) {
        function helper() {}
        expect(something).toBe(true);
    }
});
`,
			snapshot: `
test("test", () => {
    if (something) {
        function helper() {}
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
test("test", () => {
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
test("test", () => {
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
test("test", () => {
    expect.hasAssertions();
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
test("test", () => {
    expect.hasAssertions();
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
test("test", () => {
    expect.assertions(count);
    if (something) {
        expect(something).toBe(true);
    }
});
`,
			options: { expectAssertions: true },
			snapshot: `
test("test", () => {
    expect.assertions(count);
    if (something) {
        expect(something).toBe(true);
        ~~~~~~~~~~~~~~~~~
        Avoid calling \`expect\` inside conditional statements
    }
});
`,
		},
		{
			code: `
promise["catch"](() => {
    expect(true).toBe(false);
});
`,
			snapshot: `
promise["catch"](() => {
    expect(true).toBe(false);
    ~~~~~~~~~~~~
    Avoid calling \`expect\` inside a \`.catch()\` handler
});
`,
		},
	],
	valid: [
		`test("test", () => { expect(true).toBe(true); });`,
		`test("test", () => { expect(1 + 1).toBe(2); });`,
		`test("test", () => { if (something) { doSomething(); } });`,
		`if (something) { expect(something).toBe(true); }`,
		`describe("suite", () => { if (something) { expect(something).toBe(true); } });`,
		{
			code: `
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
function helper() {
    if (something) {
        expect(something).toBe(true);
    }
}
`,
	],
});
