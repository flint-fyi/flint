import {
	type AST,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const nativeConstructors = new Set([
	"AggregateError",
	"Array",
	"ArrayBuffer",
	"BigInt",
	"BigInt64Array",
	"BigUint64Array",
	"Boolean",
	"DataView",
	"Date",
	"Error",
	"EvalError",
	"FinalizationRegistry",
	"Float16Array",
	"Float32Array",
	"Float64Array",
	"Function",
	"Int8Array",
	"Int16Array",
	"Int32Array",
	"Map",
	"Number",
	"Object",
	"Promise",
	"RangeError",
	"ReferenceError",
	"RegExp",
	"Set",
	"SharedArrayBuffer",
	"String",
	"Symbol",
	"SyntaxError",
	"TypeError",
	"Uint8Array",
	"Uint8ClampedArray",
	"Uint16Array",
	"Uint32Array",
	"URIError",
	"WeakMap",
	"WeakRef",
	"WeakSet",
]);

function getPrototypeObject(
	node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
) {
	return ts.isIdentifier(node.expression) && node.expression;
}

function isPrototypeAccess(
	node: AST.AnyNode,
): node is AST.ElementAccessExpression | AST.PropertyAccessExpression {
	switch (node.kind) {
		case ts.SyntaxKind.ElementAccessExpression:
			// TODO: Use a util like getStaticValue
			// https://github.com/flint-fyi/flint/issues/1298
			return (
				ts.isStringLiteral(node.argumentExpression) &&
				node.argumentExpression.text === "prototype"
			);

		case ts.SyntaxKind.PropertyAccessExpression:
			return node.name.text === "prototype";

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports extending the prototype of native JavaScript objects.",
		id: "nativeObjectExtensions",
		presets: ["untyped"],
	},
	messages: {
		noExtendNative: {
			primary:
				"Extending the {{ name }} prototype modifies built-in behavior that other code depends on.",
			secondary: [
				"Adding properties to native prototypes affects all instances of that type across the codebase.",
				"This can cause conflicts with other libraries that expect standard prototype behavior.",
				"Future ECMAScript versions may add methods with the same name, causing unexpected behavior.",
			],
			suggestions: [
				"Create a wrapper class or utility function instead of extending the prototype.",
				"Use composition rather than modifying the prototype chain.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (!isPrototypeAccess(node)) {
				return;
			}

			const objectIdentifier = getPrototypeObject(node);
			if (!objectIdentifier) {
				return;
			}

			const name = objectIdentifier.text;
			if (
				!nativeConstructors.has(name) ||
				!isGlobalDeclarationOfName(objectIdentifier, name, typeChecker)
			) {
				return;
			}

			// Case 1: Assignment to prototype property - Array.prototype.custom = ...
			// or Element access assignment - Array.prototype["custom"] = ...
			switch (node.parent.kind) {
				// Case 2: Object.defineProperty(Array.prototype, ...)
				// Case 3: Object.defineProperties(Array.prototype, ...)
				case ts.SyntaxKind.CallExpression: {
					if (node.parent.arguments[0] !== node) {
						break;
					}

					const callee = node.parent.expression;
					if (
						!ts.isPropertyAccessExpression(callee) ||
						!ts.isIdentifier(callee.expression) ||
						callee.expression.text !== "Object" ||
						(callee.name.text !== "defineProperty" &&
							callee.name.text !== "defineProperties") ||
						!isGlobalDeclarationOfName(callee.expression, "Object", typeChecker)
					) {
						break;
					}

					context.report({
						data: { name },
						message: "noExtendNative",
						range: getTSNodeRange(node.parent, sourceFile),
					});
					break;
				}

				case ts.SyntaxKind.ElementAccessExpression:
				case ts.SyntaxKind.PropertyAccessExpression: {
					if (node.parent.expression !== node) {
						break;
					}

					const grandparent = node.parent.parent;
					if (
						!ts.isBinaryExpression(grandparent) ||
						grandparent.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
						grandparent.left !== node.parent
					) {
						break;
					}

					context.report({
						data: { name },
						message: "noExtendNative",
						range: getTSNodeRange(grandparent, sourceFile),
					});
					break;
				}
			}
		}

		return {
			visitors: {
				ElementAccessExpression: checkNode,
				PropertyAccessExpression: checkNode,
			},
		};
	},
});
