import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function getRegexFlags(
	node: AST.Expression,
	sourceFile: AST.SourceFile,
): string | undefined {
	if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) {
		const text = node.getText(sourceFile);
		const lastSlash = text.lastIndexOf("/");
		return lastSlash >= 0 ? text.slice(lastSlash + 1) : "";
	}

	if (
		(node.kind === ts.SyntaxKind.NewExpression ||
			node.kind === ts.SyntaxKind.CallExpression) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "RegExp" &&
		node.arguments
	) {
		const flagsArg = node.arguments[1];
		if (!flagsArg) {
			return "";
		}
		if (ts.isStringLiteral(flagsArg)) {
			return flagsArg.text;
		}
		return undefined;
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `matchAll()` and `replaceAll()` calls with regex arguments missing the global flag.",
		id: "regexAllGlobalFlags",
		presets: ["logical"],
	},
	messages: {
		missingGlobalFlag: {
			primary:
				"The regex argument to {{method}}() requires the global (g) flag.",
			secondary: [
				"String.prototype.{{method}}() throws a TypeError at runtime if the regex argument lacks the global flag.",
				"Add the 'g' flag to the regex pattern.",
			],
			suggestions: ["Add the global (g) flag to the regex."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "matchAll" && methodName !== "replaceAll") {
						return;
					}

					const expectedArgCount = methodName === "matchAll" ? 1 : 2;
					if (node.arguments.length < expectedArgCount) {
						return;
					}

					const firstArg = node.arguments[0];
					if (!firstArg) {
						return;
					}

					const objectType = typeChecker.getTypeAtLocation(
						node.expression.expression,
					);
					if (
						!(objectType.flags & ts.TypeFlags.StringLike) &&
						!objectType.isStringLiteral()
					) {
						return;
					}

					const flags = getRegexFlags(firstArg, sourceFile);
					if (flags === undefined || flags.includes("g")) {
						return;
					}

					context.report({
						data: { method: methodName },
						message: "missingGlobalFlag",
						range: getTSNodeRange(firstArg, sourceFile),
					});
				},
			},
		};
	},
});
