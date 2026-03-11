import {
	type AST,
	declarationIncludesGlobal,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isBuiltinErrorType(type: ts.Type): boolean {
	const symbol = type.getSymbol();
	if (symbol?.getName() !== "Error") {
		return false;
	}

	return !!symbol.getDeclarations()?.some(declarationIncludesGlobal);
}

function isErrorType(type: ts.Type): boolean {
	if (isBuiltinErrorType(type)) {
		return true;
	}

	if (type.isUnion()) {
		return type.types.every((t) => isErrorType(t));
	}

	if (type.isIntersection()) {
		return type.types.some((t) => isErrorType(t));
	}

	const baseTypes = type.getBaseTypes();
	if (baseTypes) {
		for (const baseType of baseTypes) {
			if (isErrorType(baseType)) {
				return true;
			}
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports throwing values that are not `Error` objects.",
		id: "throwErrors",
		presets: ["logical"],
	},
	messages: {
		throwError: {
			primary: "Only `Error` objects should be thrown.",
			secondary: [
				"Throwing non-`Error` values loses stack trace information.",
				"Error objects provide consistent behavior and debugging information.",
			],
			suggestions: [
				"Wrap the value in an `Error`: `throw new Error(value)`.",
				"Create a custom `Error` class for specific error types.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ThrowStatement(
					node: AST.ThrowStatement,
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) {
					const type = getConstrainedTypeAtLocation(
						node.expression,
						typeChecker,
					);

					if (
						tsutils.isTypeFlagSet(
							type,
							ts.TypeFlags.Any | ts.TypeFlags.Unknown,
						) ||
						isErrorType(type)
					) {
						return;
					}

					context.report({
						message: "throwError",
						range: {
							begin: node.expression.getStart(sourceFile),
							end: node.expression.getEnd(),
						},
					});
				},
			},
		};
	},
});
