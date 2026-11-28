import { ruleTester } from "./ruleTester.ts";
import rule from "./strictPresetSupersets.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical"],
	},
	messages: {},
	setup: () => undefined,
});
`,
			snapshot: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical"],
		          ~~~~~~~~~
		          This rule is in the 'logical' preset but not the 'logicalStrict' preset.
	},
	messages: {},
	setup: () => undefined,
});
`,
			suggestions: [
				{
					id: "addStrictPreset",
					updated: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "logicalStrict"],
	},
	messages: {},
	setup: () => undefined,
});
`,
				},
			],
		},
		{
			code: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "logicalStrict", "stylistic"],
	},
	messages: {},
	setup: () => undefined,
});
`,
			snapshot: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "logicalStrict", "stylistic"],
		                                      ~~~~~~~~~~~
		                                      This rule is in the 'stylistic' preset but not the 'stylisticStrict' preset.
	},
	messages: {},
	setup: () => undefined,
});
`,
			suggestions: [
				{
					id: "addStrictPreset",
					updated: `
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
	},
	messages: {},
	setup: () => undefined,
});
`,
				},
			],
		},
	],
	valid: [
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "logicalStrict"],
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logicalStrict"],
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "stylistic"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical", "stylistic"],
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

declare function getDefinition(): Parameters<typeof ruleCreator.createRule>[1];

ruleCreator.createRule(typescriptLanguage, getDefinition());
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

declare const about: { description: string; id: string; presets: ["logical"] };

ruleCreator.createRule(typescriptLanguage, {
	about,
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical", "logicalStrict"],
});

const basePresets = ["logical"] as const;

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: [...basePresets, "logicalStrict"],
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
import { RuleCreator } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => ruleId,
	pluginId: "example",
	presets: ["logical"],
});

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical"],
	},
	messages: {},
	setup: () => undefined,
});
`,
		`
declare class RuleCreator {
	createRule(language: unknown, definition: unknown): void;
}

declare const ruleCreator: RuleCreator;

ruleCreator.createRule(undefined, {
	about: {
		description: "Example.",
		id: "example",
		presets: ["logical"],
	},
});
`,
	],
});
