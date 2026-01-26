import {
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function escapeForRegexLiteral(pattern: string) {
	if (pattern === "") {
		return "(?:)";
	}

	let result = "";
	let escaped = false;

	for (const char of pattern) {
		if (escaped) {
			result += char;
			escaped = false;
			continue;
		}

		if (char === "\\") {
			result += char;
			escaped = true;
			continue;
		}

		if (char === "/") {
			result += "\\/";
			continue;
		}

		if (char === "\n") {
			result += "\\n";
			continue;
		}

		if (char === "\r") {
			result += "\\r";
			continue;
		}

		if (char === "\u2028") {
			result += "\\u2028";
			continue;
		}

		if (char === "\u2029") {
			result += "\\u2029";
			continue;
		}

		result += char;
	}

	return result;
}

function getStringValue(node: ts.Expression) {
	if (
		node.kind === ts.SyntaxKind.StringLiteral ||
		node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return (node as ts.NoSubstitutionTemplateLiteral | ts.StringLiteral).text;
	}

	return undefined;
}

function isStaticString(node: ts.Expression) {
	return (
		node.kind === ts.SyntaxKind.StringLiteral ||
		node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Use a regular expression literal when the pattern is static.",
		id: "regexLiterals",
		presets: ["logical"],
	},
	messages: {
		preferLiteral: {
			primary: "Use a regular expression literal when the pattern is static.",
			secondary: [
				"Regex literals are more concise and avoid unnecessary constructor calls.",
			],
			suggestions: ["Replace with regex literal `{{ literal }}`."],
		},
	},
	setup(context) {
		function checkRegExpCall(
			node: ts.CallExpression | ts.NewExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (!ts.isIdentifier(node.expression)) {
				return;
			}

			if (node.expression.text !== "RegExp") {
				return;
			}

			if (!isGlobalDeclarationOfName(node.expression, "RegExp", typeChecker)) {
				return;
			}

			const args = node.arguments;
			if (!args || args.length === 0 || args.length > 2) {
				return;
			}

			const patternArg = args[0];
			if (!patternArg || !isStaticString(patternArg)) {
				return;
			}

			const pattern = getStringValue(patternArg);
			if (pattern === undefined) {
				return;
			}

			let flags = "";
			if (args.length === 2) {
				const flagsArg = args[1];
				if (!flagsArg || !isStaticString(flagsArg)) {
					return;
				}

				const flagsValue = getStringValue(flagsArg);
				if (flagsValue === undefined) {
					return;
				}

				flags = flagsValue;
			}

			if (!parseRegexpAst(pattern, flags)) {
				return;
			}

			const escapedPattern = escapeForRegexLiteral(pattern);
			const literal = `/${escapedPattern}/${flags}`;

			context.report({
				data: { literal },
				fix: {
					range: {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					},
					text: literal,
				},
				message: "preferLiteral",
				range: {
					begin: node.getStart(sourceFile),
					end: node.expression.getEnd(),
				},
			});
		}

		return {
			visitors: {
				CallExpression: checkRegExpCall,
				NewExpression: checkRegExpCall,
			},
		};
	},
});
