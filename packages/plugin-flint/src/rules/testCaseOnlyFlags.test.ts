import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseOnlyFlags.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", only: true },
					],
					invalid: []
				});

`,
			snapshot: `
				ruleTester.describe(rule, {
					valid: [
						{ code: "a", only: true },
						             ~~~~~~~~~~
						             Do not commit test cases with \`only: true\`.
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
						{ code: "a", only: true, snapshot: "" },
					]
				});

`,
			snapshot: `
				ruleTester.describe(rule, {
					valid: [],
					invalid: [
						{ code: "a", only: true, snapshot: "" },
						             ~~~~~~~~~~
						             Do not commit test cases with \`only: true\`.
					]
				});

`,
		},
	],
	valid: [
		`
			describe(rule, {
				valid: [
					{ code: "a", only: true },
				],
				invalid: []
			});
		`,
		`
			ruleTester.describe(rule, {
				valid: [
					{ code: "a", only: false },
				],
				invalid: [
					{ code: "b", only: false, snapshot: "" },
				]
			});
		`,
		`
			ruleTester.describe(rule, {
				valid: [
					"a",
					{ code: "b" },
				],
				invalid: []
			});
		`,
	],
});
