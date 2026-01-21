import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

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
	parent: AST.AnyNode,
	typeArguments: ts.NodeArray<ts.TypeNode>,
	sourceFile: AST.SourceFile,
) {
	const children = parent.getChildren(sourceFile);
	let begin = typeArguments.pos;
	let end = typeArguments.end;

	for (const child of children) {
		if (child.kind === ts.SyntaxKind.LessThanToken) {
			begin = child.getStart(sourceFile);
		} else if (child.kind === ts.SyntaxKind.GreaterThanToken) {
			end = child.getEnd();
		}
	}

	return { begin, end };
}

function getTypeArgumentsText(
	parent: AST.AnyNode,
	typeArguments: ts.NodeArray<ts.TypeNode>,
	sourceFile: AST.SourceFile,
) {
	const range = getTypeArgumentsRange(parent, typeArguments, sourceFile);
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
		presets: ["stylistic"],
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
				!initializer ||
				!ts.isNewExpression(initializer) ||
				!ts.isIdentifier(initializer.expression)
			) {
				return;
			}

			const constructorName = initializer.expression.text;

			if (!typeAnnotation) {
				if (style === "type-annotation" && initializer.typeArguments) {
					const typeArgsText = getTypeArgumentsText(
						initializer,
						initializer.typeArguments,
						sourceFile,
					);
					const identifierEnd = identifier.getEnd();
					const typeAnnotationText = `${constructorName}${typeArgsText}`;
					const typeArgumentsRange = getTypeArgumentsRange(
						initializer,
						initializer.typeArguments,
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
				!ts.isTypeReferenceNode(typeAnnotation) ||
				!ts.isIdentifier(typeAnnotation.typeName) ||
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
					typeAnnotation,
					typeAnnotation.typeArguments,
					sourceFile,
				);
				const typeArgsRange = getTypeArgumentsRange(
					typeAnnotation,
					typeAnnotation.typeArguments,
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
					initializer,
					initializer.typeArguments,
					sourceFile,
				);
				const typeArgumentsRange = getTypeArgumentsRange(
					initializer,
					initializer.typeArguments,
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
