import { SyntaxKind, type NodeArray } from "typescript-native/unstable/ast";

import {
	getStaticStringValue,
	isGlobalDeclarationOfName,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

export interface RegExpConstruction {
	args: NodeArray<AST.Expression>;
	flags: string;
	pattern: string;
	raw: string;
	start: number;
}

export function getRegExpConstruction(
	node: AST.CallExpression | AST.NewExpression,
	{ checker, program, sourceFile }: TypeScriptFileServices,
): RegExpConstruction | undefined {
	if (
		node.expression.kind !== SyntaxKind.Identifier ||
		node.expression.text !== "RegExp" ||
		!isGlobalDeclarationOfName(node.expression, "RegExp", checker, program)
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
		firstArgument.kind !== SyntaxKind.StringLiteral &&
		firstArgument.kind !== SyntaxKind.NoSubstitutionTemplateLiteral
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
