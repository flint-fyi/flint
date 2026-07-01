import ts from "typescript";

import {
	getStaticStringValue,
	isGlobalDeclarationOfName,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

export function getRegExpConstruction(
	node: AST.CallExpression | AST.NewExpression,
	{ sourceFile, typeChecker }: TypeScriptFileServices,
) {
	if (
		node.expression.kind !== ts.SyntaxKind.Identifier ||
		node.expression.text !== "RegExp" ||
		!isGlobalDeclarationOfName(node.expression, "RegExp", typeChecker)
	) {
		return;
	}

	const args = node.arguments;
	if (!args?.length) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstArgument = args[0]!;

	if (
		firstArgument.kind !== ts.SyntaxKind.StringLiteral &&
		firstArgument.kind !== ts.SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return;
	}

	let flags = "";
	if (args.length >= 2) {
		const flagsArg = args[1];
		const flagsValue =
			flagsArg === undefined ? undefined : getStaticStringValue(flagsArg);
		if (flagsValue !== undefined) {
			flags = flagsValue;
		}
	}

	return {
		args,
		flags,
		pattern: firstArgument.getText(sourceFile).slice(1, -1),
		raw: firstArgument.text,
		start: firstArgument.getStart(sourceFile),
	};
}
