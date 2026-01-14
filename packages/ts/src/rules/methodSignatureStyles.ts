import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getMethodKey(
	node: AST.MethodSignature | AST.PropertySignature,
	sourceFile: ts.SourceFile,
) {
	let key = node.name.getText(sourceFile);
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
	node: AST.MethodSignature | AST.FunctionTypeNode,
	sourceFile: ts.SourceFile,
) {
	let params = "()";
	if (node.parameters.length > 0) {
		const firstParam = node.parameters[0];
		const lastParam = node.parameters[node.parameters.length - 1];
		let openParen: ts.Node | undefined;
		let closeParen: ts.Node | undefined;

		for (
			let i = firstParam.getStart(sourceFile) - 1;
			i >= node.getStart(sourceFile);
			i--
		) {
			const char = sourceFile.text[i];
			if (char === "(") {
				openParen = { getStart: () => i, getEnd: () => i + 1 } as ts.Node;
				break;
			}
		}

		for (let i = lastParam.getEnd(); i < node.getEnd(); i++) {
			const char = sourceFile.text[i];
			if (char === ")") {
				closeParen = { getStart: () => i, getEnd: () => i + 1 } as ts.Node;
				break;
			}
		}

		if (openParen && closeParen) {
			params = sourceFile.text.substring(
				openParen.getStart(),
				closeParen.getEnd(),
			);
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
	node: AST.MethodSignature | AST.FunctionTypeNode,
	sourceFile: ts.SourceFile,
) {
	if (!node.type) {
		return "any";
	}
	return node.type.getText(sourceFile);
}

function getDelimiter(node: ts.Node, sourceFile: ts.SourceFile) {
	const text = node.getText(sourceFile);
	const lastChar = text[text.length - 1];
	if (lastChar === ";" || lastChar === ",") {
		return lastChar;
	}
	return "";
}

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

function isGetterOrSetter(node: AST.MethodSignature) {
	const modifiers = node.modifiers;
	if (!modifiers) {
		return false;
	}
	return modifiers.some(
		(m) =>
			m.kind === ts.SyntaxKind.GetKeyword ||
			m.kind === ts.SyntaxKind.SetKeyword,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Enforce using function property signatures over methods.",
		id: "methodSignatureStyles",
		presets: ["stylistic"],
	},
	messages: {
		preferProperty: {
			primary:
				"Method signature is less type-safe than function property signature.",
			secondary: [
				"Method signatures have bivariant parameter types when strictFunctionTypes is enabled.",
				"Function property signatures are fully contravariant and provide better type safety.",
			],
			suggestions: ["Convert to function property signature."],
		},
	},
	setup(context) {
		return {
			visitors: {
				MethodSignature: (node, { sourceFile }) => {
					if (isGetterOrSetter(node)) {
						return;
					}

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
			},
		};
	},
});
