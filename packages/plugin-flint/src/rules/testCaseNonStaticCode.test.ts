import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseNonStaticCode.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

const code = "a";
ruleTester.describe(rule, {
    valid: [code],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

const code = "a";
ruleTester.describe(rule, {
    valid: [code],
            ~~~~
            Test case code should be a static string literal.
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function getCode(): string;
ruleTester.describe(rule, {
    valid: [
        { code: getCode() },
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function getCode(): string;
ruleTester.describe(rule, {
    valid: [
        { code: getCode() },
                ~~~~~~~~~
                Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

const code = "a";
ruleTester.describe(rule, {
    valid: [
        { code },
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

const code = "a";
ruleTester.describe(rule, {
    valid: [
        { code },
          ~~~~
          Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const b: string;
ruleTester.describe(rule, {
    valid: [
        { code: \`a\${b}\` },
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const b: string;
ruleTester.describe(rule, {
    valid: [
        { code: \`a\${b}\` },
                ~~~~~~~
                Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a".trim() },
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a".trim() },
                ~~~~~~~~~~
                Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a" + "b" },
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a" + "b" },
                ~~~~~~~~~
                Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const baseCase: { code: string };
ruleTester.describe(rule, {
    valid: [
        {...baseCase},
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const baseCase: { code: string };
ruleTester.describe(rule, {
    valid: [
        {...baseCase},
        ~~~~~~~~~~~~~
        Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function testCase(): { code: string };
ruleTester.describe(rule, {
    valid: [
        testCase(),
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function testCase(): { code: string };
ruleTester.describe(rule, {
    valid: [
        testCase(),
        ~~~~~~~~~~
        Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        true ? "a" : "b",
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        true ? "a" : "b",
        ~~~~~~~~~~~~~~~~
        Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function getCode(): string;
ruleTester.describe(rule, {
    valid: [],
    invalid: [
        { code: getCode(), snapshot: "" },
    ],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare function getCode(): string;
ruleTester.describe(rule, {
    valid: [],
    invalid: [
        { code: getCode(), snapshot: "" },
                ~~~~~~~~~
                Test case code should be a static string literal.
    ],
});

`,
		},
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const b: string;
ruleTester.describe(rule, {
    valid: [
        String.raw\`a\${b}\`,
    ],
    invalid: [],
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

declare const b: string;
ruleTester.describe(rule, {
    valid: [
        String.raw\`a\${b}\`,
        ~~~~~~~~~~~~~~~~~
        Test case code should be a static string literal.
    ],
    invalid: [],
});

`,
		},
	],
	valid: [
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ["a", 'b', \`c\`],
    invalid: [],
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [String.raw\`raw\`],
    invalid: [],
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a", name: "name" },
        { code: \`b\`, fileName: "b.ts", name: "file name" },
    ],
    invalid: [
        { code: "a", snapshot: "" },
    ],
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: [
        {
            code: \`
                console.log("a");
            \`,
            snapshot: \`
                console.log("a");
                ~~~~~~~~~~~~~~~~
                Report.
            \`,
        },
    ],
});
`,
	],
});
