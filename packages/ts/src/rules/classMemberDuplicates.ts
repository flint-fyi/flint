import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports duplicate class member names that will be overwritten.",
		id: "classMemberDuplicates",
		preset: "untyped",
	},
	messages: {
		duplicateMember: {
			primary:
				"Duplicate class member name '{{ memberName }}' will be overwritten.",
			secondary: [
				"Duplicate class members are legal in JavaScript, but only the last definition is used.",
				"This can lead to confusion and bugs, especially when maintaining the code.",
			],
			suggestions: [
				"If both members are meant to exist, rename one of them.",
				"If only the last definition is meant to exist, remove the earlier one.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: visitClass,
				ClassExpression: visitClass,
			},
		};

		function visitClass(
			node: AST.ClassDeclaration | AST.ClassExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const seenMembers = {
				instance: {
					getters: new Map<string, ts.Node>(),
					setters: new Map<string, ts.Node>(),
					values: new Map<string, ts.Node>(),
				},
				static: {
					getters: new Map<string, ts.Node>(),
					setters: new Map<string, ts.Node>(),
					values: new Map<string, ts.Node>(),
				},
			};

			for (const member of node.members.toReversed()) {
				const key = getMemberKeyName(member);
				if (!key) {
					continue;
				}

				const namespace = key.isStatic
					? seenMembers.static
					: seenMembers.instance;

				let isDuplicate = false;
				if (key.group === "values") {
					isDuplicate =
						namespace.values.has(key.text) ||
						namespace.getters.has(key.text) ||
						namespace.setters.has(key.text);
				} else if (key.group === "getters") {
					isDuplicate =
						namespace.getters.has(key.text) || namespace.values.has(key.text);
				} else {
					isDuplicate =
						namespace.setters.has(key.text) || namespace.values.has(key.text);
				}

				if (isDuplicate) {
					context.report({
						data: { memberName: key.text },
						message: "duplicateMember",
						range: getTSNodeRange(key.node, sourceFile),
					});
				}

				namespace[key.group].set(key.text, member);
			}
		}
	},
});

function getMemberKeyName(member: AST.ClassElement) {
	if (
		member.kind === SyntaxKind.PropertyDeclaration ||
		member.kind === SyntaxKind.MethodDeclaration ||
		member.kind === SyntaxKind.GetAccessor ||
		member.kind === SyntaxKind.SetAccessor
	) {
		const text = getNameText(member.name);
		if (!text) {
			return undefined;
		}

		const isStatic = member.modifiers?.some(
			(modifier) => modifier.kind === SyntaxKind.StaticKeyword,
		);

		const group =
			member.kind === SyntaxKind.GetAccessor
				? "getters"
				: member.kind === SyntaxKind.SetAccessor
					? "setters"
					: "values";

		return { group, isStatic: !!isStatic, node: member.name, text } as const;
	}

	return undefined;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getNameText(name: AST.PropertyName) {
	if (
		name.kind === SyntaxKind.Identifier ||
		name.kind === SyntaxKind.NumericLiteral ||
		name.kind === SyntaxKind.BigIntLiteral ||
		name.kind === SyntaxKind.StringLiteral ||
		name.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
		name.kind === SyntaxKind.PrivateIdentifier
	) {
		return name.text;
	}

	return undefined;
}
