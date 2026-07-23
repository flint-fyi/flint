import { ruleTester } from "../ruleTester.ts";
import rule from "./conditionalExpects.ts";

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
    Avoid calling \`expect\` inside conditional statements
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
	],
	valid: [
		`test("test", () => { expect(true).toBe(true); });`,
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
		`
function helper() {
    if (something) {
        expect(something).toBe(true);
    }
}
`,
	],
});
