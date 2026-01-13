import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseDuplicates.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
                ruleTester.describe(rule, {
                    valid: ['a', 'a'],
                    invalid: []
                });
            `,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        'a',
                        "a",
                    ],
                    invalid: []
                });
            `,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        \`a\`,
                        \`a\`,
                    ],
                    invalid: []
                });
            `,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a" },
                        { code: "a" },
                    ],
                    invalid: []
                });
            `,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a", fileName: "b.ts" },
                        { code: "a", fileName: "b.ts" },
                    ],
                    invalid: []
                });
            `,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a", fileName: "b.ts", options: { c: "d" } },
                        { code: "a", fileName: "b.ts", options: { c: "d" } },
                    ],
                    invalid: []
                });
            `,
			snapshot: `
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a", fileName: "b.ts", options: { c: "d" } },
                        { code: "a", fileName: "b.ts", options: { c: "d" } },
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        This test code already appeared in a previous test.
                    ],
                    invalid: []
                });
            `,
		},
	],
	valid: [
		`
            describe(rule, {
                valid: ['a', 'a'],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: ['a', 'b'],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: \`a\`, fileName: "b.ts" },
                    { code: \`a\`, fileName: "c.ts" },
                ],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: \`a\`, fileName: "b.ts", options: { c: "d" } },
                    { code: \`a\`, fileName: "b.ts", options: { c: "e" } },
                ],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: \`a\`, fileName: "b.ts", options: { c: "d" } },
                    { code: \`a\`, fileName: "c.ts", options: { c: "d" } },
                ],
                invalid: []
            });
        `,
	],
});
