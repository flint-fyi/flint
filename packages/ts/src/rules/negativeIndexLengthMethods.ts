import {
	type AST,
	type Checker,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

const typedArrayNames = new Set([
	"BigInt64Array",
	"BigUint64Array",
	"Float32Array",
	"Float64Array",
	"Int8Array",
	"Int16Array",
	"Int32Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Uint16Array",
	"Uint32Array",
]);

const methodConfigurations = new Map([
	[
		"at",
		{
			argumentIndexes: [0],
			supportedTypes: new Set(["Array", "String", ...typedArrayNames]),
		},
	],
	[
		"slice",
		{
			argumentIndexes: [0, 1],
			supportedTypes: new Set(["Array", "String", ...typedArrayNames]),
		},
	],
	["splice", { argumentIndexes: [0], supportedTypes: new Set(["Array"]) }],
	[
		"subarray",
		{ argumentIndexes: [0, 1], supportedTypes: new Set(typedArrayNames) },
	],
	["toSpliced", { argumentIndexes: [0], supportedTypes: new Set(["Array"]) }],
	[
		"with",
		{
			argumentIndexes: [0],
			supportedTypes: new Set(["Array", ...typedArrayNames]),
		},
	],
]);

interface NegativeIndexInfo {
	binaryExpression: AST.BinaryExpression;
	lengthNode: AST.PropertyAccessExpression;
	rightOperand: AST.Expression;
}

interface ParsedCall {
	argumentNodes: readonly AST.Expression[];
	method: string;
	target: AST.Expression;
}

function getNegativeIndexLengthNode(
	node: AST.Expression,
	target: AST.Expression,
	sourceFile: AST.SourceFile,
): NegativeIndexInfo | undefined {
	const unwrapped = unwrapParenthesizedExpression(node);

	if (
		!ts.isBinaryExpression(unwrapped) ||
		unwrapped.operatorToken.kind !== ts.SyntaxKind.MinusToken
	) {
		return;
	}

	const right = unwrapParenthesizedExpression(
		unwrapped.right,
	) as AST.Expression;
	if (!isPositiveNumericLiteral(right)) {
		return;
	}

	const left = unwrapParenthesizedExpression(unwrapped.left) as AST.Expression;

	if (isLengthPropertyAccess(left, target, sourceFile)) {
		return {
			binaryExpression: unwrapped,
			lengthNode: left,
			rightOperand: right,
		};
	}

	return getNegativeIndexLengthNode(unwrapped.left, target, sourceFile);
}

function isLengthPropertyAccess(
	node: AST.Expression,
	target: AST.Expression,
	sourceFile: AST.SourceFile,
): node is AST.PropertyAccessExpression {
	return (
		ts.isPropertyAccessExpression(node) &&
		node.name.text === "length" &&
		hasSameTokens(node.expression, target, sourceFile)
	);
}

function isPositiveNumericLiteral(node: AST.Expression) {
	if (!ts.isNumericLiteral(node)) {
		return false;
	}

	const value = Number(node.text);
	return Number.isInteger(value) && value > 0;
}

function isSupportedType(
	node: AST.Expression,
	typeChecker: Checker,
	supportedTypes: Set<string>,
): boolean {
	const type = getConstrainedTypeAtLocation(node, typeChecker);

	return isTypeRecursive(type, (constituent) => {
		if ((constituent.flags & ts.TypeFlags.Any) !== 0) {
			return true;
		}

		if (
			typeChecker.isArrayType(constituent) ||
			typeChecker.isTupleType(constituent)
		) {
			return supportedTypes.has("Array");
		}

		const typeName = constituent.getSymbol()?.getName();
		if (typeName) {
			return supportedTypes.has(typeName);
		}

		if (
			constituent.isStringLiteral() ||
			(constituent.flags & ts.TypeFlags.String) !== 0
		) {
			return supportedTypes.has("String");
		}

		return false;
	});
}

function isValidPrototypePattern(node: AST.Expression, method: string) {
	if (ts.isArrayLiteralExpression(node) && node.elements.length === 0) {
		return true;
	}

	if (method === "slice" && ts.isStringLiteral(node) && node.text === "") {
		return true;
	}

	if (!ts.isPropertyAccessExpression(node) || node.name.text !== "prototype") {
		return false;
	}

	const object = node.expression;
	if (!ts.isIdentifier(object)) {
		return false;
	}

	return !!methodConfigurations.get(method)?.supportedTypes.has(object.text);
}

function parseCallExpression(node: AST.CallExpression): ParsedCall | undefined {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return;
	}

	const methodName = node.expression.name.text;
	const receiver = node.expression.expression;

	if (methodConfigurations.has(methodName)) {
		return {
			argumentNodes: node.arguments,
			method: methodName,
			target: receiver,
		};
	}

	if (methodName !== "call" && methodName !== "apply") {
		return;
	}

	return parsePrototypeCall(node, methodName === "apply");
}

function parsePrototypeCall(
	node: AST.CallExpression,
	isApply: boolean,
): ParsedCall | undefined {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return;
	}

	const callee = node.expression.expression;
	if (!ts.isPropertyAccessExpression(callee)) {
		return;
	}

	const method = callee.name.text;
	if (!methodConfigurations.has(method)) {
		return;
	}

	const prototypeObject = callee.expression;

	if (!isValidPrototypePattern(prototypeObject, method)) {
		return;
	}

	const [targetArgument, ...restArguments] = node.arguments;
	if (!targetArgument) {
		return;
	}

	if (isApply) {
		const arrayArgument = restArguments[0];
		if (!arrayArgument || !ts.isArrayLiteralExpression(arrayArgument)) {
			return;
		}

		const argumentNodes = arrayArgument.elements.filter(
			(element): element is AST.Expression => !ts.isSpreadElement(element),
		);

		return {
			argumentNodes,
			method,
			target: targetArgument,
		};
	}

	return {
		argumentNodes: restArguments,
		method,
		target: targetArgument,
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer negative index over `.length - index` for `at`, `slice`, `splice`, and similar methods.",
		id: "negativeIndexLengthMethods",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferNegativeIndex: {
			primary:
				"Prefer using a negative index over `.length - index` for `{{ method }}`.",
			secondary: [
				"Negative indices are more concise and express the intent of accessing from the end more clearly.",
				"Methods like `.at()`, `.slice()`, and `.splice()` support negative indices natively.",
			],
			suggestions: [
				"Use a negative index instead of subtracting from `.length`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const parsed = parseCallExpression(node);
					if (!parsed) {
						return;
					}

					const { argumentNodes, method, target } = parsed;
					const methodConfiguration = methodConfigurations.get(method);
					if (!methodConfiguration) {
						return;
					}

					if (
						!isSupportedType(
							target,
							typeChecker,
							methodConfiguration.supportedTypes,
						)
					) {
						return;
					}

					const fixableArguments: {
						argument: AST.Expression;
						info: NegativeIndexInfo;
					}[] = [];

					for (const index of methodConfiguration.argumentIndexes) {
						const argument = argumentNodes[index];
						if (!argument) {
							continue;
						}

						const info = getNegativeIndexLengthNode(
							argument,
							target,
							sourceFile,
						);
						if (info) {
							fixableArguments.push({ argument, info });
						}
					}

					if (fixableArguments.length === 0) {
						return;
					}

					context.report({
						data: { method },
						fix: fixableArguments.map(({ info }) => {
							return {
								range: {
									begin: info.binaryExpression.getStart(sourceFile),
									end: info.binaryExpression.getEnd(),
								},
								text: `-${info.rightOperand.getText(sourceFile)}`,
							};
						}),
						message: "preferNegativeIndex",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
