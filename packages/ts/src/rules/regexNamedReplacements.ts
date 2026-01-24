import { visitRegExpAST } from "@eslint-community/regexpp";
import type { AST as RegExpAST } from "@eslint-community/regexpp";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface ReplacementReference {
	end: number;
	index: number;
	raw: string;
	start: number;
}

function getCapturingGroups(regexpAst: RegExpAST.Pattern) {
	const groups: RegExpAST.CapturingGroup[] = [];

	visitRegExpAST(regexpAst, {
		onCapturingGroupEnter(groupNode) {
			groups.push(groupNode);
		},
	});

	return groups;
}

function getRegexPatternAndFlags(node: AST.Expression) {
	if (node.kind !== ts.SyntaxKind.RegularExpressionLiteral) {
		return undefined;
	}

	const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
	if (!match) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return { flags: match[2]!, pattern: match[1]! };
}

function parseReplacementReferences(replacementText: string) {
	const references: ReplacementReference[] = [];

	const pattern = /\$(\d+)/g;
	let match: null | RegExpExecArray;

	while ((match = pattern.exec(replacementText))) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const index = parseInt(match[1]!, 10);
		if (index > 0) {
			references.push({
				end: match.index + match[0].length,
				index,
				raw: match[0],
				start: match.index,
			});
		}
	}

	return references;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports indexed references in replacement strings that should use named references.",
		id: "regexNamedReplacements",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferNamed: {
			primary:
				"Prefer the explicit named replacement `$<{{ name }}>` over the position-specific indexed replacement `{{ found }}`.",
			secondary: [
				"Named replacements are more readable and maintainable than indexed ones.",
				"If the capturing group has a name, the replacement should use that name.",
			],
			suggestions: ["Replace `{{ found }}` with `$<{{ name }}>`"],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						(node.expression.name.text !== "replace" &&
							node.expression.name.text !== "replaceAll") ||
						node.arguments.length < 2 ||
						!(
							getConstrainedTypeAtLocation(
								node.expression.expression,
								typeChecker,
							).flags & ts.TypeFlags.StringLike
						)
					) {
						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const regexArg = node.arguments[0]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const replacementArg = node.arguments[1]!;

					if (!ts.isStringLiteral(replacementArg)) {
						return;
					}

					const regexInfo = getRegexPatternAndFlags(regexArg);
					if (!regexInfo) {
						return;
					}

					const regexpAst = parseRegexpAst(regexInfo.pattern, regexInfo.flags);
					if (!regexpAst) {
						return;
					}

					const capturingGroups = getCapturingGroups(regexpAst);
					if (capturingGroups.length === 0) {
						return;
					}

					const references = parseReplacementReferences(replacementArg.text);
					const replacementRange = getTSNodeRange(replacementArg, sourceFile);

					for (const reference of references) {
						const group = capturingGroups[reference.index - 1];
						if (!group?.name) {
							continue;
						}

						context.report({
							data: {
								found: reference.raw,
								name: group.name,
							},
							fix: {
								range: {
									begin: replacementRange.begin + 1 + reference.start,
									end: replacementRange.begin + 1 + reference.end,
								},
								text: `$<${group.name}>`,
							},
							message: "preferNamed",
							range: {
								begin: replacementRange.begin + 1 + reference.start,
								end: replacementRange.begin + 1 + reference.end,
							},
						});
					}
				},
			},
		};
	},
});
