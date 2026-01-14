import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

type SpreadCheckResult =
	| "arraySpread"
	| "classDeclarationSpread"
	| "classInstanceSpread"
	| "functionSpread"
	| "iterableSpread"
	| "mapSpread"
	| "promiseSpread"
	| undefined;

function checkSpreadInArray(
	expression: AST.Expression,
	typeChecker: Checker,
): boolean {
	const type = getConstrainedTypeAtLocation(expression, typeChecker);
	return isStringType(type);
}

function checkSpreadInObject(
	expression: AST.Expression,
	program: ts.Program,
	typeChecker: Checker,
): SpreadCheckResult {
	const type = getConstrainedTypeAtLocation(expression, typeChecker);

	if (isPromiseType(program, type)) {
		return "promiseSpread";
	}

	if (isFunctionWithoutProperties(type)) {
		return "functionSpread";
	}

	if (isMapType(program, type)) {
		return "mapSpread";
	}

	if (isArrayType(type, typeChecker)) {
		return "arraySpread";
	}

	if (isIterableType(type, typeChecker) && !isStringType(type)) {
		return "iterableSpread";
	}

	if (isClassInstanceWithMethods(typeChecker, type)) {
		return "classInstanceSpread";
	}

	if (isClassDeclarationType(type)) {
		return "classDeclarationSpread";
	}

	return undefined;
}

function isArrayType(type: ts.Type, typeChecker: Checker) {
	return isTypeRecursive(
		type,
		(t) => typeChecker.isArrayType(t) || typeChecker.isTupleType(t),
	);
}

function isClassDeclarationType(type: ts.Type) {
	return isTypeRecursive(type, (t) => {
		if (
			tsutils.isObjectType(t) &&
			tsutils.isObjectFlagSet(t, ts.ObjectFlags.InstantiationExpressionType)
		) {
			return true;
		}

		if (t.getConstructSignatures().length === 0) {
			return false;
		}

		const kind = t.getSymbol()?.valueDeclaration?.kind;
		return (
			kind === SyntaxKind.ClassDeclaration ||
			kind === SyntaxKind.ClassExpression
		);
	});
}

function isClassInstanceWithMethods(typeChecker: Checker, type: ts.Type) {
	return isTypeRecursive(type, (t) => {
		if (t.getConstructSignatures().length > 0) {
			return false;
		}

		const symbol = t.getSymbol();
		if (!symbol) {
			return false;
		}

		const declarations = symbol.getDeclarations();
		if (!declarations?.length) {
			return false;
		}

		const hasConstructor = declarations.some((declaration) => {
			const declarationType = typeChecker.getTypeOfSymbolAtLocation(
				symbol,
				declaration,
			);
			return declarationType.getConstructSignatures().length > 0;
		});

		if (!hasConstructor) {
			return false;
		}

		const properties = t.getProperties();
		return properties.some((prop) => {
			const propType = typeChecker.getTypeOfSymbol(prop);
			return propType.getCallSignatures().length > 0;
		});
	});
}

function isFunctionWithoutProperties(type: ts.Type) {
	return isTypeRecursive(
		type,
		(t) => t.getCallSignatures().length > 0 && t.getProperties().length === 0,
	);
}

function isIterableType(type: ts.Type, typeChecker: Checker) {
	return isTypeRecursive(
		type,
		(t) =>
			tsutils.getWellKnownSymbolPropertyOfType(t, "iterator", typeChecker) !=
			null,
	);
}

function isMapType(program: ts.Program, type: ts.Type) {
	return isTypeRecursive(
		type,
		(t) =>
			isBuiltinSymbolLike(program, t, "Map") ||
			isBuiltinSymbolLike(program, t, "ReadonlyMap") ||
			isBuiltinSymbolLike(program, t, "WeakMap"),
	);
}

function isPromiseType(program: ts.Program, type: ts.Type) {
	return isTypeRecursive(type, (t) =>
		isBuiltinSymbolLike(program, t, "Promise"),
	);
}

function isStringType(type: ts.Type) {
	return isTypeRecursive(type, (t) =>
		tsutils.isTypeFlagSet(t, ts.TypeFlags.StringLike),
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallows using the spread operator when it might cause unexpected behavior.",
		id: "enumMixedValues",
		presets: ["logical"],
	},
	messages: {
		arraySpread: {
			primary:
				"Spreading an array into an object will result in a list of indices as keys.",
			secondary: [
				"When an array is spread into an object literal, the array indices become the object's keys.",
				"This is rarely the intended behavior.",
			],
			suggestions: [
				"Spread the array into another array instead, or use Object.fromEntries() if key-value pairs are needed.",
			],
		},
		classDeclarationSpread: {
			primary:
				"Spreading a class into an object will only copy its static properties.",
			secondary: [
				"When a class is spread into an object, only its static own properties are copied.",
				"The class prototype and inheritance chain are lost.",
			],
			suggestions: ["Avoid spreading class declarations into objects."],
		},
		classInstanceSpread: {
			primary:
				"Spreading a class instance into an object will lose its prototype.",
			secondary: [
				"When a class instance is spread into an object, only its own properties are copied.",
				"All methods and prototype chain information are lost.",
			],
			suggestions: [
				"Consider using Object.assign() or explicitly copying the needed properties.",
			],
		},
		functionSpread: {
			primary:
				"Spreading a function without properties into an object can cause unexpected behavior.",
			secondary: [
				"Functions without additional properties will produce an empty object when spread.",
				"This is usually a mistake - did you forget to call the function?",
			],
			suggestions: [
				"Call the function if you meant to spread its return value.",
			],
		},
		iterableSpread: {
			primary:
				"Spreading an iterable into an object can cause unexpected behavior.",
			secondary: [
				"Iterables like Map, Set, and generators don't have meaningful enumerable properties for object spreading.",
			],
			suggestions: [
				"Use Array.from() or spread into an array literal instead.",
			],
		},
		mapSpread: {
			primary: "Spreading a Map into an object will result in an empty object.",
			secondary: [
				"Maps store their entries internally, not as enumerable properties.",
				"Spreading a Map into an object produces an empty object with no useful data.",
			],
			suggestions: [
				"Use Object.fromEntries(map) to convert a Map to an object.",
			],
		},
		promiseSpread: {
			primary:
				"Spreading a Promise into an object can cause unexpected behavior.",
			secondary: [
				"A Promise object doesn't have meaningful enumerable properties to spread.",
				"This is usually a mistake - did you forget to await the promise?",
			],
			suggestions: [
				"Add await before the Promise to spread its resolved value.",
			],
		},
		stringSpread: {
			primary:
				"Spreading a string into an array can mishandle special characters.",
			secondary: [
				"The spread operator produces Unicode code points, which will decompose complex emojis into individual characters.",
				"String.split('') produces UTF-16 code units, which breaks rich characters in many languages.",
			],
			suggestions: [
				"Consider using Intl.Segmenter for locale-aware string decomposition.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SpreadAssignment: (node, { program, sourceFile, typeChecker }) => {
					const result = checkSpreadInObject(
						node.expression,
						program,
						typeChecker,
					);

					if (result) {
						context.report({
							message: result,
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
				SpreadElement: (node, { sourceFile, typeChecker }) => {
					if (node.parent.kind !== SyntaxKind.ArrayLiteralExpression) {
						return;
					}

					if (checkSpreadInArray(node.expression, typeChecker)) {
						context.report({
							message: "stringSpread",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
