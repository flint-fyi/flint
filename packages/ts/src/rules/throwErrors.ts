import {
	TypeFlags,
	type Program,
	type Type,
} from "typescript-native/unstable/sync";

import {
	declarationIncludesGlobal,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isBuiltinErrorType(type: Type, program: Program): boolean {
	const symbol = type.getSymbol();
	if (symbol?.name !== "Error") {
		return false;
	}

	return symbol.declarations
		.map((declaration) => declaration.resolve())
		.some(
			(declaration) =>
				!!declaration && declarationIncludesGlobal(declaration, program),
		);
}

function isErrorType(type: Type, program: Program): boolean {
	if (isBuiltinErrorType(type, program)) {
		return true;
	}

	if (type.isUnionType()) {
		return type.getTypes().every((type) => isErrorType(type, program));
	}

	if (type.isIntersectionType()) {
		return type.getTypes().some((type) => isErrorType(type, program));
	}

	const baseTypes = type.getBaseTypes();
	if (baseTypes) {
		for (const baseType of baseTypes) {
			if (isErrorType(baseType, program)) {
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
		throwUndefined: {
			primary: "Throwing `undefined` provides no context and is hard to debug.",
			secondary: [
				"Throw an `Error` to preserve stack trace and debugging details.",
				"If you need a custom error type, extend `Error`.",
			],
			suggestions: [
				'Throw a new `Error`: `throw new Error("message")`.',
				"Create a custom `Error` class for specific error types.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ThrowStatement(
					node: AST.ThrowStatement,
					{ checker, program, sourceFile }: TypeScriptFileServices,
				) {
					const type = getConstrainedTypeAtLocation(node.expression, checker);

					if (
						(type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0 ||
						isErrorType(type, program)
					) {
						return;
					}

					// TODO: Consider using getStaticValue once available
					// https://github.com/flint-fyi/flint/issues/1298
					if (
						type.isUnionType()
							? type
									.getTypes()
									.every((type) => (type.flags & TypeFlags.Undefined) !== 0)
							: (type.flags & TypeFlags.Undefined) !== 0
					) {
						context.report({
							message: "throwUndefined",
							range: getTSNodeRange(node.expression, sourceFile),
						});
						return;
					}

					context.report({
						message: "throwError",
						range: getTSNodeRange(node.expression, sourceFile),
					});
				},
			},
		};
	},
});
