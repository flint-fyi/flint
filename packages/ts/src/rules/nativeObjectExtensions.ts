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
	if (!ts.isIdentifier(node.expression)) {
		return undefined;
	}

	return node.expression;
}

function isPrototypeAccess(
	node: ts.Node,
): node is AST.ElementAccessExpression | AST.PropertyAccessExpression {
	if (
		!ts.isPropertyAccessExpression(node) &&
		!ts.isElementAccessExpression(node)
	) {
		return false;
	}

	if (ts.isPropertyAccessExpression(node)) {
		return node.name.text === "prototype";
	}

	if (
		ts.isElementAccessExpression(node) &&
		ts.isStringLiteral(node.argumentExpression)
	) {
		return node.argumentExpression.text === "prototype";
	}

	return false;
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
		function checkPrototypeExtension(
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
			if (!nativeConstructors.has(name)) {
				return;
			}

			if (!isGlobalDeclarationOfName(objectIdentifier, name, typeChecker)) {
				return;
			}

			const parent = node.parent;

			// Case 1: Assignment to prototype property - Array.prototype.custom = ...
			// or Element access assignment - Array.prototype["custom"] = ...
			if (
				(ts.isPropertyAccessExpression(parent) ||
					ts.isElementAccessExpression(parent)) &&
				parent.expression === node
			) {
				const grandparent = parent.parent;
				if (
					ts.isBinaryExpression(grandparent) &&
					grandparent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
					grandparent.left === parent
				) {
					context.report({
						data: { name },
						message: "noExtendNative",
						range: getTSNodeRange(grandparent, sourceFile),
					});
					return;
				}
			}

			// Case 2: Object.defineProperty(Array.prototype, ...)
			// Case 3: Object.defineProperties(Array.prototype, ...)
			if (ts.isCallExpression(parent) && parent.arguments[0] === node) {
				const callee = parent.expression;
				if (
					ts.isPropertyAccessExpression(callee) &&
					ts.isIdentifier(callee.expression) &&
					callee.expression.text === "Object" &&
					(callee.name.text === "defineProperty" ||
						callee.name.text === "defineProperties") &&
					isGlobalDeclarationOfName(callee.expression, "Object", typeChecker)
				) {
					context.report({
						data: { name },
						message: "noExtendNative",
						range: getTSNodeRange(parent, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				ElementAccessExpression: (node, services) => {
					checkPrototypeExtension(node, services);
				},
				PropertyAccessExpression: (node, services) => {
					checkPrototypeExtension(node, services);
				},
			},
		};
	},
});
