import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseNonStaticCode.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
                const code = "a";
                ruleTester.describe(rule, {
                    valid: [code],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: getCode() },
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                const code = "a";
                ruleTester.describe(rule, {
                    valid: [
                        { code },
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: \`a\${b}\` },
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a".trim() },
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        { code: "a" + "b" },
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        {...baseCase},
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        testCase(),
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        true ? "a" : "b",
                    ],
                    invalid: [],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [],
                    invalid: [
                        { code: getCode(), snapshot: "" },
                    ],
                });
            
`,
			snapshot: `
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
                ruleTester.describe(rule, {
                    valid: [
                        String.raw\`a\${b}\`,
                    ],
                    invalid: [],
                });

`,
			snapshot: `
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
            ruleTester.describe(rule, {
                valid: ["a", 'b', \`c\`],
                invalid: [],
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [String.raw\`raw\`],
                invalid: [],
            });
        `,
		`
            ruleTester.describe(rule, {
                valid: [
                    { code: "a", name: "name" },
                    { code: \`b\`, fileName: "b.ts", options: { c: "d" } },
                ],
                invalid: [
                    { code: "a", snapshot: "" },
                ],
            });
        `,
		`
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
