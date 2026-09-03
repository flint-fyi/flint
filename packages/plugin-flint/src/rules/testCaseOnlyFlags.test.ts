import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseOnlyFlags.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
	valid: [
		{ code: "a", only: true },
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
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
	valid: [],
	invalid: [
		{ code: "a", only: true, snapshot: "" },
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
import { describe } from "vitest";

import rule from "../ruleCreationMethods";

describe(rule.about.id, () => {
	const tests = {
		valid: [
			{ code: "a", only: true },
		],
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
	valid: [
		{ code: "a", only: false },
	],
	invalid: [
		{ code: "b", only: false, snapshot: "" },
	]
});
`,
		`
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

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
