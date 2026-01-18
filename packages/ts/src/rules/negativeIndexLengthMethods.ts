import {
	type AST,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const methodsConfiguration = new Map([
	["at", { argumentIndexes: [0] }],
	["slice", { argumentIndexes: [0, 1] }],
	["splice", { argumentIndexes: [0] }],
	["subarray", { argumentIndexes: [0, 1] }],
	["toSpliced", { argumentIndexes: [0] }],
	["with", { argumentIndexes: [0] }],
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer negative index over `.length - index` for slice, at, splice, and similar methods.",
		id: "negativeIndexLengthMethods",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferNegativeIndex: {
			primary:
				"Prefer negative index over `.length - index` for `{{ method }}`.",
			secondary: [
				"Negative indices are more concise and express the intent of accessing from the end more clearly.",
				"Methods like `.slice()`, `.at()`, and `.splice()` support negative indices natively.",
			],
			suggestions: [
				"Use a negative index instead of subtracting from `.length`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					const parsed = parseCallExpression(node);
					if (!parsed) {
						return;
					}

					const { argumentNodes, method, target } = parsed;
					const configuration = methodsConfiguration.get(method);
					if (!configuration) {
						return;
					}

					const fixableArguments: {
						argument: AST.Expression;
						lengthNode: AST.PropertyAccessExpression;
					}[] = [];

					for (const index of configuration.argumentIndexes) {
						const argument = argumentNodes[index];
						if (!argument) {
							continue;
						}

						const lengthNode = getNegativeIndexLengthNode(
							argument,
							target,
							sourceFile,
						);
						if (lengthNode) {
							fixableArguments.push({ argument, lengthNode });
						}
					}

					if (fixableArguments.length === 0) {
						return;
					}

					context.report({
						data: { method },
						fix: fixableArguments.map(({ argument, lengthNode }) => ({
							range: {
								begin: argument.getStart(sourceFile),
								end:
									lengthNode.getEnd() +
									getWhitespaceAfterLength(
										sourceFile.text,
										lengthNode.getEnd(),
									),
							},
							text: "-",
						})),
						message: "preferNegativeIndex",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});

interface ParsedCall {
	argumentNodes: readonly AST.Expression[];
	method: string;
	target: AST.Expression;
}

function getNegativeIndexLengthNode(
	node: AST.Expression,
	target: AST.Expression,
	sourceFile: AST.SourceFile,
): AST.PropertyAccessExpression | undefined {
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
		return left;
	}

	return getNegativeIndexLengthNode(unwrapped.left, target, sourceFile);
}

function getSupportedObjectsForMethod(method: string) {
	const typedArrays = new Set([
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

	switch (method) {
		case "at":
			return new Set(["Array", "String", ...typedArrays]);
		case "slice":
			return new Set(["Array", "ArrayBuffer", "String", ...typedArrays]);
		case "splice":
		case "toSpliced":
			return new Set(["Array"]);
		case "subarray":
			return typedArrays;
		case "with":
			return new Set(["Array", ...typedArrays]);
		default:
			return new Set<string>();
	}
}

function getWhitespaceAfterLength(text: string, position: number) {
	let length = 0;
	while (/\s/.test(text[position + length] ?? "")) {
		length++;
	}
	return length;
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

	const supportedObjects = getSupportedObjectsForMethod(method);
	return supportedObjects.has(object.text);
}

function parseCallExpression(node: AST.CallExpression): ParsedCall | undefined {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return;
	}

	const methodName = node.expression.name.text;
	const receiver = node.expression.expression;

	if (methodsConfiguration.has(methodName)) {
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
	if (!methodsConfiguration.has(method)) {
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
