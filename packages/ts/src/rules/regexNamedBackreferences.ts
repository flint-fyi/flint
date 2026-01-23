import { visitRegExpAST } from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports backreferences that do not use the name of their referenced capturing group.",
		id: "regexNamedBackreferences",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferNamed: {
			primary:
				"Prefer named backreference `\\k<{{ name }}>` over numeric backreference `{{ found }}`.",
			secondary: [
				"Named backreferences are more readable and maintainable than numeric ones.",
				"If the capturing group has a name, the backreference should use that name.",
			],
			suggestions: ["Replace `{{ found }}` with `\\k<{{ name }}>`"],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
					if (!match) {
						return;
					}

					const [, pattern, flagsStr = ""] = match;
					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flagsStr);
					if (!regexpAst) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onBackreferenceEnter(bNode) {
							const resolved = bNode.resolved;

							if (Array.isArray(resolved)) {
								return;
							}

							if (!resolved.name) {
								return;
							}

							if (bNode.raw.startsWith("\\k<")) {
								return;
							}

							const name = resolved.name;

							context.report({
								data: {
									found: bNode.raw,
									name,
								},
								fix: {
									range: {
										begin: range.begin + 1 + bNode.start,
										end: range.begin + 1 + bNode.end,
									},
									text: `\\k<${name}>`,
								},
								message: "preferNamed",
								range: {
									begin: range.begin + 1 + bNode.start,
									end: range.begin + 1 + bNode.end,
								},
							});
						},
					});
				},
			},
		};
	},
});
