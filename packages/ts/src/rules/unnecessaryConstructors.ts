import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

function classHasDecorators(node: AST.ClassDeclaration | AST.ClassExpression) {
	if (hasDecorators(node)) {
		return true;
	}

	return node.members.some(
		(member) =>
			hasDecorators(member) ||
			(ts.isFunctionLike(member) && member.parameters.some(hasDecorators)),
	);
}

function getRemovalText(
	node: AST.ConstructorDeclaration,
	sourceFile: AST.SourceFile,
) {
	const members = node.parent.members;
	const index = members.indexOf(node);
	const previous = members[index - 1];
	const next = members[index + 1];
	if (
		previous?.kind !== SyntaxKind.PropertyDeclaration ||
		!previous.initializer ||
		previous.getLastToken(sourceFile)?.kind === SyntaxKind.SemicolonToken ||
		!next
	) {
		return "";
	}

	const nextToken = nullThrows(
		next.getFirstToken(sourceFile),
		"Expected class member to have a first token",
	);
	const nextTokenText = sourceFile.text.slice(
		nextToken.getStart(sourceFile),
		nextToken.getEnd(),
	);
	return ["*", "[", "in", "instanceof"].includes(nextTokenText) ? ";" : "";
}

function hasAssociatedComments(
	node: AST.ConstructorDeclaration,
	sourceFile: AST.SourceFile,
) {
	const lineEnd = sourceFile.text.indexOf("\n", node.getEnd());
	return (
		countCommentsInRange(sourceFile.text, {
			begin: node.getFullStart(),
			end: lineEnd < 0 ? sourceFile.text.length : lineEnd,
		}) > 0
	);
}

function hasDecorators(node: ts.Node) {
	return ts.canHaveDecorators(node) && !!ts.getDecorators(node)?.length;
}

function isInAmbientContext(node: ts.Node) {
	let current: ts.Node | undefined = node;
	// Source files have no parent at runtime despite the AST boundary type.
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (current) {
		if (
			ts.canHaveModifiers(current) &&
			ts
				.getModifiers(current)
				?.some((modifier) => modifier.kind === SyntaxKind.DeclareKeyword)
		) {
			return true;
		}

		current = current.parent;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports constructors that can be removed without changing class behavior or constructor signatures.",
		id: "unnecessaryConstructors",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unnecessaryConstructor: {
			primary:
				"This constructor can be removed without changing class behavior.",
			secondary: [
				"The class provides the same initialization and constructor signature without this declaration.",
			],
			suggestions: ["Remove the unnecessary constructor."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Constructor: (node, services) => {
					const { sourceFile } = services;
					if (
						sourceFile.isDeclarationFile ||
						isInAmbientContext(node.parent) ||
						!node.body ||
						node.modifiers?.length ||
						node.parent.members.filter(
							(member) => member.kind === SyntaxKind.Constructor,
						).length !== 1 ||
						classHasDecorators(node.parent) ||
						hasAssociatedComments(node, sourceFile)
					) {
						return;
					}

					if (
						node.parent.heritageClauses?.some(
							(clause) => clause.token === SyntaxKind.ExtendsKeyword,
						) ||
						node.parameters.length ||
						node.body.statements.length
					) {
						return;
					}

					const constructorStart = node.getStart(sourceFile);
					context.report({
						message: "unnecessaryConstructor",
						range: {
							begin: constructorStart,
							end: constructorStart + "constructor".length,
						},
						suggestions: [
							{
								id: "removeConstructor",
								range: {
									begin: constructorStart,
									end: node.getEnd(),
								},
								text: getRemovalText(node, sourceFile),
							},
						],
					});
				},
			},
		};
	},
});
