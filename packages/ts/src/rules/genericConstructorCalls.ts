import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
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
	typeArguments: ts.NodeArray<ts.TypeNode>,
	sourceFile: AST.SourceFile,
) {
	const text = sourceFile.text;
	const argsPos = typeArguments.pos;
	const argsEnd = typeArguments.end;

	let begin = argsPos;
	while (begin > 0 && text.charAt(begin - 1) !== "<") {
		begin--;
	}
	if (begin > 0) {
		begin--;
	}

	let end = argsEnd;
	while (end < text.length && text.charAt(end) !== ">") {
		end++;
	}
	if (end < text.length) {
		end++;
	}

	return { begin, end };
}

function getTypeArgumentsText(
	typeArguments: ts.NodeArray<ts.TypeNode>,
	sourceFile: AST.SourceFile,
) {
	const range = getTypeArgumentsRange(typeArguments, sourceFile);
	return sourceFile.text.slice(range.begin, range.end);
}

function isBuiltInTypedArray(name: string) {
	return builtInTypedArrays.has(name);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent placement of type arguments in constructor calls.",
		id: "genericConstructorCalls",
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
	options: {
		style: z
			.enum(["constructor", "type-annotation"])
			.default("constructor")
			.describe(
				"Where to prefer type arguments: 'constructor' for the constructor call, 'type-annotation' for the type annotation.",
			),
	},
	setup(context) {
		function checkDeclaration(
			identifier: AST.BindingPattern | AST.Identifier,
			typeAnnotation: AST.TypeNode | undefined,
			initializer: AST.Expression | undefined,
			sourceFile: AST.SourceFile,
			style: "constructor" | "type-annotation",
		) {
			if (!initializer || !ts.isNewExpression(initializer)) {
				return;
			}

			if (!ts.isIdentifier(initializer.expression)) {
				return;
			}

			const constructorName = initializer.expression.text;
			const constructorTypeArgs = initializer.typeArguments;

			if (!typeAnnotation) {
				if (style === "type-annotation" && constructorTypeArgs) {
					const typeArgsText = getTypeArgumentsText(
						constructorTypeArgs,
						sourceFile,
					);
					const typeAnnotationText = `${constructorName}${typeArgsText}`;

					const identifierEnd = ts.isIdentifier(identifier)
						? identifier.getEnd()
						: identifier.getEnd();

					const typeArgsRange = getTypeArgumentsRange(
						constructorTypeArgs,
						sourceFile,
					);

					context.report({
						fix: [
							{
								range: typeArgsRange,
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
						range: typeArgsRange,
					});
				}
				return;
			}

			if (!ts.isTypeReferenceNode(typeAnnotation)) {
				return;
			}

			if (!ts.isIdentifier(typeAnnotation.typeName)) {
				return;
			}

			const annotationTypeName = typeAnnotation.typeName.text;

			if (annotationTypeName !== constructorName) {
				return;
			}

			if (isBuiltInTypedArray(annotationTypeName)) {
				return;
			}

			const annotationTypeArgs = typeAnnotation.typeArguments;

			if (!annotationTypeArgs && !constructorTypeArgs) {
				return;
			}

			if (annotationTypeArgs && constructorTypeArgs) {
				return;
			}

			if (
				style === "constructor" &&
				annotationTypeArgs &&
				!constructorTypeArgs
			) {
				const typeArgsText = getTypeArgumentsText(
					annotationTypeArgs,
					sourceFile,
				);
				const typeArgsRange = getTypeArgumentsRange(
					annotationTypeArgs,
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
				!annotationTypeArgs &&
				constructorTypeArgs
			) {
				const typeArgsText = getTypeArgumentsText(
					constructorTypeArgs,
					sourceFile,
				);
				const typeArgsRange = getTypeArgumentsRange(
					constructorTypeArgs,
					sourceFile,
				);
				const newTypeAnnotation = `${annotationTypeName}${typeArgsText}`;

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
							range: typeArgsRange,
							text: "",
						},
					],
					message: "preferTypeAnnotation",
					range: typeArgsRange,
				});
			}
		}

		return {
			visitors: {
				PropertyDeclaration: (node, { options, sourceFile }) => {
					checkDeclaration(
						node.name as AST.Identifier,
						node.type,
						node.initializer,
						sourceFile,
						options.style,
					);
				},
				VariableDeclaration: (node, { options, sourceFile }) => {
					checkDeclaration(
						node.name,
						node.type,
						node.initializer,
						sourceFile,
						options.style,
					);
				},
			},
		};
	},
});
