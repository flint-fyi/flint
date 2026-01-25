import { ruleTester } from "./ruleTester.ts";
import rule from "./testShorthands.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
                ruleTester.describe(rule, {
                    valid: ['a', { code: 'a' }],
                    invalid: []
                });
            
`,
			snapshot: `
                ruleTester.describe(rule, {
                    valid: ['a', { code: 'a' }],
                                   ~~~~~~~~~
                                   Use string shorthand for test cases with only a code property.
                    invalid: []
                });
            
`,
		},
		{
			code: `
                ruleTester.describe(rule, {
                    valid: [
                        'a',
                        {
                          code: 'a'
                        }
                    ],
                    invalid: []
                });
            
`,
			snapshot: `
                ruleTester.describe(rule, {
                    valid: [
                        'a',
                        {
                          code: 'a'
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
            ruleTester.describe(rule, {
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
