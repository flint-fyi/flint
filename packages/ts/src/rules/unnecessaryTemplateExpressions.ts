import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

const evenNumOfBackslashesRegExp = /(?<!(?:[^\\]|^)(?:\\\\)*\\)/;

// '\\$' <- false
// '\\\\$' <- true
// '\\\\\\$' <- false
function buildReportRange(
	span: AST.TemplateLiteralTypeSpan | AST.TemplateSpan,
	previousLiteral: AST.TemplateHead | AST.TemplateMiddle | AST.TemplateTail,
) {
	const begin = previousLiteral.end - 2;
	const end = span.literal.pos + 1;

	return { begin, end };
}

function endsWithUnescapedDollarSign(value: string): boolean {
	return new RegExp(`${evenNumOfBackslashesRegExp.source}\\$$`).test(value);
}

function escapeTemplateLiteralText(
	value: string,
	nextStartsWithBrace: boolean,
) {
	let escapedValue = value
		.replaceAll("\\", "\\\\")
		.replaceAll(
			new RegExp(`${evenNumOfBackslashesRegExp.source}(\`|\\\${)`, "g"),
			"\\$1",
		);

	if (nextStartsWithBrace && endsWithUnescapedDollarSign(escapedValue)) {
		escapedValue = escapedValue.replaceAll(/\$$/g, "\\$");
	}

	return escapedValue;
}

function escapeTemplateLiteralValue(
	value: string,
	nextStartsWithBrace: boolean,
) {
	const escapedValue = escapeTemplateLiteralText(value, nextStartsWithBrace);
	return {
		nextStartsWithBrace: escapedValue.startsWith("{"),
		text: escapedValue,
	};
}

function getInterpolationInfos(
	node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
) {
	return node.templateSpans.map((span, index) => {
		const previousLiteral =
			index === 0 ? node.head : node.templateSpans[index - 1]!.literal;
		return {
			interpolation: isTemplateExpression(node) ? span.expression : span.type,
			nextLiteral: span.literal,
			previousLiteral,
			span,
		};
	});
}

function getInterpolationLiteral(
	node: AST.Expression | AST.TypeNode,
): AST.Expression | AST.LiteralTypeNode | AST.StringLiteral | null {
	if (isLiteralTypeNode(node)) {
		return node;
	}

	if (isStringLiteralNode(node) || isLiteralExpression(node)) {
		return node;
	}

	if (
		node.kind === ts.SyntaxKind.NullKeyword ||
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword
	) {
		return node as AST.Expression;
	}

	return null;
}

function getInterpolationTemplate(
	node: AST.Expression | AST.TypeNode,
): AST.TemplateExpression | AST.TemplateLiteralTypeNode | null {
	if (isTemplateLiteralNode(node)) {
		return node;
	}

	if (isLiteralTypeNode(node) && isTemplateLiteralTypeNode(node.literal)) {
		return node.literal;
	}

	return null;
}

function getLiteralFixText(
	interpolation: AST.Expression | AST.TypeNode,
	nextStartsWithBrace: boolean,
	sourceFile: AST.SourceFile,
) {
	const literalText = getLiteralText(interpolation, sourceFile);
	if (literalText == null) {
		return null;
	}

	const unwrapped =
		literalText.length >= 2 &&
		((literalText.startsWith('"') && literalText.endsWith('"')) ||
			(literalText.startsWith("'") && literalText.endsWith("'")) ||
			(literalText.startsWith("`") && literalText.endsWith("`")))
			? literalText.slice(1, -1)
			: literalText;

	const escaped = escapeTemplateLiteralValue(unwrapped, nextStartsWithBrace);
	return escaped;
}

function getLiteralText(
	node: AST.Expression | AST.LiteralTypeNode | AST.TypeNode,
	sourceFile: AST.SourceFile,
): null | string {
	if (isLiteralTypeNode(node)) {
		const literal = node.literal;
		if (literal.kind === ts.SyntaxKind.NullKeyword) {
			return "null";
		}
		if (literal.kind === ts.SyntaxKind.TrueKeyword) {
			return "true";
		}
		if (literal.kind === ts.SyntaxKind.FalseKeyword) {
			return "false";
		}
		if (
			literal.kind === ts.SyntaxKind.StringLiteral ||
			literal.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
		) {
			return literal.getText(sourceFile);
		}
		return literal.getText(sourceFile);
	}

	if (isNullKeywordNode(node)) {
		return "null";
	}
	if (isTrueOrFalseKeywordNode(node)) {
		return node.getText(sourceFile);
	}
	if (isStringLiteralNode(node)) {
		return node.getText(sourceFile);
	}
	if (isLiteralExpression(node)) {
		if (node.kind === ts.SyntaxKind.NumericLiteral) {
			return node.text;
		}
		return node.getText(sourceFile);
	}

	return null;
}

function getReportRange(
	span: AST.TemplateLiteralTypeSpan | AST.TemplateSpan,
	previousLiteral: AST.TemplateHead | AST.TemplateMiddle | AST.TemplateTail,
	isType: boolean,
) {
	if (!isType && ts.isExpression(span.expression)) {
		const fullStart = span.expression.getFullStart();
		if (fullStart > previousLiteral.end) {
			const end = span.literal.getStart();
			return { begin: fullStart, end };
		}
	}

	return buildReportRange(span, previousLiteral);
}

function getTemplateFixText(
	interpolation: AST.Expression | AST.TypeNode,
	nextStartsWithBrace: boolean,
) {
	const template = getInterpolationTemplate(interpolation);
	if (!template) {
		return null;
	}

	const templateValue = getTemplateLiteralValue(template);
	if (templateValue == null) {
		return null;
	}

	let updatedValue = templateValue;
	if (nextStartsWithBrace && endsWithUnescapedDollarSign(updatedValue)) {
		updatedValue = updatedValue.replaceAll(/\$$/g, "\\$");
	}

	return {
		nextStartsWithBrace: updatedValue.startsWith("{"),
		text: updatedValue,
	};
}

function getTemplateLiteralValue(
	node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
): null | string {
	if (node.templateSpans.length !== 0) {
		return null;
	}

	return node.head.rawText ?? node.head.text;
}

function hasCommentsBetweenTokens(
	previousLiteral: AST.TemplateHead | AST.TemplateMiddle | AST.TemplateTail,
	span: AST.TemplateLiteralTypeSpan | AST.TemplateSpan,
	sourceFile: AST.SourceFile,
): boolean {
	const fullText = sourceFile.getFullText();
	const start = previousLiteral.end - 2;
	const end = span.literal.pos + 1;
	const scanner = ts.createScanner(
		sourceFile.languageVersion,
		false,
		sourceFile.languageVariant,
		fullText,
	);

	scanner.setTextPos(start);
	while (scanner.getTextPos() < end) {
		const token = scanner.scan();
		if (
			token === ts.SyntaxKind.SingleLineCommentTrivia ||
			token === ts.SyntaxKind.MultiLineCommentTrivia
		) {
			return true;
		}
	}

	return false;
}

function isEnumMemberType(type: ts.Type): boolean {
	return tsutils.typeConstituents(type).some((part) => {
		const symbol = part.getSymbol();
		return !!(
			symbol?.valueDeclaration && ts.isEnumMember(symbol.valueDeclaration)
		);
	});
}

function isFixableIdentifier(node: AST.Expression | AST.TypeNode): boolean {
	return (
		isUndefinedIdentifier(node) ||
		isInfinityIdentifier(node) ||
		isNaNIdentifier(node)
	);
}

function isInfinityIdentifier(node: AST.Expression | AST.TypeNode): boolean {
	return node.kind === ts.SyntaxKind.Identifier && node.text === "Infinity";
}

function isLiteralExpression(node: AST.Expression): boolean {
	return (
		ts.isLiteralExpression(node) ||
		node.kind === ts.SyntaxKind.RegularExpressionLiteral
	);
}

function isLiteralTypeNode(node: AST.TypeNode): node is AST.LiteralTypeNode {
	return node.kind === ts.SyntaxKind.LiteralType;
}

function isNaNIdentifier(node: AST.Expression | AST.TypeNode): boolean {
	return node.kind === ts.SyntaxKind.Identifier && node.text === "NaN";
}

function isNullKeywordNode(node: AST.Expression | AST.TypeNode): boolean {
	return node.kind === ts.SyntaxKind.NullKeyword;
}

function isSimpleLiteralInterpolation(
	interpolation: AST.Expression | AST.TypeNode,
) {
	return (
		!!getInterpolationLiteral(interpolation) ||
		isFixableIdentifier(interpolation) ||
		!!getInterpolationTemplate(interpolation)
	);
}

function isStringLike(type: ts.Type): boolean {
	return tsutils.isTypeFlagSet(type, ts.TypeFlags.StringLike);
}

function isStringLiteralNode(
	node: AST.Expression | AST.TypeNode,
): node is AST.StringLiteral {
	return node.kind === ts.SyntaxKind.StringLiteral;
}

function isTemplateExpression(node: AST.Node): node is AST.TemplateExpression {
	return node.kind === ts.SyntaxKind.TemplateExpression;
}

function isTemplateLiteralNode(
	node: AST.Expression | AST.TypeNode,
): node is AST.TemplateExpression | AST.TemplateLiteralTypeNode {
	return isTemplateExpression(node) || isTemplateLiteralTypeNode(node);
}

function isTemplateLiteralTypeNode(
	node: AST.Node,
): node is AST.TemplateLiteralTypeNode {
	return node.kind === ts.SyntaxKind.TemplateLiteralType;
}

function isTrivialInterpolation(
	node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
) {
	return (
		node.templateSpans.length === 1 &&
		node.head.rawText === "" &&
		node.templateSpans[0]?.literal.rawText === ""
	);
}

function isTrueOrFalseKeywordNode(
	node: AST.Expression | AST.TypeNode,
): boolean {
	return (
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword
	);
}

function isUndefinedIdentifier(node: AST.Expression | AST.TypeNode): boolean {
	return node.kind === ts.SyntaxKind.Identifier && node.text === "undefined";
}

function isUnderlyingTypeString(type: ts.Type): boolean {
	if (type.isUnion()) {
		return type.types.every(isStringLike);
	}

	if (type.isIntersection()) {
		return type.types.some(isStringLike);
	}

	return isStringLike(type);
}

function isUnnecessaryInterpolation(
	interpolation: AST.Expression | AST.TypeNode,
	nextLiteral: AST.TemplateMiddle | AST.TemplateTail,
	isType: boolean,
	sourceFile: AST.SourceFile,
) {
	if (isFixableIdentifier(interpolation)) {
		return true;
	}

	const literal = getInterpolationLiteral(interpolation);
	if (literal) {
		if (
			startsWithNewLine(nextLiteral.rawText ?? nextLiteral.text) &&
			literal.kind === ts.SyntaxKind.StringLiteral
		) {
			if (isWhitespace(literal.text)) {
				return false;
			}
		}
		return true;
	}

	if (isType) {
		if (
			interpolation.kind === ts.SyntaxKind.TSUndefinedKeyword ||
			interpolation.kind === ts.SyntaxKind.TSNullKeyword
		) {
			return true;
		}
	}

	const template = getInterpolationTemplate(interpolation);
	if (template) {
		if (startsWithNewLine(nextLiteral.rawText ?? nextLiteral.text)) {
			const value = getTemplateLiteralValue(template);
			if (value != null && isWhitespace(value)) {
				return false;
			}
		}
		return true;
	}

	return false;
}

function isWhitespace(value: string): boolean {
	return /^\s*$/.test(value);
}

function needsParentheses(node: AST.Expression) {
	return !(
		ts.isIdentifier(node) ||
		ts.isRegularExpressionLiteral(node) ||
		ts.isParenthesizedExpression(node) ||
		ts.isCallExpression(node) ||
		ts.isNewExpression(node)
	);
}

function shouldReportSingleInterpolation(
	node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
	isType: boolean,
	services: { sourceFile: AST.SourceFile; typeChecker: ts.TypeChecker },
) {
	if (!isTrivialInterpolation(node)) {
		return false;
	}

	const interpolation = isTemplateExpression(node)
		? node.templateSpans[0]!.expression
		: node.templateSpans[0]!.type;
	const type = getConstrainedTypeAtLocation(
		interpolation as AST.Expression,
		services.typeChecker,
	);
	if (!isUnderlyingTypeString(type)) {
		return false;
	}

	if (isType && isEnumMemberType(type)) {
		return false;
	}

	return true;
}

function shouldUseTemplateFix(
	node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
) {
	for (const info of getInterpolationInfos(node)) {
		if (!isSimpleLiteralInterpolation(info.interpolation)) {
			return false;
		}
	}
	return true;
}

function startsWithNewLine(value: string): boolean {
	return value.startsWith("\n") || value.startsWith("\r\n");
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports template expressions that can be replaced with simpler expressions.",
		id: "unnecessaryTemplateExpressions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryTemplateExpression: {
			primary:
				"This template expression can be replaced with a simpler expression.",
			secondary: [
				"Template expressions that contain only a single substitution without surrounding text add unnecessary complexity.",
				"Using the expression directly is clearer and has the same code semantics.",
			],
			suggestions: [
				"Remove the template literal wrapper and use the expression directly.",
			],
		},
	},
	setup(context) {
		function reportSingleInterpolation(
			node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
			services: {
				sourceFile: AST.SourceFile;
				typeChecker: ts.TypeChecker;
			},
			isType: boolean,
		) {
			const span = node.templateSpans[0]!;
			const interpolation = isTemplateExpression(node)
				? span.expression
				: span.type;
			const reportRange = buildReportRange(span, node.head);
			let fix:
				| undefined
				| { range: { begin: number; end: number }; text: string };

			if (isTemplateExpression(node)) {
				const expression = interpolation as AST.Expression;
				const text = expression.getText(services.sourceFile);
				const wrappedText = needsParentheses(expression) ? `(${text})` : text;
				fix = {
					range: getTSNodeRange(node, services.sourceFile),
					text: wrappedText,
				};
			} else {
				fix = {
					range: getTSNodeRange(node, services.sourceFile),
					text: interpolation.getText(services.sourceFile),
				};
			}

			context.report({
				fix,
				message: "unnecessaryTemplateExpression",
				range: reportRange,
			});
		}

		function reportTemplateInterpolations(
			node: AST.TemplateExpression | AST.TemplateLiteralTypeNode,
			services: {
				sourceFile: AST.SourceFile;
				typeChecker: ts.TypeChecker;
			},
			isType: boolean,
		) {
			const infos = getInterpolationInfos(node).filter((info) =>
				isUnnecessaryInterpolation(
					info.interpolation,
					info.nextLiteral,
					isType,
					services.sourceFile,
				),
			);

			if (!infos.length) {
				return;
			}

			const shouldFix = shouldUseTemplateFix(node);
			let nextStartsWithBrace = false;
			const reports = infos.toReversed().map((info) => {
				const { interpolation, nextLiteral, previousLiteral, span } = info;
				const replacementRanges: {
					range: { begin: number; end: number };
					text: string;
				}[] = [];
				const range = getReportRange(span, previousLiteral, isType);

				if (nextLiteral.rawText !== "") {
					nextStartsWithBrace = nextLiteral.rawText?.startsWith("{") ?? false;
				}

				if (shouldFix) {
					const literalFix = getLiteralFixText(
						interpolation,
						nextStartsWithBrace,
						services.sourceFile,
					);
					const templateFix = getTemplateFixText(
						interpolation,
						nextStartsWithBrace,
					);
					if (literalFix) {
						replacementRanges.push({
							range: {
								begin: interpolation.getStart(services.sourceFile),
								end: interpolation.getEnd(),
							},
							text: literalFix.text,
						});
						nextStartsWithBrace = literalFix.nextStartsWithBrace;
					} else if (templateFix) {
						const template = getInterpolationTemplate(interpolation);
						if (template) {
							replacementRanges.push({
								range: getTSNodeRange(template, services.sourceFile),
								text: templateFix.text,
							});
							nextStartsWithBrace = templateFix.nextStartsWithBrace;
						}
					} else {
						nextStartsWithBrace = false;
					}

					if (
						nextStartsWithBrace &&
						endsWithUnescapedDollarSign(previousLiteral.rawText ?? "")
					) {
						replacementRanges.push({
							range: {
								begin: previousLiteral.end - 3,
								end: previousLiteral.end - 2,
							},
							text: "\\$",
						});
					}
				} else {
					nextStartsWithBrace = false;
				}

				if (shouldFix) {
					replacementRanges.push(
						{
							range: {
								begin: previousLiteral.end - 2,
								end: interpolation.getStart(services.sourceFile),
							},
							text: "",
						},
						{
							range: {
								begin: interpolation.getEnd(),
								end: nextLiteral.pos + 1,
							},
							text: "",
						},
					);
				}

				return { range, replacementRanges };
			});

			for (const report of reports) {
				context.report({
					fix: shouldFix ? report.replacementRanges : undefined,
					message: "unnecessaryTemplateExpression",
					range: report.range,
				});
			}
		}

		return {
			visitors: {
				TemplateExpression: (node, services) => {
					if (node.parent.kind === ts.SyntaxKind.TaggedTemplateExpression) {
						return;
					}

					if (shouldReportSingleInterpolation(node, false, services)) {
						if (
							hasCommentsBetweenTokens(
								node.head,
								node.templateSpans[0]!,
								services.sourceFile,
							)
						) {
							return;
						}

						reportSingleInterpolation(node, services, false);
						return;
					}

					const infos = getInterpolationInfos(node);
					if (
						infos.some((info) =>
							hasCommentsBetweenTokens(
								info.previousLiteral,
								info.span,
								services.sourceFile,
							),
						)
					) {
						return;
					}

					reportTemplateInterpolations(node, services, false);
				},
				TemplateLiteralType: (node, services) => {
					if (shouldReportSingleInterpolation(node, true, services)) {
						if (
							hasCommentsBetweenTokens(
								node.head,
								node.templateSpans[0]!,
								services.sourceFile,
							)
						) {
							return;
						}

						reportSingleInterpolation(node, services, true);
						return;
					}

					const infos = getInterpolationInfos(node);
					if (
						infos.some((info) =>
							hasCommentsBetweenTokens(
								info.previousLiteral,
								info.span,
								services.sourceFile,
							),
						)
					) {
						return;
					}

					reportTemplateInterpolations(node, services, true);
				},
			},
		};
	},
});
