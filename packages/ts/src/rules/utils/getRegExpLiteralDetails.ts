import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

export interface RegExpLiteralDetails {
	flags: string;
	pattern: string;
	start: number;
}

export function getRegExpLiteralDetails(
	node: AST.RegularExpressionLiteral,
	{ sourceFile }: Pick<TypeScriptFileServices, "sourceFile">,
): RegExpLiteralDetails {
	const lastSlash = node.text.lastIndexOf("/");
	return {
		flags: node.text.slice(lastSlash + 1),
		pattern: node.text.slice(1, lastSlash),
		start: node.getStart(sourceFile) + 1,
	};
}
