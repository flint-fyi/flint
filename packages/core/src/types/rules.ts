import type { PromiseOrSync } from "@flint.fyi/utils";

import type { BaseAbout } from "./about.ts";
import type { RuleContext } from "./context.ts";
import type { LanguageBase, LanguageFile } from "./languages.ts";
import type { ReportMessageData } from "./reports.ts";
import type {
	AnyOptionalSchema,
	InferredOutputObject,
	OptionalObjectSchema,
} from "./shapes.ts";

/**
 * A single lint rule, as used by users in configs.
 */
export type AnyRule<
	About extends RuleAbout = RuleAbout,
	OptionsSchema extends AnyOptionalSchema | undefined =
		AnyOptionalSchema | undefined,
> = Rule<About, string, OptionsSchema>;

export type AnyRuleDefinition<
	OptionsSchema extends AnyOptionalSchema | undefined =
		AnyOptionalSchema | undefined,
> = RuleDefinition<RuleAbout, unknown, object, string, OptionsSchema>;

/**
 * Prefer explicitly setting the {@linkcode Rule} type arguments,
 * or, barring that, use {@linkcode AnyRule}.
 */
export type UnsafeAnyRule<About extends RuleAbout = RuleAbout> =
	// TODO: How to make these types work with createPlugin.test.ts & co.?
	// flint-disable-lines-begin ts/explicitAnys
	/* eslint-disable @typescript-eslint/no-explicit-any */
	Rule<About, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */
// flint-disable-lines-end ts/explicitAnys

export interface PluginRuleAbout<
	Preset extends string = string,
> extends RuleAbout<Preset> {
	/**
	 * ID of the plugin parent of this rule.
	 * @example "ts"
	 */
	readonly pluginId: string;

	readonly url: string;
}

/**
 * A rule's runtime with its visitors bound to the rule's language,
 * so they can only be given that language's files.
 */
export interface BoundRuleRuntime {
	/**
	 * Adds this rule's visitors to a file of its language, for the file's next `runFileVisitors`.
	 * @param file A file created by the rule's language.
	 * @param options The rule's options for the file, before parsing.
	 */
	addFileVisitors?: (file: LanguageFile, options: unknown) => void;
	dependencies?: string[];
	teardown?: RuleTeardown;
}

/**
 * A single lint rule, as used by users in configs.
 */
export interface Rule<
	About extends RuleAbout,
	MessageId extends string,
	OptionsSchema extends AnyOptionalSchema | undefined,
> {
	about: About;
	language: LanguageBase;
	messages: Record<MessageId, ReportMessageData>;
	options?: OptionalObjectSchema<OptionsSchema>;
	setup: (
		context: RuleContext<MessageId>,
	) => Promise<BoundRuleRuntime | undefined>;
}

export interface RuleAbout<Preset extends string = string> extends BaseAbout {
	readonly description: string;

	/**
	 * ID of the plugin parent of this rule, if this is part of a plugin.
	 * @example "ts"
	 */
	readonly pluginId?: string;

	readonly presets?: readonly Preset[];
}

/**
 * Metadata a rule passes to its plugin's rule creator.
 */
export interface RuleCreatorAbout<
	Preset extends string = string,
> extends RuleAbout<Preset> {
	/**
	 * This is set by the rule creator, so rules shouldn't try to pass it themselves.
	 */
	readonly pluginId?: never;
}

/**
 * The definition of a rule, as provided to rule creators internally.
 */
export interface RuleDefinition<
	About extends RuleAbout,
	AstNodesByName,
	FileServices extends object,
	MessageId extends string,
	OptionsSchema extends AnyOptionalSchema | undefined,
> {
	about: About;
	messages: Record<MessageId, ReportMessageData>;
	options?: OptionalObjectSchema<OptionsSchema>;
	setup: RuleSetup<
		AstNodesByName,
		FileServices,
		MessageId,
		InferredOutputObject<OptionsSchema>
	>;
}

export interface RuleRuntime<AstNodesByName, FileServices extends object> {
	dependencies?: string[];
	teardown?: RuleTeardown;
	visitors?: RuleVisitors<AstNodesByName, FileServices>;
}

export type RuleSetup<
	AstNodesByName,
	FileServices extends object,
	MessageId extends string,
	Options extends Record<string, unknown> | undefined,
> = (
	context: RuleContext<MessageId>,
) => PromiseOrSync<
	RuleRuntime<AstNodesByName, FileServices & { options: Options }> | undefined
>;

export type RuleTeardown = () => PromiseOrSync<undefined>;

export type RuleVisitor<ASTNode, VisitorServices extends object> = (
	node: ASTNode,
	services: VisitorServices,
) => void;

export type RuleVisitors<AstNodesByName, VisitorServices extends object> = {
	[Kind in keyof AstNodesByName]?: RuleVisitor<
		AstNodesByName[Kind],
		VisitorServices
	>;
};
