import rule from "./pluginRuleOrdering.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;
declare const gammaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		gammaRule,
		alphaRule,
		betaRule,
	],
});
`,
			output: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;
declare const gammaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		alphaRule,
		betaRule,
		gammaRule,
	],
});
`,
			snapshot: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;
declare const gammaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		gammaRule,
		~~~~~~~~~
		Flint plugin rules should be listed in alphabetical order.
		alphaRule,
		betaRule,
	],
});
`,
		},
		{
			code: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		betaRule, // keep this comment
		alphaRule,
	],
});
`,
			snapshot: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		betaRule, // keep this comment
		~~~~~~~~
		Flint plugin rules should be listed in alphabetical order.
		alphaRule,
	],
});
`,
		},
		{
			code: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const regexCharacterClasses: any;
declare const regexCharacterClassRanges: any;

makePlugin({
	name: "Plugin",
	rules: [
		regexCharacterClassRanges,
		regexCharacterClasses,
	],
});
`,
			output: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const regexCharacterClasses: any;
declare const regexCharacterClassRanges: any;

makePlugin({
	name: "Plugin",
	rules: [
		regexCharacterClasses,
		regexCharacterClassRanges,
	],
});
`,
			snapshot: `
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const regexCharacterClasses: any;
declare const regexCharacterClassRanges: any;

makePlugin({
	name: "Plugin",
	rules: [
		regexCharacterClassRanges,
		~~~~~~~~~~~~~~~~~~~~~~~~~
		Flint plugin rules should be listed in alphabetical order.
		regexCharacterClasses,
	],
});
`,
		},
	],
	valid: [
		`
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;

makePlugin({
	name: "Plugin",
	rules: [
		alphaRule,
		betaRule,
	],
});
`,
		`
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const regexCharacterClasses: any;
declare const regexCharacterClassRanges: any;

makePlugin({
	name: "Plugin",
	rules: [
		regexCharacterClasses,
		regexCharacterClassRanges,
	],
});
`,
		`
import { createPlugin as makePlugin } from "@flint.fyi/core";

declare const alphaRule: any;
declare const betaRule: any;
declare const gammaRule: any;
declare const otherRules: any[];

makePlugin({
	name: "Plugin",
	rules: [alphaRule, ...otherRules, gammaRule],
});
`,
		`
declare function createPlugin(options: {
	name: string;
	rules: unknown[];
}): void;

declare const alphaRule: any;
declare const betaRule: any;

createPlugin({
	name: "Local",
	rules: [betaRule, alphaRule],
});
`,
	],
});
