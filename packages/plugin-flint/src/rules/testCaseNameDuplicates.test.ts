import { ruleTester } from "./ruleTester.ts";
import rule from "./testCaseNameDuplicates.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
	valid: [
		{ code: "a", name: "test case 1" },
		{ code: "b", name: "test case 1" },
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
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

ruleTester.describe(rule, {
	valid: [],
	invalid: [
		{ code: "a", name: "test case 1", snapshot: "" },
		{ code: "b", name: "test case 1", snapshot: "" },
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
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

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
import { RuleTester } from "@flint.fyi/rule-tester";
import rule from "../ruleCreationMethods";

const ruleTester = new RuleTester();

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
import { describe } from "vitest";

import rule from "../ruleCreationMethods";

describe(rule.about.id, () => {
	const tests = {
		valid: [
			{ code: "a", name: "test case 1" },
			{ code: "b", name: "test case 1" },
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
		{ code: "a", name: "test case 1" },
		{ code: "b", name: "test case 2" },
	],
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
		{ code: "a" },
		{ code: "b" },
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
		{ code: "a", name: "same name" },
	],
	invalid: [
		{ code: "b", name: "same name", snapshot: "" },
	]
});
`,
	],
});
