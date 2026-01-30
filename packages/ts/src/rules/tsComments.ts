import type {
	MessageForContext,
	ReportInterpolationData,
} from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const directiveConfigSchema = z.union([
	z.literal(true),
	z.literal(false),
	z.literal("allow-with-description"),
	z.object({
		descriptionFormat: z
			.string()
			.describe(
				"A regular expression that the description must match for it to be considered valid.",
			),
	}),
]);

const options = {
	allowTsExpectError: directiveConfigSchema
		.default(false)
		.describe(
			"Whether to allow `@ts-expect-error` directives, and with which restrictions.",
		),
	allowTsIgnore: directiveConfigSchema
		.default(false)
		.describe("Whether to allow `@ts-ignore` directives."),
	allowTsNocheck: directiveConfigSchema
		.default(false)
		.describe("Whether to allow `@ts-nocheck` directives."),
	minimumDescriptionLength: z
		.number()
		.int()
		.min(0)
		.default(10)
		.describe(
			"The minimum length required for a description when using 'allow-with-description'.",
		),
};

type SuppressionDirective = "ts-expect-error" | "ts-ignore" | "ts-nocheck";

const tsDirectiveRegex =
	/^(?:\/\/\/?|\/\*)\s*@ts-(ignore|expect-error|nocheck|check)(?<description>[\s:*].*)?/i;

function createFixedComment(
	text: string,
	fromDirective: string,
	toDirective: string,
): string {
	return text.replace(
		new RegExp(`@ts-${fromDirective}`, "i"),
		`@ts-${toDirective}`,
	);
}

const directiveConfigKeys = new Map([
	["ts-expect-error", "allowTsExpectError"],
	["ts-ignore", "allowTsIgnore"],
	["ts-nocheck", "allowTsNocheck"],
] as const);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports problematic TypeScript comment directives or requires descriptions after directives.",
		id: "tsComments",
		presets: ["logical"],
	},
	messages: {
		descriptionNotMatchPattern: {
			primary:
				"The description for `{{ directive }}` does not match the preferred format: {{ format }}.",
			secondary: [
				"This project requires comment directive descriptions to match the configured pattern.",
				"This helps maintain consistent and informative comments.",
			],
			suggestions: [
				"Update the description to match the required format.",
				"Check the rule configuration for the expected pattern.",
			],
		},
		directiveComment: {
			primary:
				"This project does not allow using `@{{ directive }}` to suppress compilation errors.",
			secondary: [
				"Using TypeScript directive comments reduces the effectiveness of TypeScript's type system.",
				"Prefer fixing type errors or using targeted suppressions with descriptions.",
			],
			suggestions: [
				"Remove the directive and fix the underlying type error.",
				"If the suppression is necessary, add a description explaining why.",
			],
		},
		preferExpectError: {
			primary:
				"Prefer `@ts-expect-error` instead of `@ts-ignore`, as `@ts-expect-error` triggers type errors if it becomes unnecessary.",
			secondary: [
				"`@ts-expect-error` will report if the next line has no error.",
				"This helps identify stale suppressions when errors are fixed.",
			],
			suggestions: ["Replace `@ts-ignore` with `@ts-expect-error`."],
		},
		requiresDescription: {
			primary:
				"`@{{ directive }}` should include a description of at least {{ minimum }} characters.",
			secondary: [
				"A description helps explain why the suppression is necessary.",
				"This improves code maintainability and documentation.",
			],
			suggestions: [
				"Add a description explaining why this suppression is needed.",
			],
		},
	},
	options,
	setup(context) {
		return {
			visitors: {
				SourceFile(node, { options }) {
					function reportCommentDirective(
						comment: tsutils.Comment,
						directive: string,
						data: ReportInterpolationData,
						messageDefault: MessageForContext<typeof context>,
						messageIgnore = messageDefault,
					) {
						const range = { begin: comment.pos, end: comment.end };
						const [fix, message] =
							directive === "ts-ignore"
								? ([
										{
											range,
											text: createFixedComment(
												comment.text,
												"ignore",
												"expect-error",
											),
										},
										messageIgnore,
									] as const)
								: [undefined, messageDefault];

						context.report({
							data,
							fix,
							message,
							range,
						});
					}

					function getDirectiveOption(directive: SuppressionDirective) {
						const optionKey = directiveConfigKeys.get(directive);
						if (!optionKey) {
							return undefined;
						}

						return options[optionKey];
					}

					const descriptionFormats = new Map<string, RegExp>();
					for (const directive of [
						"ts-expect-error",
						"ts-ignore",
						"ts-nocheck",
					] as const) {
						const option = getDirectiveOption(directive);
						if (typeof option === "object" && option.descriptionFormat) {
							descriptionFormats.set(
								directive,
								new RegExp(option.descriptionFormat),
							);
						}
					}

					for (const comment of tsutils.iterateComments(node)) {
						const match = tsDirectiveRegex.exec(comment.text);
						if (!match) {
							continue;
						}

						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const directive = match[1]!.toLowerCase();
						const description = (match.groups?.description ?? "").trim();

						checkComment(
							comment,
							`ts-${directive}` as SuppressionDirective,
							description,
						);
					}

					function checkComment(
						comment: tsutils.Comment,
						directive: SuppressionDirective,
						description: string,
					) {
						const optionKey = directiveConfigKeys.get(directive);
						if (!optionKey) {
							return;
						}

						const config = options[optionKey];

						switch (config) {
							case "allow-with-description": {
								const cleanDescription = description
									.replace(/^[:\s*]+/, "")
									.replace(/\s*\*\/$/, "")
									.trim();

								if (
									cleanDescription.length < options.minimumDescriptionLength
								) {
									reportCommentDirective(
										comment,
										directive,
										{
											directive,
											minimum: options.minimumDescriptionLength,
										},
										"requiresDescription",
									);
									return;
								}
								break;
							}

							case false:
								return;

							case true: {
								reportCommentDirective(
									comment,
									directive,
									{ directive },
									"directiveComment",
									"preferExpectError",
								);
								return;
							}

							default: {
								if (typeof config === "object" && config.descriptionFormat) {
									const format = descriptionFormats.get(directive);
									if (format && !format.test(description)) {
										reportCommentDirective(
											comment,
											directive,
											{
												directive,
												format: format.source,
											},
											"descriptionNotMatchPattern",
										);
									}
								}
								break;
							}
						}
					}
				},
			},
		};
	},
});
