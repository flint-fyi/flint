import { visitRegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
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
					const details = getRegExpLiteralDetails(node, { sourceFile });
					const regexpAst = parseRegexpAst(details.pattern, details.flags);
					if (!regexpAst) {
						return;
					}

					visitRegExpAST(regexpAst, {
						onBackreferenceEnter(backNode) {
							if (
								Array.isArray(backNode.resolved) ||
								!backNode.resolved.name ||
								backNode.raw.startsWith("\\k<")
							) {
								return;
							}

							const range = {
								begin: details.start + backNode.start,
								end: details.start + backNode.end,
							};

							context.report({
								data: {
									found: backNode.raw,
									name: backNode.resolved.name,
								},
								fix: {
									range,
									text: `\\k<${backNode.resolved.name}>`,
								},
								message: "preferNamed",
								range,
							});
						},
					});
				},
			},
		};
	},
});
