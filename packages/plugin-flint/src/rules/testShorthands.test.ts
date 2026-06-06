import { ruleTester } from "./ruleTester.ts";
import rule from "./testShorthands.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', { code: 'b' }],
    invalid: []
});

`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', 'b'],
    invalid: []
});

`,
			snapshot: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: ['a', { code: 'b' }],
                   ~~~~~~~~~
                   Use string shorthand for test cases with only a code property.
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
        {
          code: 'b'
        }
    ],
    invalid: []
});

`,
			output: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
    valid: [
        'a',
        'b'
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
        {
          code: 'b'
          ~~~~~~~~~
          Use string shorthand for test cases with only a code property.
        }
    ],
    invalid: []
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
    valid: ['a', 'a'],
    invalid: []
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
        { code: \`a\`, name: "first" },
        { code: \`a\`, name: "second" },
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
        { code: \`a\`, fileName: "b.ts", name: "first" },
        { code: \`a\`, fileName: "c.ts", name: "second" },
    ],
    invalid: []
});
`,
	],
});
