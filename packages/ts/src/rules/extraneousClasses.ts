import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasConstructorWithBody(node: AST.ClassDeclaration): boolean {
	for (const member of node.members) {
		if (
			member.kind === SyntaxKind.Constructor &&
			ts.isConstructorDeclaration(member) &&
			member.body
		) {
			return true;
		}
	}

	return false;
}

function hasNonStaticMember(node: AST.ClassDeclaration): boolean {
	for (const member of node.members) {
		if (member.kind === SyntaxKind.Constructor) {
			continue;
		}

		const isStatic = member.modifiers?.some(
			(mod) => mod.kind === SyntaxKind.StaticKeyword,
		);

		if (!isStatic) {
			return true;
		}
	}

	return false;
}

function isEmpty(node: AST.ClassDeclaration): boolean {
	return node.members.length === 0;
}

function isExtraneous(node: AST.ClassDeclaration): string | undefined {
	if (isEmpty(node)) {
		return "emptyClass";
	}

	if (hasNonStaticMember(node)) {
		return undefined;
	}

	if (hasConstructorWithBody(node) && node.members.length === 1) {
		return "constructorOnly";
	}

	return "staticOnly";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports classes that only contain static members or are empty.",
		id: "extraneousClasses",
		presets: ["logicalStrict"],
	},
	messages: {
		constructorOnly: {
			primary:
				"Class '{{ name }}' contains only a constructor and can be replaced with a function.",
			secondary: [
				"A class with only a constructor is functionally equivalent to a regular function.",
				"Using a plain function is simpler and more idiomatic in JavaScript.",
			],
			suggestions: ["Convert the constructor to a standalone function."],
		},
		emptyClass: {
			primary: "Class '{{ name }}' is empty.",
			secondary: ["Empty classes serve no purpose and add unnecessary code."],
			suggestions: ["Remove the empty class or add meaningful members."],
		},
		staticOnly: {
			primary:
				"Class '{{ name }}' contains only static members and can be replaced with a module.",
			secondary: [
				"Classes with only static members are better represented as module exports.",
				"Static-only classes add unnecessary complexity without providing instance functionality.",
			],
			suggestions: [
				"Convert the static methods to exported functions.",
				"Use namespace imports (import * as) if you need all exports as a single object.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile }) => {
					const messageId = isExtraneous(node);

					if (!messageId) {
						return;
					}

					const name = node.name?.text ?? "(anonymous)";

					context.report({
						data: { name },
						message: messageId,
						range: getTSNodeRange(node.name ?? node, sourceFile),
					});
				},
			},
		};
	},
});
