import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { applyChangesToText, type FileChange } from "@flint.fyi/core";
import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

type CheckedNode = AST.ClassDeclaration | AST.ClassExpression | FunctionLike;
type FunctionLike =
	| AST.ArrowFunction
	| AST.CallSignatureDeclaration
	| AST.ConstructorTypeNode
	| AST.FunctionDeclaration
	| AST.FunctionExpression
	| AST.FunctionTypeNode
	| AST.MethodDeclaration
	| AST.MethodSignature;

interface MappedType extends ts.ObjectType {
	constraintType?: ts.Type;
	nameType?: ts.Type;
	templateType?: ts.Type;
	typeParameter: ts.Type;
}

interface OperatorType extends ts.Type {
	type: ts.Type;
}

function collectTypeParameterUsageCounts(
	typeChecker: ts.TypeChecker,
	node: ts.Node,
	counts: Map<ts.Identifier, number>,
	fromClass: boolean,
) {
	const visitedSymbolLists = new Set<ts.Symbol[]>();
	const typeUsages = new Map<ts.Type, number>();
	const visitedConstraints = new Set<ts.TypeNode>();
	let visitedDefault = false;

	function incrementIdentifierCount(
		identifier: ts.Identifier,
		assumeMultipleUses: boolean,
	) {
		counts.set(
			identifier,
			(counts.get(identifier) ?? 0) + (assumeMultipleUses ? 2 : 1),
		);
	}

	function visitTypes(types: readonly ts.Type[], assumeMultipleUses: boolean) {
		for (const type of types) {
			visitType(type, assumeMultipleUses);
		}
	}

	function visitSymbols(symbols: ts.Symbol[], assumeMultipleUses: boolean) {
		if (visitedSymbolLists.has(symbols)) {
			return;
		}
		visitedSymbolLists.add(symbols);
		for (const symbol of symbols) {
			visitType(typeChecker.getTypeOfSymbol(symbol), assumeMultipleUses);
		}
	}

	function visitSignature(signature: ts.Signature) {
		if (signature.thisParameter) {
			visitType(typeChecker.getTypeOfSymbol(signature.thisParameter), false);
		}
		for (const parameter of signature.parameters) {
			visitType(typeChecker.getTypeOfSymbol(parameter), false);
		}
		visitTypes(signature.getTypeParameters() ?? [], false);
		visitType(
			typeChecker.getTypePredicateOfSignature(signature)?.type ??
				signature.getReturnType(),
			false,
			true,
		);
	}

	function visitType(
		type: ts.Type | undefined,
		assumeMultipleUses: boolean,
		isReturnType = false,
	) {
		if (!type) {
			return;
		}
		const usageCount = (typeUsages.get(type) ?? 0) + 1;
		typeUsages.set(type, usageCount);
		if (usageCount > 9) {
			return;
		}

		if (tsutils.isTypeParameter(type)) {
			const declaration = type
				.getSymbol()
				?.getDeclarations()?.[0] as ts.TypeParameterDeclaration;
			incrementIdentifierCount(declaration.name, assumeMultipleUses);
			if (
				declaration.constraint &&
				!visitedConstraints.has(declaration.constraint)
			) {
				visitedConstraints.add(declaration.constraint);
				visitType(typeChecker.getTypeAtLocation(declaration.constraint), false);
			}
			if (declaration.default && !visitedDefault) {
				visitedDefault = true;
				visitType(typeChecker.getTypeAtLocation(declaration.default), false);
			}
			return;
		}
		if (type.aliasTypeArguments) {
			visitTypes(type.aliasTypeArguments, true);
			return;
		}
		if (tsutils.isUnionOrIntersectionType(type)) {
			visitTypes(type.types, assumeMultipleUses);
			return;
		}
		if (tsutils.isIndexedAccessType(type)) {
			visitType(type.objectType, assumeMultipleUses);
			visitType(type.indexType, assumeMultipleUses);
			return;
		}
		if (tsutils.isTypeReference(type)) {
			for (const typeArgument of nullThrows(
				type.typeArguments,
				"Type references should provide a type arguments array",
			)) {
				let repeated = fromClass || assumeMultipleUses;
				repeated ||= tsutils.isTupleType(type.target)
					? isReturnType && !type.target.readonly
					: typeChecker.isArrayType(type.target)
						? isReturnType && type.symbol.getName() === "Array"
						: true;
				visitType(typeArgument, repeated, isReturnType);
			}
			return;
		}
		if (tsutils.isTemplateLiteralType(type)) {
			visitTypes(type.types, assumeMultipleUses);
			return;
		}
		if (tsutils.isConditionalType(type)) {
			visitType(type.checkType, assumeMultipleUses);
			visitType(type.extendsType, assumeMultipleUses);
			return;
		}
		if (tsutils.isObjectType(type)) {
			const properties = type.getProperties();
			visitSymbols(properties, false);
			if (isMappedType(type)) {
				visitType(type.typeParameter, false);
				if (!properties.length) {
					visitType(type.templateType ?? type.constraintType, false);
				}
				visitType(type.nameType, false);
			}
			visitType(type.getNumberIndexType(), true);
			visitType(type.getStringIndexType(), true);
			for (const signature of type.getCallSignatures()) {
				visitSignature(signature);
			}
			for (const signature of type.getConstructSignatures()) {
				visitSignature(signature);
			}
			return;
		}
		if (isOperatorType(type)) {
			visitType(type.type, assumeMultipleUses);
		}
	}

	if (
		ts.isCallSignatureDeclaration(node) ||
		ts.isConstructorDeclaration(node)
	) {
		visitSignature(
			nullThrows(
				typeChecker.getSignatureFromDeclaration(node),
				"Signature declarations should resolve to signatures",
			),
		);
		return;
	}
	visitType(typeChecker.getTypeAtLocation(node), false);
}

function countTypeParameterUsage(
	typeChecker: ts.TypeChecker,
	node: CheckedNode,
) {
	const counts = new Map<ts.Identifier, number>();

	if (ts.isClassLike(node)) {
		for (const typeParameter of node.typeParameters as ts.NodeArray<ts.TypeParameterDeclaration>) {
			collectTypeParameterUsageCounts(typeChecker, typeParameter, counts, true);
		}
		for (const member of node.members) {
			collectTypeParameterUsageCounts(typeChecker, member, counts, true);
		}
	} else {
		collectTypeParameterUsageCounts(typeChecker, node, counts, false);
	}

	return counts;
}

function getSuggestion(
	node: CheckedNode,
	typeParameter: AST.TypeParameterDeclaration,
	services: TypeScriptFileServices,
) {
	const { sourceFile, typeChecker } = services;
	const symbol = typeChecker.getSymbolAtLocation(typeParameter.name);
	const constraint = typeParameter.constraint;
	const constraintText =
		constraint && constraint.kind !== SyntaxKind.AnyKeyword
			? constraint.getText(sourceFile)
			: "unknown";
	const complexConstraint =
		constraint?.kind === SyntaxKind.UnionType ||
		constraint?.kind === SyntaxKind.IntersectionType ||
		constraint?.kind === SyntaxKind.ConditionalType;
	const nodeStart = node.getStart(sourceFile);
	const changes: FileChange[] = [];

	function visit(child: ts.Node) {
		if (child === typeParameter) {
			return;
		}
		if (
			ts.isIdentifier(child) &&
			typeChecker.getSymbolAtLocation(child) === symbol
		) {
			const surroundingType = child.parent.parent;
			const parenthesize =
				complexConstraint &&
				(surroundingType.kind === SyntaxKind.ArrayType ||
					surroundingType.kind === SyntaxKind.IndexedAccessType ||
					surroundingType.kind === SyntaxKind.UnionType ||
					surroundingType.kind === SyntaxKind.IntersectionType);
			changes.push({
				range: {
					begin: child.getStart(sourceFile) - nodeStart,
					end: child.getEnd() - nodeStart,
				},
				text: parenthesize ? `(${constraintText})` : constraintText,
			});
		}
		ts.forEachChild(child, visit);
	}
	ts.forEachChild(node, visit);

	const typeParameters = nullThrows(
		node.typeParameters,
		"Checked generic declarations should contain type parameters",
	);
	const index = typeParameters.indexOf(typeParameter);
	if (typeParameters.length === 1) {
		changes.push({
			range: {
				begin: typeParameters.pos - 1 - nodeStart,
				end: typeParameters.end + 1 - nodeStart,
			},
			text: "",
		});
	} else {
		const begin = index
			? sourceFile.text.lastIndexOf(",", typeParameter.getStart(sourceFile))
			: typeParameter.getStart(sourceFile);
		const end = index
			? typeParameter.getEnd()
			: getFirstTypeParameterRemovalEnd();
		changes.push({
			range: { begin: begin - nodeStart, end: end - nodeStart },
			text: "",
		});
	}

	function getFirstTypeParameterRemovalEnd() {
		const nextTypeParameter = nullThrows(
			typeParameters[1],
			"First type parameters should have a following type parameter",
		);
		return Math.min(
			ts.getLeadingCommentRanges(
				sourceFile.text,
				nextTypeParameter.getFullStart(),
			)?.[0]?.pos ?? Number.POSITIVE_INFINITY,
			ts.getTrailingCommentRanges(
				sourceFile.text,
				nextTypeParameter.getFullStart(),
			)?.[0]?.pos ?? Number.POSITIVE_INFINITY,
			nextTypeParameter.getStart(sourceFile),
		);
	}

	return {
		id: "replaceWithConstraint",
		range: getTSNodeRange(node, sourceFile),
		text: applyChangesToText(
			changes,
			sourceFile.text.slice(nodeStart, node.getEnd()),
		),
	};
}

function isMappedType(type: ts.Type): type is MappedType {
	return "typeParameter" in type;
}

function isOperatorType(type: ts.Type): type is OperatorType {
	return "type" in type && !!type.type;
}

function isTypeParameterRepeatedInAST(
	node: CheckedNode,
	typeParameter: AST.TypeParameterDeclaration,
	typeChecker: ts.TypeChecker,
) {
	if (
		node.kind === SyntaxKind.ClassDeclaration ||
		node.kind === SyntaxKind.ClassExpression
	) {
		return false;
	}

	const body =
		node.kind === SyntaxKind.ArrowFunction ||
		node.kind === SyntaxKind.FunctionDeclaration ||
		node.kind === SyntaxKind.FunctionExpression ||
		node.kind === SyntaxKind.MethodDeclaration
			? node.body
			: undefined;
	const symbol = typeChecker.getSymbolAtLocation(typeParameter.name);
	let usageCount = 0;
	let repeated = false;

	function visit(child: ts.Node) {
		if (repeated || child === typeParameter || child === body) {
			return;
		}

		if (
			ts.isIdentifier(child) &&
			typeChecker.getSymbolAtLocation(child) === symbol
		) {
			let containingType = child.parent;
			while (
				ts.isUnionTypeNode(containingType.parent) ||
				ts.isIntersectionTypeNode(containingType.parent)
			) {
				containingType = containingType.parent;
			}

			const outerType = containingType.parent;
			if (
				ts.isTypeReferenceNode(outerType) &&
				outerType.typeArguments?.includes(containingType as ts.TypeNode) &&
				(!ts.isIdentifier(outerType.typeName) ||
					(outerType.typeName.text !== "Array" &&
						outerType.typeName.text !== "ReadonlyArray"))
			) {
				repeated = true;
				return;
			}

			repeated = ++usageCount > 1;
		}

		ts.forEachChild(child, visit);
	}

	ts.forEachChild(node, visit);
	return repeated;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports type parameters that aren't used multiple times.",
		id: "unnecessaryTypeParameters",
		presets: ["logical"],
	},
	messages: {
		neverUsed: {
			primary:
				"Type parameter {{ name }} is never used in the {{ descriptor }} signature.",
			secondary: [
				"A type parameter is useful when it relates multiple types in a signature.",
			],
			suggestions: ["Replace the type parameter with its constraint."],
		},
		usedOnce: {
			primary:
				"Type parameter {{ name }} is used only once in the {{ descriptor }} signature.",
			secondary: [
				"A type parameter used once does not express a relationship between types.",
			],
			suggestions: ["Replace the type parameter with its constraint."],
		},
	},
	setup(context) {
		function checkNode(
			node: CheckedNode,
			descriptor: "class" | "function",
			services: TypeScriptFileServices,
		) {
			if (!node.typeParameters?.length) {
				return;
			}
			const counts = countTypeParameterUsage(services.typeChecker, node);
			for (const typeParameter of node.typeParameters) {
				if (
					isTypeParameterRepeatedInAST(
						node,
						typeParameter,
						services.typeChecker,
					)
				) {
					continue;
				}
				const count = counts.get(typeParameter.name);
				if (!count || count > 2) {
					continue;
				}
				context.report({
					data: { descriptor, name: typeParameter.name.text },
					message: count === 1 ? "neverUsed" : "usedOnce",
					range: getTSNodeRange(typeParameter, services.sourceFile),
					suggestions: [getSuggestion(node, typeParameter, services)],
				});
			}
		}

		return {
			visitors: {
				ArrowFunction: (node, services) => {
					checkNode(node, "function", services);
				},
				CallSignature: (node, services) => {
					checkNode(node, "function", services);
				},
				ClassDeclaration: (node, services) => {
					checkNode(node, "class", services);
				},
				ClassExpression: (node, services) => {
					checkNode(node, "class", services);
				},
				ConstructorType: (node, services) => {
					checkNode(node, "function", services);
				},
				FunctionDeclaration: (node, services) => {
					checkNode(node, "function", services);
				},
				FunctionExpression: (node, services) => {
					checkNode(node, "function", services);
				},
				FunctionType: (node, services) => {
					checkNode(node, "function", services);
				},
				MethodDeclaration: (node, services) => {
					checkNode(node, "function", services);
				},
				MethodSignature: (node, services) => {
					checkNode(node, "function", services);
				},
			},
		};
	},
});
