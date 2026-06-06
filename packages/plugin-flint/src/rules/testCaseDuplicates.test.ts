import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseDuplicates.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'a'],
                 ~~~
                 This test code already appeared in a previous test.
    invalid: []
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
        'a',
        "a",
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        'a',
        "a",
        ~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
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
        \`a\`,
        \`a\`,
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        \`a\`,
        \`a\`,
        ~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
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
        { code: "a" },
        { code: "a" },
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a" },
        { code: "a" },
        ~~~~~~~~~~~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
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
        { code: "a", fileName: "b.ts" },
        { code: "a", fileName: "b.ts" },
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a", fileName: "b.ts" },
        { code: "a", fileName: "b.ts" },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
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
        { code: "a", fileName: "b.ts", name: "first" },
        { code: "a", fileName: "b.ts", name: "second" },
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a", fileName: "b.ts", name: "first" },
        { code: "a", fileName: "b.ts", name: "second" },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
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
        { code: "a", files: { "b.ts": "{}" } },
        { code: "a", files: { "b.ts": "{}" } },
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: "a", files: { "b.ts": "{}" } },
        { code: "a", files: { "b.ts": "{}" } },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        This test code already appeared in a previous test.
    ],
    invalid: []
});

`,
		},
	],
	valid: [
		`
import { describe } from "vitest";

import rule from "../ruleCreationMethods";

describe(rule.about.id, () => {
    const tests = {
        valid: ['a', 'a'],
        invalid: []
    };
    void tests;
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'b'],
    invalid: []
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: \`a\`, fileName: "b.ts" },
        { code: \`a\`, fileName: "c.ts" },
    ],
    invalid: []
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        { code: \`a\`, files: { "b.ts": "{}" } },
        { code: \`a\`, files: { "c.ts": "{}" } },
    ],
    invalid: []
});
`,
	],
});
