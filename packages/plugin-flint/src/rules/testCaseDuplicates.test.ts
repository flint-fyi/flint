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
		{
			code: `
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a", files: { "b.ts": "{}" } },
                        { code: "a", files: { "b.ts": "{}" } },
                    ],
                    invalid: []
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        String.raw\`/[a-z]/;\`,
                        String.raw\`/[a-z]/;\`,
                    ],
                    invalid: []
                });

`,
			snapshot: `
                ruleTester.describe(rule, {
                    valid: [
                        String.raw\`/[a-z]/;\`,
                        String.raw\`/[a-z]/;\`,
                        ~~~~~~~~~~~~~~~~~~~~
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
                        { code: String.raw\`/[a-z]/;\` },
                        { code: String.raw\`/[a-z]/;\` },
                    ],
                    invalid: []
                });

`,
			snapshot: `
                ruleTester.describe(rule, {
                    valid: [
                        { code: String.raw\`/[a-z]/;\` },
                        { code: String.raw\`/[a-z]/;\` },
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        This test code already appeared in a previous test.
                    ],
                    invalid: []
                });

`,
		},
		{
			code: `
                ruleTester.describe(rule, {
                    invalid: [
                        { code: String.raw\`/[a-z]/;\`, snapshot: "a" },
                        { code: String.raw\`/[a-z]/;\`, snapshot: "b" },
                    ],
                    valid: []
                });

`,
			snapshot: `
                ruleTester.describe(rule, {
                    invalid: [
                        { code: String.raw\`/[a-z]/;\`, snapshot: "a" },
                        { code: String.raw\`/[a-z]/;\`, snapshot: "b" },
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        This test code already appeared in a previous test.
                    ],
                    valid: []
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
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: \`a\`, files: { "b.ts": "{}" } },
                    { code: \`a\`, files: { "c.ts": "{}" } },
                ],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    String.raw\`/[a-z]/;\`,
                    String.raw\`/[0-9]/;\`,
                ],
                invalid: []
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: String.raw\`/[a-z]/;\` },
                    { code: String.raw\`/[0-9]/;\` },
                ],
                invalid: []
            });
        `,
	],
});
