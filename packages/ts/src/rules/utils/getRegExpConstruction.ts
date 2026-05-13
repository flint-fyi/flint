import {
	type AST,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

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

	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	if (
		firstArgument.kind !== ts.SyntaxKind.StringLiteral &&
		firstArgument.kind !== ts.SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return;
	}

	let flags = "";
	if (args.length >= 2) {
		const flagsArg = args[1];
		if (
			flagsArg?.kind === ts.SyntaxKind.StringLiteral ||
			flagsArg?.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
		) {
			const flagsText = flagsArg.getText(sourceFile);
			flags = flagsText.slice(1, -1);
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
