import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports calling a value with type `any`.",
		id: "anyCalls",
		preset: "logical",
	},
	messages: {
		unsafeCall: {
			primary: "Unsafe call of {{ type }} typed value.",
			secondary: [
				"Calling a value typed as `any` or `Function` bypasses TypeScript's type checking.",
				"TypeScript cannot verify that the value is actually a function, what parameters it expects, or what it returns.",
			],
			suggestions: [
				"Ensure the called value has a well-defined function type.",
			],
		},
		unsafeNew: {
			primary: "Unsafe construction of {{ type }} typed value.",
			secondary: [
				"Constructing a value typed as `any` or `Function` bypasses TypeScript's type checking.",
				"TypeScript cannot verify that the value is actually a constructor, what parameters it expects, or what it returns.",
			],
			suggestions: [
				"Ensure the constructed value has a well-defined constructor type.",
			],
		},
		unsafeTemplateTag: {
			primary: "Unsafe use of {{ type }} typed template tag.",
			secondary: [
				"Using a value typed as `any` or `Function` as a template tag bypasses TypeScript's type checking.",
				"TypeScript cannot verify that the value is a valid template tag function.",
			],
			suggestions: [
				"Ensure the template tag has a well-defined function type.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.Expression,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
			message: "unsafeCall" | "unsafeNew" | "unsafeTemplateTag",
			allowVoid?: boolean,
		) {
			const type = getConstrainedTypeAtLocation(node, typeChecker);

			if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
				if (tsutils.isIntrinsicErrorType(type)) {
					return;
				}
				context.report({
					data: { type: "`any`" },
					message,
					range: getTSNodeRange(node, sourceFile),
				});
				return;
			}

			if (
				!isBuiltinSymbolLike(program, type, "Function") ||
				type.getConstructSignatures().length
			) {
				return;
			}

			const callSignatures = type.getCallSignatures();
			if (
				callSignatures.length &&
				(!allowVoid ||
					callSignatures.some(
						(signature) =>
							!tsutils.isIntrinsicVoidType(signature.getReturnType()),
					))
			) {
				return;
			}

			context.report({
				data: { type: "`Function`" },
				message,
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				CallExpression: (node, services) => {
					if (node.expression.kind !== ts.SyntaxKind.ImportKeyword) {
						checkNode(node.expression, services, "unsafeCall");
					}
				},
				NewExpression: (node, services) => {
					checkNode(node.expression, services, "unsafeNew", true);
				},
				TaggedTemplateExpression: (node, services) => {
					checkNode(node.tag, services, "unsafeTemplateTag");
				},
			},
		};
	},
});
