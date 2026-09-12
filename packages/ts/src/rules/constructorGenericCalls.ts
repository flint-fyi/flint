import {
	createScanner,
	SyntaxKind,
	type NodeArray,
	type TypeNode,
} from "typescript-native/unstable/ast";
import { z } from "zod/v4";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const builtInTypedArrays = new Set<string>([
	"Float32Array",
	"Float64Array",
	"Int8Array",
	"Int16Array",
	"Int32Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Uint16Array",
	"Uint32Array",
]);

function getTypeArgumentsRange(
	typeArguments: NodeArray<TypeNode>,
	precedingNode: AST.Node,
	sourceFile: AST.SourceFile,
) {
	const openingScanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		precedingNode.getEnd(),
		typeArguments.pos - precedingNode.getEnd(),
	);
	let tokenKind: SyntaxKind;
	do {
		tokenKind = openingScanner.scan();
	} while (tokenKind !== SyntaxKind.LessThanToken);

	const closingScanner = createScanner(
		false,
		sourceFile.languageVariant,
		sourceFile.text,
		typeArguments.end,
	);
	do {
		tokenKind = closingScanner.scan();
	} while (tokenKind !== SyntaxKind.GreaterThanToken);

	return {
		begin: openingScanner.getTokenStart(),
		end: closingScanner.getTokenEnd(),
	};
}

function getTypeArgumentsText(
	typeArguments: NodeArray<TypeNode>,
	precedingNode: AST.Node,
	sourceFile: AST.SourceFile,
) {
	const range = getTypeArgumentsRange(typeArguments, precedingNode, sourceFile);
	return sourceFile.text.slice(range.begin, range.end);
}

function isBuiltInTypedArray(name: string) {
	return builtInTypedArrays.has(name);
}

const options = {
	style: z
		.enum(["constructor", "type-annotation"])
		.default("constructor")
		.describe(
			"Where to prefer type arguments: 'constructor' for the constructor call, 'type-annotation' for the type annotation.",
		),
};

type Options = z.infer<z.ZodObject<typeof options>>;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent placement of type arguments in constructor calls.",
		id: "constructorGenericCalls",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferConstructor: {
			primary:
				"Prefer specifying the type argument on the constructor call instead of the type annotation.",
			secondary: [
				"When type arguments are needed, specifying them on the constructor is more explicit.",
				"This makes the code more readable by keeping the type information with the value.",
			],
			suggestions: [
				"Move the type argument from the type annotation to the constructor call.",
			],
		},
		preferTypeAnnotation: {
			primary:
				"Prefer specifying the type argument on the type annotation instead of the constructor call.",
			secondary: [
				"Specifying type arguments on the type annotation keeps the variable's type explicit.",
				"This approach can make refactoring easier when changing the right-hand side.",
			],
			suggestions: [
				"Move the type argument from the constructor call to the type annotation.",
			],
		},
	},
	options,
	setup(context) {
		function checkNode(
			node: AST.PropertyDeclaration | AST.VariableDeclaration,
			{ options, sourceFile }: TypeScriptFileServices & { options: Options },
		) {
			const identifier = node.name;
			const typeAnnotation = node.type;
			const initializer = node.initializer;
			const style = options.style;

			if (
				initializer?.kind !== SyntaxKind.NewExpression ||
				initializer.expression.kind !== SyntaxKind.Identifier
			) {
				return;
			}

			const constructorName = initializer.expression.text;

			if (!typeAnnotation) {
				if (style === "type-annotation" && initializer.typeArguments) {
					const typeArgsText = getTypeArgumentsText(
						initializer.typeArguments,
						initializer.expression,
						sourceFile,
					);
					const identifierEnd = identifier.getEnd();
					const typeAnnotationText = `${constructorName}${typeArgsText}`;
					const typeArgumentsRange = getTypeArgumentsRange(
						initializer.typeArguments,
						initializer.expression,
						sourceFile,
					);

					context.report({
						fix: [
							{
								range: typeArgumentsRange,
								text: "",
							},
							{
								range: {
									begin: identifierEnd,
									end: identifierEnd,
								},
								text: `: ${typeAnnotationText}`,
							},
						],
						message: "preferTypeAnnotation",
						range: typeArgumentsRange,
					});
				}
				return;
			}

			if (
				typeAnnotation.kind !== SyntaxKind.TypeReference ||
				typeAnnotation.typeName.kind !== SyntaxKind.Identifier ||
				typeAnnotation.typeName.text !== constructorName ||
				isBuiltInTypedArray(typeAnnotation.typeName.text) ||
				!!typeAnnotation.typeArguments !== !initializer.typeArguments
			) {
				return;
			}

			if (
				style === "constructor" &&
				typeAnnotation.typeArguments &&
				!initializer.typeArguments
			) {
				const typeArgsText = getTypeArgumentsText(
					typeAnnotation.typeArguments,
					typeAnnotation.typeName,
					sourceFile,
				);
				const typeArgsRange = getTypeArgumentsRange(
					typeAnnotation.typeArguments,
					typeAnnotation.typeName,
					sourceFile,
				);

				const constructorEnd = initializer.expression.getEnd();
				const hasParens = initializer.arguments !== undefined;

				context.report({
					fix: [
						{
							range: {
								begin: typeAnnotation.getStart(sourceFile),
								end: typeAnnotation.getEnd(),
							},
							text: constructorName,
						},
						{
							range: {
								begin: constructorEnd,
								end: constructorEnd,
							},
							text: typeArgsText + (hasParens ? "" : "()"),
						},
					],
					message: "preferConstructor",
					range: typeArgsRange,
				});
			} else if (
				style === "type-annotation" &&
				!typeAnnotation.typeArguments &&
				initializer.typeArguments
			) {
				const typeArgumentsText = getTypeArgumentsText(
					initializer.typeArguments,
					initializer.expression,
					sourceFile,
				);
				const typeArgumentsRange = getTypeArgumentsRange(
					initializer.typeArguments,
					initializer.expression,
					sourceFile,
				);
				const newTypeAnnotation = `${typeAnnotation.typeName.text}${typeArgumentsText}`;

				context.report({
					fix: [
						{
							range: {
								begin: typeAnnotation.getStart(sourceFile),
								end: typeAnnotation.getEnd(),
							},
							text: newTypeAnnotation,
						},
						{
							range: typeArgumentsRange,
							text: "",
						},
					],
					message: "preferTypeAnnotation",
					range: typeArgumentsRange,
				});
			}
		}

		return {
			visitors: {
				PropertyDeclaration: checkNode,
				VariableDeclaration: checkNode,
			},
		};
	},
});
