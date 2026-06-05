import ts from "typescript";

import { jsonLanguage } from "@flint.fyi/json-language";
import { getTSNodeRange } from "@flint.fyi/typescript-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

const providerRegexes = {
	bitbucket:
		/^(?:git\+)?(?:ssh:\/\/git@|http?s:\/\/)?(?:www\.)?bitbucket\.org\//,
	gist: /^(?:git\+)?(?:ssh:\/\/git@|http?s:\/\/)?(?:www\.)?gist\.github\.com\//,
	github: /^(?:git\+)?(?:ssh:\/\/git@|http?s:\/\/)?(?:www\.)?github\.com\//,
	gitlab: /^(?:git\+)?(?:ssh:\/\/git@|http?s:\/\/)?(?:www\.)?gitlab\.com\//,
} satisfies Record<string, RegExp>;
type Provider = keyof typeof providerRegexes;

const providerUrls = {
	bitbucket: "https://bitbucket.org/",
	gist: "https://gist.github.com/",
	github: "https://github.com/",
	gitlab: "https://gitlab.com/",
} satisfies Record<Provider, string>;

const isProvider = (value: string): value is Provider =>
	value in providerRegexes;

function createUrl(shorthand: string) {
	if (!shorthand.includes(":")) {
		// If this is definitely not a valid repository, bail out
		if (shorthand.split("/").filter(Boolean).length < 2) {
			return undefined;
		}

		// If the provider is missing or unrecognized, default to GitHub
		return `${providerUrls.github}${shorthand}`;
	}

	// Use the appropriate provider url if one is specified
	const [provider, repository] = shorthand.split(":");
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (isProvider(provider!) && repository) {
		return `${providerUrls[provider]}${repository}`;
	}
}

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description: `Enforces using an object locator for \`repository\`.`,
		id: "repositoryShorthand",
	},
	messages: {
		shorthand: {
			primary: `Repository string shorthand values are no longer considered valid by npm.`,
			secondary: [
				`npm used to allow \`repository\` values to be provided as string values like this.`,
				`The npm systems would normalize them to full objects behind-the-scenes on publish.`,
				`npm no longer allows these kinds of differences between local \`package.json\` files and published contents.`,
			],
			suggestions: [`Switch to the standard object form.`],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile: (node) => {
					const property = getPackagePropertyOfName(node, "repository");
					if (
						property?.kind !== ts.SyntaxKind.PropertyAssignment ||
						property.initializer.kind !== ts.SyntaxKind.StringLiteral
					) {
						return;
					}

					const range = getTSNodeRange(property.initializer, node);
					const url = createUrl(property.initializer.text);

					context.report({
						fix: url
							? {
									range,
									text: JSON.stringify({
										type: "git",
										url,
									}),
								}
							: undefined,
						message: "shorthand",
						range,
					});
				},
			},
		};
	},
});
