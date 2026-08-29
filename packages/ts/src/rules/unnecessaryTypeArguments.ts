import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import {
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

type SupportedNode =
	| AST.CallExpression
	| AST.ExpressionWithTypeArguments
	| AST.JsxOpeningElement
	| AST.JsxSelfClosingElement
	| AST.NewExpression
	| AST.TaggedTemplateExpression
	| AST.TypeReferenceNode;

function areTypesIdentical(
	first: ts.Type,
	second: ts.Type,
	typeChecker: Checker,
) {
	if (first === second) {
		return true;
	}

	if (!tsutils.isTypeReference(first) || !tsutils.isTypeReference(second)) {
		return false;
	}

	if (first.target !== second.target) {
		return false;
	}

	const firstTypeArguments = typeChecker.getTypeArguments(first);
	const secondTypeArguments = typeChecker.getTypeArguments(second);
	return (
		firstTypeArguments.length === secondTypeArguments.length &&
		firstTypeArguments.every(
			(typeArgument, index) => typeArgument === secondTypeArguments[index],
		)
	);
}

function constructorCanInferSoleTypeArgument(
	node: AST.NewExpression,
	declaration: ts.SignatureDeclaration,
	typeParameters: ts.NodeArray<ts.TypeParameterDeclaration>,
	typeChecker: Checker,
) {
	if (node.typeArguments?.length !== 1 || !node.arguments?.length) {
		return false;
	}

	const typeParameterSymbols = new Set(
		typeParameters
			.map((typeParameter) =>
				typeChecker.getSymbolAtLocation(typeParameter.name),
			)
			.filter((symbol) => symbol !== undefined),
	);
	function containsTypeParameter(node: ts.Node): boolean {
		const symbol = ts.isIdentifier(node)
			? typeChecker.getSymbolAtLocation(node)
			: undefined;
		if (symbol !== undefined && typeParameterSymbols.has(symbol)) {
			return true;
		}

		return ts.forEachChild(node, containsTypeParameter) === true;
	}

	return declaration.parameters.some(
		(parameter) =>
			parameter.type !== undefined && containsTypeParameter(parameter.type),
	);
}

function getDeclarationTypeParameters(
	node: SupportedNode,
	typeChecker: Checker,
) {
	if (
		node.kind === SyntaxKind.CallExpression ||
		node.kind === SyntaxKind.NewExpression ||
		node.kind === SyntaxKind.TaggedTemplateExpression ||
		node.kind === SyntaxKind.JsxOpeningElement ||
		node.kind === SyntaxKind.JsxSelfClosingElement
	) {
		const declaration = typeChecker
			.getResolvedSignature(node)
			?.getDeclaration();
		if (declaration) {
			return node.kind === SyntaxKind.NewExpression &&
				ts.isConstructorDeclaration(declaration)
				? declaration.parent.typeParameters
				: declaration.typeParameters;
		}

		if (node.kind !== SyntaxKind.NewExpression) {
			return undefined;
		}
	}

	const location =
		node.kind === SyntaxKind.TypeReference ? node.typeName : node.expression;
	return getSymbolTypeParameters(location, isTypeSideUse(node), typeChecker);
}

function getSymbolTypeParameters(
	location: AST.EntityName | AST.Expression,
	preferTypeDeclarations: boolean,
	typeChecker: Checker,
) {
	let symbol = typeChecker.getSymbolAtLocation(location);
	if (!symbol) {
		return undefined;
	}

	if (symbol.flags & ts.SymbolFlags.Alias) {
		symbol = typeChecker.getAliasedSymbol(symbol);
	}

	const declarations = symbol.getDeclarations();
	if (!declarations?.length) {
		return undefined;
	}

	function isTypeDeclaration(declaration: ts.Declaration) {
		return (
			ts.isInterfaceDeclaration(declaration) ||
			ts.isTypeAliasDeclaration(declaration)
		);
	}

	const orderedDeclarations = [
		...declarations.filter(
			(declaration) =>
				isTypeDeclaration(declaration) === preferTypeDeclarations,
		),
		...declarations.filter(
			(declaration) =>
				isTypeDeclaration(declaration) !== preferTypeDeclarations,
		),
	];

	for (const declaration of orderedDeclarations) {
		if (
			ts.isClassDeclaration(declaration) ||
			ts.isInterfaceDeclaration(declaration) ||
			ts.isTypeAliasDeclaration(declaration)
		) {
			return declaration.typeParameters;
		}
	}

	return undefined;
}

function getTypeArgumentListRange(
	node: SupportedNode,
	typeArguments: ts.NodeArray<ts.TypeNode>,
	sourceFile: AST.SourceFile,
) {
	const children = node.getChildren(sourceFile);
	const syntaxListIndex = children.findIndex(
		(child) =>
			child.kind === SyntaxKind.SyntaxList &&
			child.pos === typeArguments.pos &&
			child.end === typeArguments.end,
	);
	const lessThanToken = nullThrows(
		children[syntaxListIndex - 1],
		"Expected a type argument list to follow a less-than token.",
	);
	const greaterThanToken = nullThrows(
		children[syntaxListIndex + 1],
		"Expected a type argument list to precede a greater-than token.",
	);

	return {
		begin: lessThanToken.getStart(sourceFile),
		end: greaterThanToken.getEnd(),
	};
}

function isTypeSideUse(node: SupportedNode) {
	if (node.kind === SyntaxKind.TypeReference) {
		return true;
	}

	return (
		node.kind === SyntaxKind.ExpressionWithTypeArguments &&
		node.parent.kind === SyntaxKind.HeritageClause &&
		(node.parent.token === SyntaxKind.ImplementsKeyword ||
			node.parent.parent.kind === SyntaxKind.InterfaceDeclaration)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports type arguments that match their type parameter defaults.",
		id: "unnecessaryTypeArguments",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryTypeArgument: {
			primary: "This type argument repeats its type parameter's default.",
			secondary: [
				"Omitting a defaulted type argument reduces duplication while preserving the declared default.",
			],
			suggestions: ["Remove the redundant type argument."],
		},
	},
	setup(context) {
		function check(
			node: SupportedNode,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		) {
			if (
				node.kind === SyntaxKind.ExpressionWithTypeArguments &&
				node.parent.kind !== SyntaxKind.HeritageClause
			) {
				return;
			}

			const typeArguments = node.typeArguments;
			if (!typeArguments?.length) {
				return;
			}

			const typeParameters = getDeclarationTypeParameters(node, typeChecker);
			const typeArgumentIndex = typeArguments.length - 1;
			const typeArgument = typeArguments[typeArgumentIndex];
			const typeParameter = typeParameters?.[typeArgumentIndex];
			if (!typeParameters || !typeArgument || !typeParameter?.default) {
				return;
			}

			if (
				!areTypesIdentical(
					typeChecker.getTypeAtLocation(typeArgument),
					typeChecker.getTypeAtLocation(typeParameter.default),
					typeChecker,
				)
			) {
				return;
			}

			if (node.kind === SyntaxKind.NewExpression) {
				const declaration = typeChecker
					.getResolvedSignature(node)
					?.getDeclaration();
				if (
					declaration &&
					constructorCanInferSoleTypeArgument(
						node,
						declaration,
						typeParameters,
						typeChecker,
					)
				) {
					return;
				}
			}

			const range =
				typeArguments.length === 1
					? getTypeArgumentListRange(node, typeArguments, sourceFile)
					: {
							begin: nullThrows(
								typeArguments[typeArgumentIndex - 1],
								"Expected a preceding type argument.",
							).getEnd(),
							end: typeArgument.getEnd(),
						};
			const change = { range, text: "" };
			const report = {
				message: "unnecessaryTypeArgument" as const,
				range: {
					begin: typeArgument.getStart(sourceFile),
					end: typeArgument.getEnd(),
				},
			};
			if (countCommentsInRange(sourceFile.text, range)) {
				context.report(report);
			} else if (
				node.kind === SyntaxKind.TypeReference ||
				node.kind === SyntaxKind.ExpressionWithTypeArguments
			) {
				context.report({ ...report, fix: change });
			} else {
				context.report({
					...report,
					suggestions: [{ ...change, id: "removeTypeArgument" }],
				});
			}
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				ExpressionWithTypeArguments: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				JsxOpeningElement: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				JsxSelfClosingElement: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				NewExpression: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				TaggedTemplateExpression: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
				TypeReference: (node, { sourceFile, typeChecker }) => {
					check(node, sourceFile, typeChecker);
				},
			},
		};
	},
});
