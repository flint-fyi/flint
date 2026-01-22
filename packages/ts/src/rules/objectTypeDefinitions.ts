import {
	type AST,
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
	unwrapParenthesizedTypeNode,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforce consistent use of `interface` or `type` for object type definitions.",
		id: "objectTypeDefinitions",
		presets: ["stylistic"],
	},
	messages: {
		preferInterface: {
			primary: "This project prefers using an `interface` instead of a `type`.",
			secondary: [
				"Interfaces support declaration merging and can be extended with the `extends` keyword.",
				"Interfaces can be implemented by classes, providing clearer contracts.",
				"Error messages from the TypeScript compiler often display the interface name directly, making them more readable.",
			],
			suggestions: ["Convert this interface to a type."],
		},
		preferType: {
			primary: "This project prefers using a `type` instead of an `interface`.",
			secondary: [
				"Type aliases support more flexible composition with union and intersection types.",
				"Type aliases can be used for primitive types and more complex type operations.",
				"Consistency with type-based patterns in modern TypeScript code.",
			],
			suggestions: ["Convert this type to an interface."],
		},
	},
	options: {
		prefer: z
			.enum(["interface", "type"])
			.default("interface")
			.describe("Which syntax to prefer for object type definitions."),
	},
	setup(context) {
		return {
			visitors: {
				InterfaceDeclaration: (node, { options, sourceFile, typeChecker }) => {
					if (options.prefer !== "type") {
						return;
					}

					const fix = isGlobalDeclaration(node.name, typeChecker)
						? undefined
						: convertInterfaceToType(node, sourceFile);

					context.report({
						fix,
						message: "preferType",
						range: getTSNodeRange(node.name, sourceFile),
					});
				},
				TypeAliasDeclaration: (node, { options, sourceFile }) => {
					const typeToCheck = unwrapParenthesizedTypeNode(node.type);

					if (typeToCheck.kind !== SyntaxKind.TypeLiteral) {
						return;
					}

					if (options.prefer !== "interface") {
						return;
					}

					const typeKeyword = node
						.getChildren(sourceFile)
						.find((child) => child.kind === SyntaxKind.TypeKeyword);

					context.report({
						fix: convertTypeToInterface(node, sourceFile),
						message: "preferInterface",
						range: typeKeyword
							? getTSNodeRange(typeKeyword, sourceFile)
							: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});

function convertInterfaceToType(
	node: AST.InterfaceDeclaration,
	sourceFile: AST.SourceFile,
) {
	const sourceCode = sourceFile.text;

	const name = node.name.text;
	const typeParams = node.typeParameters?.length
		? `<${node.typeParameters.map((typeParameter) => typeParameter.name.text).join(", ")}>`
		: "";

	const openBrace = node
		.getChildren(sourceFile)
		.find((child) => child.kind === SyntaxKind.OpenBraceToken);
	const closeBrace = node
		.getChildren(sourceFile)
		.find((child) => child.kind === SyntaxKind.CloseBraceToken);

	const bodyText =
		openBrace && closeBrace
			? sourceCode.slice(openBrace.getStart(sourceFile), closeBrace.getEnd())
			: "{}";

	let intersection = "";
	if (node.heritageClauses?.length) {
		const intersectionTypes = node.heritageClauses.flatMap((clause) => {
			return clause.types.map((type) => {
				const typeStart = type.getStart(sourceFile);
				const typeEnd = type.getEnd();
				return sourceCode.slice(typeStart, typeEnd);
			});
		});

		if (intersectionTypes.length > 0) {
			intersection = " & " + intersectionTypes.join(" & ");
		}
	}

	const modifiers = node.modifiers ? [...node.modifiers] : [];
	const hasExport = hasModifier(modifiers, SyntaxKind.ExportKeyword);
	const hasDefault = hasModifier(modifiers, SyntaxKind.DefaultKeyword);
	const isExportDefault =
		hasExport && hasDefault && node.parent.kind === SyntaxKind.SourceFile;

	if (isExportDefault) {
		const replacement = `type ${name}${typeParams} = ${bodyText}${intersection}\nexport default ${name}`;
		return {
			range: getTSNodeRange(node, sourceFile),
			text: replacement,
		};
	}

	const modifierText = modifiers
		.filter(
			(mod) =>
				mod.kind !== SyntaxKind.ExportKeyword &&
				mod.kind !== SyntaxKind.DefaultKeyword,
		)
		.map((mod) => mod.getText(sourceFile))
		.join(" ");

	const exportText = hasExport ? "export " : "";
	const prefix = modifierText ? `${exportText}${modifierText} ` : exportText;
	const replacement = `${prefix}type ${name}${typeParams} = ${bodyText}${intersection}`;

	return {
		range: getTSNodeRange(node, sourceFile),
		text: replacement,
	};
}

function convertTypeToInterface(
	node: AST.TypeAliasDeclaration,
	sourceFile: AST.SourceFile,
) {
	const sourceCode = sourceFile.text;

	const modifiers = node.modifiers ? [...node.modifiers] : [];
	const modifierText = modifiers
		.map((mod) => mod.getText(sourceFile))
		.join(" ");
	const prefix = modifierText ? `${modifierText} ` : "";

	const name = node.name.text;
	const typeParams = node.typeParameters?.length
		? `<${node.typeParameters.map((typeParameter) => typeParameter.name.text).join(", ")}>`
		: "";

	const typeNode = unwrapParenthesizedTypeNode(node.type);
	const typeLiteralText = sourceCode.slice(
		typeNode.getStart(sourceFile),
		typeNode.getEnd(),
	);

	const replacement = `${prefix}interface ${name}${typeParams} ${typeLiteralText}`;

	return {
		range: getTSNodeRange(node, sourceFile),
		text: replacement,
	};
}

function hasModifier(
	modifiers: AST.ModifierLike[] | undefined,
	kind: SyntaxKind,
): boolean {
	return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}
