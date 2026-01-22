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
			primary: "Use an `interface` instead of a `type`.",
			secondary: [
				"Interfaces support declaration merging and can be extended with the `extends` keyword.",
				"Interfaces can be implemented by classes, providing clearer contracts.",
				"Error messages from the TypeScript compiler often display the interface name directly, making them more readable.",
			],
		},
		preferType: {
			primary: "Use a `type` instead of an `interface`.",
			secondary: [
				"Type aliases support more flexible composition with union and intersection types.",
				"Type aliases can be used for primitive types and more complex type operations.",
				"Consistency with type-based patterns in modern TypeScript code.",
			],
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

					const canFix = !isGlobalDeclaration(node.name, typeChecker);

					let fix;
					if (canFix) {
						try {
							fix = convertInterfaceToType(node, sourceFile);
						} catch {
							// If fix generation fails, report without fix
						}
					}

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
	const start = node.getStart(sourceFile);
	const end = node.getEnd();
	const nodeText = sourceCode.slice(start, end);

	const name = node.name.text;
	const typeParams = node.typeParameters?.length
		? `<${node.typeParameters.map((p: any) => p.name.text).join(", ")}>`
		: "";

	const bodyStart = node.body.getStart(sourceFile);
	const bodyEnd = node.body.getEnd();
	const bodyText = sourceCode.slice(bodyStart, bodyEnd);

	let intersection = "";
	if (node.heritageClauses?.length) {
		const intersectionTypes = node.heritageClauses.flatMap((clause: any) => {
			return clause.types.map((type: any) => {
				const typeStart = type.getStart(sourceFile);
				const typeEnd = type.getEnd();
				return sourceCode.slice(typeStart, typeEnd);
			});
		});

		if (intersectionTypes.length > 0) {
			intersection = " & " + intersectionTypes.join(" & ");
		}
	}

	const isExportDefault =
		node.parent?.kind === SyntaxKind.ExportAssignment ||
		(node.modifiers?.some(
			(mod: any) => mod.kind === SyntaxKind.ExportKeyword,
		) &&
			node.parent?.kind === SyntaxKind.SourceFile &&
			/^export\s+default\s+/.exec(sourceCode.slice(node.getStart(sourceFile))));

	if (isExportDefault) {
		const exportDefaultMatch = /^export\s+default\s+interface/.exec(nodeText);
		if (exportDefaultMatch) {
			const replacement = `type ${name}${typeParams} = ${bodyText}${intersection}\nexport default ${name}`;
			return {
				range: getTSNodeRange(node, sourceFile),
				text: replacement,
			};
		}
	}

	const replacement = `type ${name}${typeParams} = ${bodyText}${intersection}`;

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
	const start = node.getStart(sourceFile);
	const end = node.getEnd();
	const nodeText = sourceCode.slice(start, end);

	const typeKeywordStart = nodeText.indexOf("type");

	const beforeType = nodeText.slice(0, typeKeywordStart).trim();
	const modifiers = beforeType ? beforeType + " " : "";

	const equalIndex = nodeText.indexOf("=");

	const name = node.name.text;
	const typeParams = node.typeParameters?.length
		? `<${node.typeParameters.map((typeParameter) => typeParameter.name.text).join(", ")}>`
		: "";

	let typeLiteral = nodeText.slice(equalIndex + 1).trimStart();

	if (typeLiteral.endsWith(";")) {
		typeLiteral = typeLiteral.slice(0, -1).trimEnd();
	}

	const replacement = `${modifiers}interface ${name}${typeParams} ${typeLiteral}`;

	return {
		range: getTSNodeRange(node, sourceFile),
		text: replacement,
	};
}
