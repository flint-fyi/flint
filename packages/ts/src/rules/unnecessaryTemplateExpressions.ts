import type ts from "typescript";
import { SyntaxKind, TypeFlags } from "typescript";

import {
	declarationIncludesGlobal,
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

const lineTerminatorStart = /^(?:\r\n?|[\n\u2028\u2029])/u;

const strongExpressionKinds = new Set<SyntaxKind>([
	SyntaxKind.ArrayLiteralExpression,
	SyntaxKind.CallExpression,
	SyntaxKind.ElementAccessExpression,
	SyntaxKind.FalseKeyword,
	SyntaxKind.Identifier,
	SyntaxKind.MetaProperty,
	SyntaxKind.NewExpression,
	SyntaxKind.NonNullExpression,
	SyntaxKind.NoSubstitutionTemplateLiteral,
	SyntaxKind.NullKeyword,
	SyntaxKind.NumericLiteral,
	SyntaxKind.ObjectLiteralExpression,
	SyntaxKind.ParenthesizedExpression,
	SyntaxKind.PropertyAccessExpression,
	SyntaxKind.StringLiteral,
	SyntaxKind.TemplateExpression,
	SyntaxKind.ThisKeyword,
	SyntaxKind.TrueKeyword,
]);

function containsTypeSpaceTransformation(type: ts.Type): boolean {
	if (
		type.flags &
		(TypeFlags.Enum | TypeFlags.EnumLiteral | TypeFlags.TypeParameter)
	) {
		return true;
	}
	return type.isUnion() || type.isIntersection()
		? type.types.some(containsTypeSpaceTransformation)
		: false;
}

function delimiterRange(
	node: AST.TemplateLiteralTypeSpan | AST.TemplateSpan,
	sourceFile: AST.SourceFile,
) {
	const begin = getSpanValue(node).pos - 2;
	const end = node.literal.getStart(sourceFile) + 1;
	return { begin, end };
}

function encodeTemplateText(value: string) {
	let encoded = "";
	for (let index = 0; index < value.length; index++) {
		const code = value.charCodeAt(index);
		const character = value.charAt(index);
		if (character === "\\") {
			encoded += "\\\\";
		} else if (character === "`") {
			encoded += "\\`";
		} else if (character === "$" && value[index + 1] === "{") {
			encoded += "\\$";
		} else if (character === "\n") {
			encoded += "\\n";
		} else if (character === "\r") {
			encoded += "\\r";
		} else if (character === "\t") {
			encoded += "\\t";
		} else if (character === "\v") {
			encoded += "\\v";
		} else if (character === "\f") {
			encoded += "\\f";
		} else if (character === "\b") {
			encoded += "\\b";
		} else if (code === 0) {
			encoded += "\\x00";
		} else if (
			code === 0x2028 ||
			code === 0x2029 ||
			code < 0x20 ||
			(code >= 0xd800 && code <= 0xdfff)
		) {
			encoded += `\\u${code.toString(16).toUpperCase().padStart(4, "0")}`;
		} else {
			encoded += character;
		}
	}
	return encoded;
}

function endsWithUnescapedDollar(value: string) {
	if (!value.endsWith("$")) {
		return false;
	}
	let backslashes = 0;
	for (let index = value.length - 2; value[index] === "\\"; index--) {
		backslashes++;
	}
	return backslashes % 2 === 0;
}

function getRawLiteralText(
	node: AST.TemplateHead | AST.TemplateMiddle | AST.TemplateTail,
	sourceFile: AST.SourceFile,
) {
	const range = getTSNodeRange(node, sourceFile);
	return sourceFile.text.slice(
		range.begin + 1,
		range.end - (node.kind === SyntaxKind.TemplateTail ? 1 : 2),
	);
}

function getSpanValue(node: AST.TemplateLiteralTypeSpan | AST.TemplateSpan) {
	return node.kind === SyntaxKind.TemplateSpan ? node.expression : node.type;
}

function hasDiscardedComments(
	node: AST.Expression | AST.TypeNode,
	range: { begin: number; end: number },
	sourceFile: AST.SourceFile,
) {
	return (
		countCommentsInRange(sourceFile.text, {
			begin: range.begin + 2,
			end: node.getStart(sourceFile),
		}) > 0 ||
		countCommentsInRange(sourceFile.text, {
			begin: node.end,
			end: range.end - 1,
		}) > 0
	);
}

function isDefinitelyStringLike(
	typeChecker: ts.TypeChecker,
	type: ts.Type,
	typeSpace: boolean,
	seen = new Set<ts.Type>(),
): boolean {
	if (typeSpace && containsTypeSpaceTransformation(type)) {
		return false;
	}
	if (
		seen.has(type) ||
		type.flags & (TypeFlags.Any | TypeFlags.Unknown | TypeFlags.Never)
	) {
		return false;
	}
	seen.add(type);
	if (type.flags & TypeFlags.TypeParameter) {
		const constraint = typeChecker.getBaseConstraintOfType(type);
		return (
			!!constraint &&
			isDefinitelyStringLike(typeChecker, constraint, false, seen)
		);
	}
	if (type.isUnion()) {
		return type.types.every((part) =>
			isDefinitelyStringLike(typeChecker, part, typeSpace, new Set(seen)),
		);
	}
	if (type.isIntersection()) {
		return type.types.some((part) =>
			isDefinitelyStringLike(typeChecker, part, typeSpace, new Set(seen)),
		);
	}
	return !!(type.flags & TypeFlags.StringLike);
}

function isStrongExpression(node: AST.Expression) {
	return strongExpressionKinds.has(node.kind);
}

function syntaxReplacement(
	node: AST.Expression | AST.TypeNode,
	sourceFile: AST.SourceFile,
	program: ts.Program,
	typeChecker: TypeScriptFileServices["typeChecker"],
) {
	switch (node.kind) {
		case SyntaxKind.BigIntLiteral:
			return {
				text: BigInt(node.text.slice(0, -1)).toString(),
				whitespace: false,
			};
		case SyntaxKind.FalseKeyword:
			return { text: "false", whitespace: false };
		case SyntaxKind.Identifier:
			return ["Infinity", "NaN", "undefined"].includes(node.text) &&
				isGlobalVariable(node, typeChecker, program) &&
				!typeChecker
					.getSymbolAtLocation(node)
					?.getDeclarations()
					?.some(
						(declaration) => !declarationIncludesGlobal(declaration, program),
					)
				? { text: node.text, whitespace: false }
				: undefined;
		case SyntaxKind.LiteralType:
			return syntaxReplacement(node.literal, sourceFile, program, typeChecker);
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.StringLiteral:
			return {
				text: encodeTemplateText(node.text),
				whitespace: /^\s*$/u.test(node.text),
			};
		case SyntaxKind.NullKeyword:
			return { text: "null", whitespace: false };
		case SyntaxKind.NumericLiteral:
			return { text: node.text, whitespace: false };
		case SyntaxKind.RegularExpressionLiteral: {
			const lastSlash = node.text.lastIndexOf("/");
			try {
				return {
					text: encodeTemplateText(
						RegExp.prototype.toString.call(
							new RegExp(
								node.text.slice(1, lastSlash),
								node.text.slice(lastSlash + 1),
							),
						),
					),
					whitespace: false,
				};
			} catch {
				return undefined;
			}
		}
		case SyntaxKind.TemplateExpression:
		case SyntaxKind.TemplateLiteralType: {
			const range = getTSNodeRange(node, sourceFile);
			const text = sourceFile.text.slice(range.begin, range.end);
			return { text: text.slice(1, -1), whitespace: false };
		}
		case SyntaxKind.TrueKeyword:
			return { text: "true", whitespace: false };
		case SyntaxKind.UndefinedKeyword:
			return { text: "undefined", whitespace: false };
		default:
			return undefined;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports template expressions that can be simplified without changing their values.",
		id: "unnecessaryTemplateExpressions",
		presets: ["logical"],
	},
	messages: {
		staticSpan: {
			primary:
				"This template expression can be written directly in the template.",
			secondary: [
				"Static interpolation adds syntax without adding a dynamic value.",
				"Writing the value in the template makes its static nature clear.",
			],
			suggestions: ["Write the static value directly in the template."],
		},
		wholeWrapper: {
			primary:
				"This template expression wraps an already string-valued expression.",
			secondary: [
				"A template with no surrounding content does not change an expression that is already string-valued.",
				"Use the expression directly while preserving its grouping.",
			],
			suggestions: ["Use the wrapped expression directly."],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
			services: TypeScriptFileServices,
		) {
			const { program, sourceFile, typeChecker } = services;
			if (
				node.head.isUnterminated ||
				node.templateSpans.some(
					(span) =>
						span.literal.isUnterminated ||
						span.literal.pos === span.literal.end,
				)
			) {
				return;
			}
			if (
				node.kind === SyntaxKind.TemplateExpression &&
				node.parent.kind === SyntaxKind.TaggedTemplateExpression
			) {
				return;
			}
			const [firstSpan] = node.templateSpans;
			if (
				firstSpan &&
				node.templateSpans.length === 1 &&
				(node.kind === SyntaxKind.TemplateLiteralType ||
					(node.parent.kind !== SyntaxKind.TypeOfExpression &&
						node.parent.kind !== SyntaxKind.DeleteExpression)) &&
				getRawLiteralText(node.head, sourceFile) === "" &&
				getRawLiteralText(firstSpan.literal, sourceFile) === ""
			) {
				const span = firstSpan;
				const value = getSpanValue(span);
				const range = delimiterRange(span, sourceFile);
				if (
					!hasDiscardedComments(value, range, sourceFile) &&
					isDefinitelyStringLike(
						typeChecker,
						typeChecker.getTypeAtLocation(value),
						node.kind === SyntaxKind.TemplateLiteralType,
					)
				) {
					const nodeRange = getTSNodeRange(node, sourceFile);
					let text = sourceFile.text.slice(
						value.getStart(sourceFile),
						value.end,
					);
					if (node.kind === SyntaxKind.TemplateExpression) {
						if (
							!isStrongExpression(value as AST.Expression) ||
							node.parent.kind === SyntaxKind.ExpressionStatement
						) {
							text = `(${text})`;
						}
					} else if (
						[
							SyntaxKind.ConditionalType,
							SyntaxKind.ConstructorType,
							SyntaxKind.FunctionType,
							SyntaxKind.IntersectionType,
							SyntaxKind.TypeOperator,
							SyntaxKind.UnionType,
						].includes(value.kind)
					) {
						text = `(${text})`;
					}
					context.report({
						fix: { range: nodeRange, text },
						message: "wholeWrapper",
						range: nodeRange,
					});
					return;
				}
			}
			const candidates = node.templateSpans.map((span) => {
				const value = getSpanValue(span);
				const range = delimiterRange(span, sourceFile);
				if (hasDiscardedComments(value, range, sourceFile)) {
					return undefined;
				}
				const replacement = syntaxReplacement(
					value,
					sourceFile,
					program,
					typeChecker,
				);
				const followingRaw = getRawLiteralText(span.literal, sourceFile);
				return !replacement ||
					(replacement.whitespace && lineTerminatorStart.test(followingRaw))
					? undefined
					: { range, replacement };
			});

			function getFollowingCharacter(index: number): string | undefined {
				for (const [offset, span] of node.templateSpans
					.slice(index)
					.entries()) {
					const current = index + offset;
					const raw = getRawLiteralText(span.literal, sourceFile);
					if (raw) {
						return raw[0];
					}
					const next = candidates[current + 1];
					if (!next) {
						return current + 1 < node.templateSpans.length ? "$" : undefined;
					}
					if (next.replacement.text) {
						return next.replacement.text[0];
					}
				}
			}

			for (const [index, candidate] of candidates.entries()) {
				if (!candidate) {
					continue;
				}
				const { range: reportRange } = candidate;
				let range = reportRange;
				let text = candidate.replacement.text;
				const followingCharacter = getFollowingCharacter(index);
				if (endsWithUnescapedDollar(text) && followingCharacter === "{") {
					text = `${text.slice(0, -1)}\\$`;
				}
				const resultingFirstCharacter = text[0] ?? followingCharacter;
				const previousRaw = sourceFile.text.slice(0, range.begin);
				if (
					resultingFirstCharacter === "{" &&
					endsWithUnescapedDollar(previousRaw)
				) {
					range = { begin: range.begin - 1, end: range.end };
					text = `\\$${text}`;
				}
				context.report({
					fix: { range, text },
					message: "staticSpan",
					range: reportRange,
				});
			}
		}
		return {
			visitors: {
				TemplateExpression: checkNode,
				TemplateLiteralType: checkNode,
			},
		};
	},
});
