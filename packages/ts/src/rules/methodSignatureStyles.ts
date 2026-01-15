import * as ts from "typescript";
import { z } from "zod";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function containsThisType(node: ts.Node): boolean {
	if (node.kind === ts.SyntaxKind.ThisType) {
		return true;
	}
	let found = false;
	ts.forEachChild(node, (child) => {
		if (containsThisType(child)) {
			found = true;
		}
	});
	return found;
}

function getDelimiter(node: ts.Node, sourceFile: ts.SourceFile) {
	const text = node.getText(sourceFile);
	const lastChar = text[text.length - 1];
	if (lastChar === ";" || lastChar === ",") {
		return lastChar;
	}
	return "";
}

function getMethodKey(
	node: AST.MethodSignature | AST.PropertySignature,
	sourceFile: ts.SourceFile,
) {
	let key = node.name.getText(sourceFile);
	// Only wrap in brackets for string literals (e.g., "complex-name"(): void)
	// Computed property names (e.g., ['f'] or [key]) already include brackets
	if (node.name.kind === ts.SyntaxKind.StringLiteral) {
		key = `[${key}]`;
	}
	if (node.questionToken) {
		key = `${key}?`;
	}
	const readonlyModifier = node.modifiers?.find(
		(modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
	);
	if (readonlyModifier) {
		key = `readonly ${key}`;
	}
	return key;
}

function getMethodParams(
	node: AST.FunctionTypeNode | AST.MethodSignature,
	sourceFile: ts.SourceFile,
) {
	let params = "()";
	if (node.parameters.length > 0) {
		const firstParam = node.parameters[0];
		const lastParam = node.parameters[node.parameters.length - 1];

		if (!firstParam || !lastParam) {
			return params;
		}
		let openParenPos: number | undefined;
		let closeParenPos: number | undefined;

		for (
			let i = firstParam.getStart(sourceFile) - 1;
			i >= node.getStart(sourceFile);
			i--
		) {
			const char = sourceFile.text[i];
			if (char === "(") {
				openParenPos = i;
				break;
			}
		}

		for (let i = lastParam.getEnd(); i < node.getEnd(); i++) {
			const char = sourceFile.text[i];
			if (char === ")") {
				closeParenPos = i + 1;
				break;
			}
		}

		if (openParenPos !== undefined && closeParenPos !== undefined) {
			params = sourceFile.text.substring(openParenPos, closeParenPos);
		}
	}
	if (node.typeParameters && node.typeParameters.length > 0) {
		const typeParams = node.typeParameters
			.map((tp) => tp.getText(sourceFile))
			.join(", ");
		params = `<${typeParams}>${params}`;
	}
	return params;
}

function getMethodReturnType(
	node: AST.FunctionTypeNode | AST.MethodSignature,
	sourceFile: ts.SourceFile,
) {
	if (!node.type) {
		return "any";
	}
	return node.type.getText(sourceFile);
}

function getPropertyKey(
	node: AST.PropertySignature,
	sourceFile: ts.SourceFile,
) {
	let key = node.name.getText(sourceFile);
	// Only wrap in brackets for string literals (e.g., "complex-name": () => void)
	// Computed property names (e.g., ['f'] or [key]) already include brackets
	if (node.name.kind === ts.SyntaxKind.StringLiteral) {
		key = `[${key}]`;
	}
	if (node.questionToken) {
		key = `${key}?`;
	}
	const readonlyModifier = node.modifiers?.find(
		(modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
	);
	if (readonlyModifier) {
		key = `readonly ${key}`;
	}
	return key;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Enforce using a particular method signature syntax.",
		id: "methodSignatureStyles",
		presets: ["stylistic"],
	},
	messages: {
		preferMethod: {
			primary:
				"Function property signature is forbidden. Use a method shorthand instead.",
			secondary: [],
			suggestions: ["Convert to method signature."],
		},
		preferProperty: {
			primary:
				"Shorthand method signature is forbidden. Use a function property instead.",
			secondary: [
				"Method signatures have bivariant parameter types when strictFunctionTypes is enabled.",
				"Function property signatures are fully contravariant and provide better type safety.",
			],
			suggestions: ["Convert to function property signature."],
		},
	},
	options: {
		style: z
			.enum(["property", "method"])
			.default("property")
			.describe(
				"Which method signature style to enforce: 'property' for function properties (`f: () => void`), or 'method' for method shorthand (`f(): void`).",
			),
	},
	setup(context) {
		return {
			visitors: {
				MethodSignature: (node, { options, sourceFile }) => {
					if (options.style !== "property") {
						return;
					}

					// Methods that return `this` type can't be converted to function properties
					// because arrow functions don't have their own `this` binding
					if (node.type && containsThisType(node.type)) {
						return;
					}

					const key = getMethodKey(node, sourceFile);
					const params = getMethodParams(node, sourceFile);
					const returnType = getMethodReturnType(node, sourceFile);
					const delimiter = getDelimiter(node, sourceFile);

					context.report({
						message: "preferProperty",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "convertToProperty",
								range: getTSNodeRange(node, sourceFile),
								text: `${key}: ${params} => ${returnType}${delimiter}`,
							},
						],
					});
				},
				PropertySignature: (node, { options, sourceFile }) => {
					if (options.style !== "method") {
						return;
					}

					if (!node.type || node.type.kind !== ts.SyntaxKind.FunctionType) {
						return;
					}

					const functionType = node.type;
					const key = getPropertyKey(node, sourceFile);
					const params = getMethodParams(functionType, sourceFile);
					const returnType = getMethodReturnType(functionType, sourceFile);
					const delimiter = getDelimiter(node, sourceFile);

					context.report({
						message: "preferMethod",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "convertToMethod",
								range: getTSNodeRange(node, sourceFile),
								text: `${key}${params}: ${returnType}${delimiter}`,
							},
						],
					});
				},
			},
		};
	},
});
