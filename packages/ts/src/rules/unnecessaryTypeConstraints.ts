import ts from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// In theory, more complex constraint types could be detected with the type checker...
// ...but in practice, those types are rare, and likely not worth requiring type info.
// https://github.com/typescript-eslint/typescript-eslint/pull/2516#discussion_r495731858
const unnecessaryConstraints = new Map([
	[ts.SyntaxKind.AnyKeyword, "any"],
	[ts.SyntaxKind.UnknownKeyword, "unknown"],
]);

// In these kinds of files, a bare `<T>() => {}` is ambiguous or reserved
// syntax, so a lone arrow function type parameter needs a trailing comma
// (`<T,>() => {}`) once its constraint is removed.
const disambiguationFileExtensions = new Set<string>([
	ts.Extension.Cts,
	ts.Extension.Mts,
	ts.Extension.Tsx,
]);

function requiresGenericDeclarationDisambiguation(fileName: string) {
	return disambiguationFileExtensions.has(
		fileName.slice(fileName.lastIndexOf(".")),
	);
}

function shouldAddTrailingComma(
	node: AST.TypeParameterDeclaration,
	sourceFile: AST.SourceFile,
) {
	if (
		node.parent.kind !== ts.SyntaxKind.ArrowFunction ||
		!requiresGenericDeclarationDisambiguation(sourceFile.fileName)
	) {
		return false;
	}

	// Only a lone `<T>() => {}` type parameter would need a trailing comma.
	return (
		node.parent.typeParameters?.length === 1 &&
		!node.parent.typeParameters.hasTrailingComma &&
		!node.default
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary constraints on generic type parameters.",
		id: "unnecessaryTypeConstraints",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryConstraint: {
			primary:
				"Constraining the generic type `{{ name }}` to `{{ constraint }}` does nothing and is unnecessary.",
			secondary: [
				"Generic type parameters without an `extends` clause are already implicitly constrained to `unknown`.",
				"Because every type is assignable to both `any` and `unknown`, writing out either constraint doesn't change which types the parameter accepts.",
			],
			suggestions: [
				"Remove the `extends` constraint to keep the same behavior with less code.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeParameter: (node, { sourceFile }) => {
					// Mapped types (`{[Key in Keys]: ...}`) and inferred types
					// (`infer Element extends Bound`) use their type parameter
					// nodes for more than declaring a constrained generic type.
					if (
						node.parent.kind === ts.SyntaxKind.InferType ||
						node.parent.kind === ts.SyntaxKind.MappedType ||
						!node.constraint
					) {
						return;
					}

					const constraint = unnecessaryConstraints.get(node.constraint.kind);
					if (constraint === undefined) {
						return;
					}

					const range = {
						begin: node.name.getEnd(),
						end: node.constraint.getEnd(),
					};

					context.report({
						data: {
							constraint,
							name: node.name.text,
						},
						message: "unnecessaryConstraint",
						range,
						suggestions: [
							{
								id: "removeConstraint",
								range,
								text: shouldAddTrailingComma(node, sourceFile) ? "," : "",
							},
						],
					});
				},
			},
		};
	},
});
