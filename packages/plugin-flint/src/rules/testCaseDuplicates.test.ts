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
    valid: [
        { files: { "a.ts": "a", "b.ts": "b" } },
        { files: { "b.ts": "b", "a.ts": "a" } },
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
        { files: { "a.ts": "a", "b.ts": "b" } },
        { files: { "b.ts": "b", "a.ts": "a" } },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        This test code already appeared in a previous test.
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

ruleTester.describe(rule as any, {
    valid: [
        { files: { "b.ts": "a" }, options: { c: "d" } },
        { files: { "b.ts": "a" }, options: { c: "d" } },
    ],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule as any, {
    valid: [
        { files: { "b.ts": "a" }, options: { c: "d" } },
        { files: { "b.ts": "a" }, options: { c: "d" } },
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
        String.raw\`a\`,
        String.raw\`a\`,
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
        String.raw\`a\`,
        String.raw\`a\`,
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
        "a\\\\n",
        String.raw\`a\\n\`,
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
        "a\\\\n",
        String.raw\`a\\n\`,
        ~~~~~~~~~~~~~~~
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
        { code: "a" },
        { code: String.raw\`a\` },
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
        { code: String.raw\`a\` },
        ~~~~~~~~~~~~~~~~~~~~~~~
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
        { files: { "b.ts": "a" } },
        { files: { "b.ts": "a" } },
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
        { files: { "b.ts": "a" } },
        { files: { "b.ts": "a" } },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~
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
        { files: { "b.ts": "a" }, name: "first" },
        { files: { "b.ts": "a" }, name: "second" },
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
        { files: { "b.ts": "a" }, name: "first" },
        { files: { "b.ts": "a" }, name: "second" },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: [
        { code: "a", snapshot: String.raw\`a\` },
        { code: "a", snapshot: String.raw\`a\` },
    ]
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [],
    invalid: [
        { code: "a", snapshot: String.raw\`a\` },
        { code: "a", snapshot: String.raw\`a\` },
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        This test code already appeared in a previous test.
    ]
});

`,
		},
	],
	valid: [
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();
const first = { code: "a" };
const second = { code: "b" };

ruleTester.describe(rule, {
    valid: [
        { ...first, files: { "auxiliary.ts": "same" } },
        { ...second, files: { "auxiliary.ts": "same" } },
    ],
    invalid: [],
});
`,
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
        { files: { "b.ts": \`a\` } },
        { files: { "c.ts": \`a\` } },
    ],
    invalid: []
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule as any, {
    valid: [
        { files: { "b.ts": \`a\` }, options: { c: "d" } },
        { files: { "b.ts": \`a\` }, options: { c: "e" } },
    ],
    invalid: []
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule as any, {
    valid: [
        { files: { "b.ts": \`a\` }, options: { c: "d" } },
        { files: { "c.ts": \`a\` }, options: { c: "d" } },
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
