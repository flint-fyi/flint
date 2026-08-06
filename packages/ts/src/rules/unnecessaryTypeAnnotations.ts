import {
	canHaveModifiers,
	getModifiers,
	NodeFlags,
	SignatureKind,
	SyntaxKind,
	TypeFlags,
	TypeFormatFlags,
	type Type,
	type TypeChecker,
} from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

type Declaration =
	| AST.ParameterDeclaration
	| AST.PropertyDeclaration
	| AST.VariableDeclaration;

const binaryOperators = new Set([
	SyntaxKind.AmpersandToken,
	SyntaxKind.AsteriskAsteriskToken,
	SyntaxKind.AsteriskToken,
	SyntaxKind.BarToken,
	SyntaxKind.CaretToken,
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
	SyntaxKind.GreaterThanEqualsToken,
	SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
	SyntaxKind.GreaterThanGreaterThanToken,
	SyntaxKind.GreaterThanToken,
	SyntaxKind.InKeyword,
	SyntaxKind.InstanceOfKeyword,
	SyntaxKind.LessThanEqualsToken,
	SyntaxKind.LessThanLessThanToken,
	SyntaxKind.LessThanToken,
	SyntaxKind.MinusToken,
	SyntaxKind.PercentToken,
	SyntaxKind.PlusToken,
	SyntaxKind.SlashToken,
]);

const isolatedLiteralKinds = new Set([
	SyntaxKind.BigIntLiteral,
	SyntaxKind.FalseKeyword,
	SyntaxKind.NoSubstitutionTemplateLiteral,
	SyntaxKind.NullKeyword,
	SyntaxKind.NumericLiteral,
	SyntaxKind.StringLiteral,
	SyntaxKind.TrueKeyword,
]);

function areEquivalent(
	annotation: Type,
	candidate: Type,
	typeChecker: TypeChecker,
	location: AST.TypeNode,
) {
	if (isRejectedType(annotation) || isRejectedType(candidate)) {
		return false;
	}
	if (annotation === candidate) {
		return true;
	}
	if (
		(annotation.aliasSymbol === undefined) !==
			(candidate.aliasSymbol === undefined) ||
		annotation.aliasSymbol !== candidate.aliasSymbol
	) {
		return false;
	}

	const flags =
		TypeFormatFlags.NoTruncation |
		TypeFormatFlags.UseFullyQualifiedType |
		TypeFormatFlags.WriteTypeArgumentsOfSignature;
	return (
		typeChecker.typeToString(annotation, location, flags) ===
		typeChecker.typeToString(candidate, location, flags)
	);
}

function hasModifier(node: Declaration, kind: SyntaxKind) {
	return (
		canHaveModifiers(node) &&
		getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
	);
}

function isFixedSignature(
	expression: AST.CallExpression | AST.NewExpression,
	typeChecker: TypeChecker,
) {
	const resolvedSignature = typeChecker.getResolvedSignature(expression);
	if (
		!resolvedSignature?.declaration ||
		resolvedSignature.declaration.typeParameters?.length
	) {
		return false;
	}

	const signatureKind =
		expression.kind === SyntaxKind.CallExpression
			? SignatureKind.Call
			: SignatureKind.Construct;

	return typeChecker
		.getSignaturesOfType(
			typeChecker.getTypeAtLocation(expression.expression),
			signatureKind,
		)
		.some(
			(signature) => signature.declaration === resolvedSignature.declaration,
		);
}

function isFreshLiteral(expression: AST.Expression): boolean {
	switch (expression.kind) {
		case SyntaxKind.BigIntLiteral:
		case SyntaxKind.FalseKeyword:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.TrueKeyword:
			return true;
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.ParenthesizedExpression:
		case SyntaxKind.SatisfiesExpression:
			return isFreshLiteral(expression.expression);
		case SyntaxKind.PrefixUnaryExpression:
			if (expression.operator === SyntaxKind.ExclamationToken) {
				return true;
			}

			return (
				(expression.operator === SyntaxKind.PlusToken ||
					expression.operator === SyntaxKind.MinusToken) &&
				(expression.operand.kind === SyntaxKind.NumericLiteral ||
					expression.operand.kind === SyntaxKind.BigIntLiteral)
			);
		default:
			return false;
	}
}

function isIsolatedInferable(expression: AST.Expression): boolean {
	if (expression.kind === SyntaxKind.ParenthesizedExpression) {
		return isIsolatedInferable(expression.expression);
	}

	if (expression.kind !== SyntaxKind.PrefixUnaryExpression) {
		return isolatedLiteralKinds.has(expression.kind);
	}

	return (
		(expression.operator === SyntaxKind.PlusToken ||
			expression.operator === SyntaxKind.MinusToken) &&
		(expression.operand.kind === SyntaxKind.NumericLiteral ||
			expression.operand.kind === SyntaxKind.BigIntLiteral)
	);
}

function isRejectedType(type: Type) {
	return (type.flags & (TypeFlags.Any | TypeFlags.UniqueESSymbol)) !== 0;
}

function isSafeInitializer(
	expression: AST.Expression,
	typeChecker: TypeChecker,
): boolean {
	switch (expression.kind) {
		case SyntaxKind.AsExpression:
		case SyntaxKind.TypeAssertionExpression:
			return true;
		case SyntaxKind.AwaitExpression:
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.ParenthesizedExpression:
		case SyntaxKind.SatisfiesExpression:
		case SyntaxKind.TypeOfExpression:
		case SyntaxKind.VoidExpression:
			return isSafeInitializer(expression.expression, typeChecker);
		case SyntaxKind.BigIntLiteral:
		case SyntaxKind.FalseKeyword:
		case SyntaxKind.Identifier:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NullKeyword:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.RegularExpressionLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.ThisKeyword:
		case SyntaxKind.TrueKeyword:
			return true;
		case SyntaxKind.BinaryExpression:
			return (
				binaryOperators.has(expression.operatorToken.kind) &&
				isSafeInitializer(expression.left, typeChecker) &&
				isSafeInitializer(expression.right, typeChecker)
			);
		case SyntaxKind.CallExpression:
		case SyntaxKind.NewExpression:
			return isFixedSignature(expression, typeChecker);
		case SyntaxKind.PostfixUnaryExpression:
		case SyntaxKind.PrefixUnaryExpression:
			return isSafeInitializer(expression.operand, typeChecker);
		case SyntaxKind.TemplateExpression:
			return expression.templateSpans.every((span) =>
				isSafeInitializer(span.expression, typeChecker),
			);
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports type annotations that do not change TypeScript's inferred type.",
		id: "unnecessaryTypeAnnotations",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unnecessaryTypeAnnotation: {
			primary:
				"This type annotation does not change TypeScript's inferred type.",
			secondary: [
				"The initializer infers the same type without this annotation.",
				"Removing it makes the declaration more concise.",
			],
			suggestions: ["Remove the unnecessary type annotation."],
		},
	},
	setup(context) {
		function check(node: Declaration, services: TypeScriptFileServices) {
			if (!node.type || !node.initializer) {
				return;
			}

			if (node.kind === SyntaxKind.Parameter) {
				if (
					node.name.kind !== SyntaxKind.Identifier ||
					node.questionToken ||
					node.dotDotDotToken
				) {
					return;
				}
			} else if (node.kind === SyntaxKind.PropertyDeclaration) {
				if (
					node.name.kind === SyntaxKind.ComputedPropertyName ||
					node.exclamationToken ||
					node.questionToken
				) {
					return;
				}
			} else {
				const declarationList = node.parent;
				if (
					node.name.kind !== SyntaxKind.Identifier ||
					node.exclamationToken ||
					declarationList.kind !== SyntaxKind.VariableDeclarationList ||
					(declarationList.flags & NodeFlags.Using) !== 0
				) {
					return;
				}
			}

			if (services.program.getCompilerOptions().isolatedDeclarations) {
				if (!isIsolatedInferable(node.initializer)) {
					return;
				}
			} else if (!isSafeInitializer(node.initializer, services.typeChecker)) {
				return;
			}

			const initializerType = services.typeChecker.getTypeAtLocation(
				node.initializer,
			);
			const directNull = node.initializer.kind === SyntaxKind.NullKeyword;
			const directUndefined =
				(initializerType.flags & TypeFlags.Undefined) !== 0;
			const compilerOptions = services.program.getCompilerOptions();
			const strictNullChecks =
				compilerOptions.strictNullChecks ?? compilerOptions.strict ?? false;
			if ((directNull || directUndefined) && !strictNullChecks) {
				return;
			}

			const literalPreserving =
				node.kind === SyntaxKind.VariableDeclaration
					? (node.parent.flags & NodeFlags.Const) !== 0
					: node.kind === SyntaxKind.PropertyDeclaration &&
						!hasModifier(node, SyntaxKind.AccessorKeyword) &&
						hasModifier(node, SyntaxKind.ReadonlyKeyword);
			if (
				(directNull || directUndefined) &&
				node.kind === SyntaxKind.VariableDeclaration &&
				!literalPreserving
			) {
				return;
			}

			let candidate = initializerType;
			if (
				!literalPreserving &&
				(isFreshLiteral(node.initializer) ||
					node.initializer.kind === SyntaxKind.TypeOfExpression)
			) {
				candidate = services.typeChecker.getWidenedType(
					services.typeChecker.getBaseTypeOfLiteralType(initializerType),
				);
			}

			if (
				literalPreserving &&
				node.initializer.kind === SyntaxKind.CallExpression &&
				(candidate.flags & TypeFlags.ESSymbol) !== 0
			) {
				return;
			}
			if (
				!areEquivalent(
					services.typeChecker.getTypeFromTypeNode(node.type),
					candidate,
					services.typeChecker,
					node.type,
				)
			) {
				return;
			}

			const fixRange = { begin: node.name.getEnd(), end: node.type.getEnd() };
			context.report({
				fix:
					countCommentsInRange(services.sourceFile.text, fixRange) === 0
						? { range: fixRange, text: "" }
						: undefined,
				message: "unnecessaryTypeAnnotation",
				range: getTSNodeRange(node.type, services.sourceFile),
			});
		}

		return {
			visitors: {
				Parameter: check,
				PropertyDeclaration: check,
				VariableDeclaration: check,
			},
		};
	},
});
