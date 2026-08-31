import { SyntaxKind } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isBuiltinSymbolLike } from "./utils/isBuiltinSymbolLike.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports calling a value with type `any`.",
		id: "anyCalls",
		presets: ["logical", "logicalStrict"],
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
			{ checker, program, sourceFile }: TypeScriptFileServices,
			message: "unsafeCall" | "unsafeNew" | "unsafeTemplateTag",
			allowVoid?: boolean,
		) {
			const type = getConstrainedTypeAtLocation(node, checker);

			if (type.flags & TypeFlags.Any) {
				if (isIntrinsicErrorType(type)) {
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
						(signature) => !(signature.getReturnType().flags & TypeFlags.Void),
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
					if (node.expression.kind !== SyntaxKind.ImportKeyword) {
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

function isIntrinsicErrorType(type: Type): boolean {
	return type.isIntrinsicType() && type.intrinsicName === "error";
}
