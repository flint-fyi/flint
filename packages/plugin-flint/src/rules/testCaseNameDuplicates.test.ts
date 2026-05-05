import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseNameDuplicates.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", name: "test case 1" },
						{ code: "b", name: "test case 1" },
					],
					invalid: []
				});
			
`,
			snapshot: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", name: "test case 1" },
						{ code: "b", name: "test case 1" },
						                   ~~~~~~~~~~~~~
						                   This test name already appeared in a previous test.
					],
					invalid: []
				});
			
`,
		},
		{
			code: `
				ruleTester.describe(rule, {
					valid: [],
					invalid: [
						{ code: "a", name: "test case 1", snapshot: "" },
						{ code: "b", name: "test case 1", snapshot: "" },
					]
				});
			
`,
			snapshot: `
				ruleTester.describe(rule, {
					valid: [],
					invalid: [
						{ code: "a", name: "test case 1", snapshot: "" },
						{ code: "b", name: "test case 1", snapshot: "" },
						                   ~~~~~~~~~~~~~
						                   This test name already appeared in a previous test.
					]
				});
			
`,
		},
		{
			code: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", name: "duplicate" },
						{ code: "b", name: "duplicate" },
						{ code: "c", name: "duplicate" },
					],
					invalid: []
				});
			
`,
			snapshot: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", name: "duplicate" },
						{ code: "b", name: "duplicate" },
						                   ~~~~~~~~~~~
						                   This test name already appeared in a previous test.
						{ code: "c", name: "duplicate" },
						                   ~~~~~~~~~~~
						                   This test name already appeared in a previous test.
					],
					invalid: []
				});
			
`,
		},
	],
	valid: [
		`
			describe(rule, {
				valid: [
					{ code: "a", name: "test case 1" },
					{ code: "b", name: "test case 1" },
				],
				invalid: []
			});
		`,
		`
			ruleTester.describe(rule, {
				valid: [
					{ code: "a", name: "test case 1" },
					{ code: "b", name: "test case 2" },
				],
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
					{ code: "a" },
					{ code: "b" },
				],
				invalid: []
			});
		`,
		`
			ruleTester.describe(rule, {
				valid: [
					{ code: "a", name: "same name" },
				],
				invalid: [
					{ code: "b", name: "same name", snapshot: "" },
				]
			});
		`,
	],
});
