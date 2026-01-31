import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const options = {
	ignoreDifferentlyNamedParameters: z
		.boolean()
		.default(false)
		.describe(
			"Whether to ignore overloads whose parameters have different names in the same position.",
		),
	ignoreOverloadsWithDifferentJSDoc: z
		.boolean()
		.default(false)
		.describe(
			"Whether to ignore overloads whose JSDoc comments differ between signatures.",
		),
};

interface Failure {
	only2: boolean;
	unify: Unify;
}

type IsTypeParameter = (typeName: string) => boolean;

type Options = z.infer<z.ZodObject<typeof options>>;

type OverloadNode =
	| AST.CallSignatureDeclaration
	| AST.ConstructorDeclaration
	| AST.ConstructSignatureDeclaration
	| AST.FunctionDeclaration
	| AST.MethodDeclaration
	| AST.MethodSignature;

type ScopeNode =
	| AST.ClassDeclaration
	| AST.ClassExpression
	| AST.InterfaceDeclaration
	| AST.ModuleBlock
	| AST.SourceFile
	| AST.TypeLiteralNode;

type Unify =
	| {
			extraParameter: AST.ParameterDeclaration;
			kind: "extra-parameter";
			otherSignature: OverloadNode;
	  }
	| {
			kind: "single-parameter-difference";
			p0: AST.ParameterDeclaration;
			p1: AST.ParameterDeclaration;
	  };

const accessorKinds = new Set([
	ts.SyntaxKind.GetAccessor,
	ts.SyntaxKind.SetAccessor,
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports function overloads that could be unified.",
		id: "unifiedSignatures",
		presets: ["stylistic"],
	},
	messages: {
		omittingRestParameter: {
			primary: "{{ failureStringStart }} with a rest parameter.",
			secondary: [
				"Overloads that differ by an extra rest parameter can be unified into a single signature.",
			],
			suggestions: ["Use a rest parameter to unify the overloads."],
		},
		omittingSingleParameter: {
			primary: "{{ failureStringStart }} with an optional parameter.",
			secondary: [
				"Overloads that differ by a single parameter can often be combined using an optional parameter.",
			],
			suggestions: ["Use an optional parameter to unify the overloads."],
		},
		singleParameterDifference: {
			primary: "{{ failureStringStart }} taking `{{ type1 }} | {{ type2 }}`.",
			secondary: [
				"Overloads that differ only in a single parameter type can usually be replaced by a union type.",
			],
			suggestions: ["Combine the parameter types into a union."],
		},
	},
	options,
	setup(context) {
		function failureStringStart(otherLine?: number): string {
			const overloads =
				otherLine == null
					? "These overloads"
					: `This overload and the one on line ${otherLine}`;
			return `${overloads} can be combined into one signature`;
		}

		function addFailures(failures: Failure[], sourceFile: ts.SourceFile) {
			for (const failure of failures) {
				const { only2, unify } = failure;
				switch (unify.kind) {
					case "single-parameter-difference": {
						const { p0, p1 } = unify;
						const lineOfOtherOverload = only2
							? undefined
							: getLineOfNode(p0, sourceFile);

						context.report({
							data: {
								failureStringStart: failureStringStart(lineOfOtherOverload),
								type1: getTypeText(p0.type, sourceFile),
								type2: getTypeText(p1.type, sourceFile),
							},
							message: "singleParameterDifference",
							range: getTSNodeRange(p1, sourceFile),
						});
						break;
					}
					case "extra-parameter": {
						const { extraParameter, otherSignature } = unify;
						const lineOfOtherOverload = only2
							? undefined
							: getLineOfNode(otherSignature, sourceFile);

						context.report({
							data: {
								failureStringStart: failureStringStart(lineOfOtherOverload),
							},
							message: extraParameter.dotDotDotToken
								? "omittingRestParameter"
								: "omittingSingleParameter",
							range: getTSNodeRange(extraParameter, sourceFile),
						});
					}
				}
			}
		}

		function checkOverloads(
			signatures: readonly OverloadNode[][],
			sourceFile: ts.SourceFile,
			typeParameters?: AST.NodeArray<AST.TypeParameterDeclaration>,
			ignoreDifferentlyNamedParameters = false,
			ignoreOverloadsWithDifferentJSDoc = false,
		): Failure[] {
			const result: Failure[] = [];
			const isTypeParameter = getIsTypeParameter(typeParameters);
			for (const overloads of signatures) {
				forEachPair(overloads, (a, b) => {
					const unify = compareSignatures(
						a,
						b,
						{
							ignoreDifferentlyNamedParameters,
							ignoreOverloadsWithDifferentJSDoc,
						},
						sourceFile,
						isTypeParameter,
					);
					if (unify) {
						result.push({ only2: overloads.length === 2, unify });
					}
				});
			}
			return result;
		}

		function compareSignatures(
			a: OverloadNode,
			b: OverloadNode,
			{
				ignoreDifferentlyNamedParameters,
				ignoreOverloadsWithDifferentJSDoc,
			}: {
				ignoreDifferentlyNamedParameters: boolean;
				ignoreOverloadsWithDifferentJSDoc: boolean;
			},
			sourceFile: ts.SourceFile,
			isTypeParameter: IsTypeParameter,
		): undefined | Unify {
			if (
				!signaturesCanBeUnified(
					a,
					b,
					{
						ignoreDifferentlyNamedParameters,
						ignoreOverloadsWithDifferentJSDoc,
					},
					sourceFile,
					isTypeParameter,
				)
			) {
				return undefined;
			}

			return a.parameters.length === b.parameters.length
				? signaturesDifferBySingleParameter(a.parameters, b.parameters)
				: signaturesDifferByOptionalOrRestParameter(a, b, sourceFile);
		}

		function signaturesCanBeUnified(
			a: OverloadNode,
			b: OverloadNode,
			{
				ignoreDifferentlyNamedParameters,
				ignoreOverloadsWithDifferentJSDoc,
			}: {
				ignoreDifferentlyNamedParameters: boolean;
				ignoreOverloadsWithDifferentJSDoc: boolean;
			},
			sourceFile: ts.SourceFile,
			isTypeParameter: IsTypeParameter,
		): boolean {
			const aTypeParams = a.typeParameters?.map((param) => param) ?? [];
			const bTypeParams = b.typeParameters?.map((param) => param) ?? [];

			if (ignoreDifferentlyNamedParameters) {
				const commonParamsLength = Math.min(
					a.parameters.length,
					b.parameters.length,
				);
				for (let i = 0; i < commonParamsLength; i++) {
					const aParam = a.parameters[i];
					const bParam = b.parameters[i];
					if (!aParam || !bParam) {
						continue;
					}
					if (
						getStaticParameterName(aParam) !== getStaticParameterName(bParam)
					) {
						return false;
					}
				}
			}

			if (ignoreOverloadsWithDifferentJSDoc) {
				const aComment = getJSDocText(getCommentTargetNode(a), sourceFile);
				const bComment = getJSDocText(getCommentTargetNode(b), sourceFile);
				if (aComment !== bComment) {
					return false;
				}
			}

			return (
				typesAreEqual(a.type, b.type, sourceFile) &&
				arraysAreEqual(aTypeParams, bTypeParams, (left, right) =>
					typeParametersAreEqual(left, right, sourceFile),
				) &&
				signatureUsesTypeParameter(a, isTypeParameter) ===
					signatureUsesTypeParameter(b, isTypeParameter)
			);
		}

		function signaturesDifferBySingleParameter(
			types1: readonly AST.ParameterDeclaration[],
			types2: readonly AST.ParameterDeclaration[],
		): undefined | Unify {
			const firstParam1 = types1[0];
			const firstParam2 = types2[0];
			if (isThisVoidParam(firstParam1) || isThisVoidParam(firstParam2)) {
				return undefined;
			}

			const index = getIndexOfFirstDifference(
				types1,
				types2,
				parametersAreEqual,
			);
			if (index == null) {
				return undefined;
			}

			if (
				!arraysAreEqual(
					types1.slice(index + 1),
					types2.slice(index + 1),
					parametersAreEqual,
				)
			) {
				return undefined;
			}

			const a = types1[index];
			const b = types2[index];
			return parametersHaveEqualSigils(a, b) && !a.dotDotDotToken
				? { kind: "single-parameter-difference", p0: a, p1: b }
				: undefined;
		}

		function signaturesDifferByOptionalOrRestParameter(
			a: OverloadNode,
			b: OverloadNode,
			sourceFile: ts.SourceFile,
		): undefined | Unify {
			const sig1 = a.parameters;
			const sig2 = b.parameters;

			const minLength = Math.min(sig1.length, sig2.length);
			const longer = sig1.length < sig2.length ? sig2 : sig1;
			const shorter = sig1.length < sig2.length ? sig1 : sig2;
			const shorterSig = sig1.length < sig2.length ? a : b;

			const firstParam1 = sig1.at(0);
			const firstParam2 = sig2.at(0);
			if (isThisParam(firstParam1) !== isThisParam(firstParam2)) {
				return undefined;
			}

			if (isThisVoidParam(firstParam1) || isThisVoidParam(firstParam2)) {
				return undefined;
			}

			for (let i = minLength + 1; i < longer.length; i++) {
				const param = longer[i];
				if (param && !parameterMayBeMissing(param)) {
					return undefined;
				}
			}

			for (let i = 0; i < minLength; i++) {
				const sig1Param = sig1[i];
				const sig2Param = sig2[i];
				if (
					sig1Param &&
					sig2Param &&
					!typesAreEqual(sig1Param.type, sig2Param.type, sourceFile)
				) {
					return undefined;
				}
			}

			if (minLength > 0 && shorter[minLength - 1]?.dotDotDotToken) {
				return undefined;
			}

			const extraParameter = longer[longer.length - 1];
			if (!extraParameter) {
				return undefined;
			}

			return {
				extraParameter,
				kind: "extra-parameter",
				otherSignature: shorterSig,
			};
		}

		function getIsTypeParameter(
			typeParameters?: AST.NodeArray<AST.TypeParameterDeclaration>,
		): IsTypeParameter {
			if (!typeParameters?.length) {
				return () => false;
			}
			const set = new Set<string>();
			for (const typeParam of typeParameters) {
				set.add(typeParam.name.text);
			}
			return (typeName) => set.has(typeName);
		}

		function signatureUsesTypeParameter(
			sig: OverloadNode,
			isTypeParameter: IsTypeParameter,
		): boolean {
			return sig.parameters.some((param) =>
				typeContainsTypeParameter(param.type),
			);

			function typeContainsTypeParameter(type?: AST.TypeNode): boolean {
				if (!type) {
					return false;
				}
				if (ts.isTypeReferenceNode(type)) {
					const typeName = type.typeName;
					if (ts.isIdentifier(typeName) && isTypeParameter(typeName.text)) {
						return true;
					}
				}
				let found = false;
				ts.forEachChild(type, (child) => {
					if (!found && typeContainsTypeParameter(child as AST.TypeNode)) {
						found = true;
					}
				});
				return found;
			}
		}

		function parametersAreEqual(
			a: AST.ParameterDeclaration,
			b: AST.ParameterDeclaration,
		): boolean {
			return (
				parametersHaveEqualSigils(a, b) &&
				typesAreEqual(a.type, b.type, a.getSourceFile())
			);
		}

		function parameterMayBeMissing(param: AST.ParameterDeclaration): boolean {
			return !!param.dotDotDotToken || !!param.questionToken;
		}

		function parametersHaveEqualSigils(
			a: AST.ParameterDeclaration,
			b: AST.ParameterDeclaration,
		): boolean {
			return (
				!!a.dotDotDotToken === !!b.dotDotDotToken &&
				!!a.questionToken === !!b.questionToken
			);
		}

		function typeParametersAreEqual(
			a: AST.TypeParameterDeclaration,
			b: AST.TypeParameterDeclaration,
			sourceFile: ts.SourceFile,
		): boolean {
			return (
				a.name.text === b.name.text &&
				constraintsAreEqual(a.constraint, b.constraint, sourceFile)
			);
		}

		function typesAreEqual(
			a: AST.TypeNode | undefined,
			b: AST.TypeNode | undefined,
			sourceFile: ts.SourceFile,
		): boolean {
			return (
				a === b ||
				(a != null &&
					b != null &&
					a.getText(sourceFile) === b.getText(sourceFile))
			);
		}

		function constraintsAreEqual(
			a: AST.TypeNode | undefined,
			b: AST.TypeNode | undefined,
			sourceFile: ts.SourceFile,
		): boolean {
			return (
				a === b ||
				(a != null &&
					b != null &&
					a.getText(sourceFile) === b.getText(sourceFile))
			);
		}

		function getIndexOfFirstDifference<T>(
			a: readonly T[],
			b: readonly T[],
			equal: (left: T, right: T) => boolean,
		): number | undefined {
			for (let i = 0; i < a.length && i < b.length; i++) {
				if (!equal(a[i], b[i])) {
					return i;
				}
			}
			return undefined;
		}

		function forEachPair<T>(
			values: readonly T[],
			action: (left: T, right: T) => void,
		) {
			for (let i = 0; i < values.length; i++) {
				for (let j = i + 1; j < values.length; j++) {
					const left = values[i];
					const right = values[j];
					if (left && right) {
						action(left, right);
					}
				}
			}
		}

		function getScopeMembers(node: ScopeNode) {
			switch (node.kind) {
				case ts.SyntaxKind.ClassDeclaration:
				case ts.SyntaxKind.ClassExpression:
					return node.members;
				case ts.SyntaxKind.InterfaceDeclaration:
					return node.members;
				case ts.SyntaxKind.ModuleBlock:
					return node.statements;
				case ts.SyntaxKind.SourceFile:
					return node.statements;
				case ts.SyntaxKind.TypeLiteral:
					return node.members;
			}
		}

		function isAccessor(
			node: AST.Node,
		): node is AST.GetAccessorDeclaration | AST.SetAccessorDeclaration {
			return accessorKinds.has(node.kind);
		}

		function addOverload(
			map: Map<string, OverloadNode[]>,
			node: OverloadNode,
			key?: string,
		) {
			if (!key) {
				return;
			}
			const overloads = map.get(key);
			if (overloads) {
				overloads.push(node);
			} else {
				map.set(key, [node]);
			}
		}

		function getOverloadKey(
			node: OverloadNode,
			sourceFile: ts.SourceFile,
		): string | undefined {
			switch (node.kind) {
				case ts.SyntaxKind.CallSignature:
					return "call";
				case ts.SyntaxKind.Constructor:
					return "constructor";
				case ts.SyntaxKind.ConstructSignature:
					return "construct";
				case ts.SyntaxKind.FunctionDeclaration: {
					if (node.name) {
						return `function_${node.name.text}`;
					}
					const hasDefault =
						node.modifiers?.some(
							(modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
						) ?? false;
					return hasDefault ? "default" : undefined;
				}
				case ts.SyntaxKind.MethodDeclaration:
				case ts.SyntaxKind.MethodSignature: {
					const nameText = getNameFromPropertyName(node.name, sourceFile);
					if (!nameText) {
						return undefined;
					}
					const staticPrefix = isStatic(node) ? "static" : "instance";
					return `${staticPrefix}:${nameText}`;
				}
			}
		}

		function getNameFromPropertyName(
			name: AST.PropertyName,
			sourceFile: ts.SourceFile,
		): string | undefined {
			switch (name.kind) {
				case ts.SyntaxKind.ComputedPropertyName:
					return name.getText(sourceFile);
				case ts.SyntaxKind.Identifier:
				case ts.SyntaxKind.NumericLiteral:
					return name.text;
				case ts.SyntaxKind.PrivateIdentifier:
					return `#${name.text}`;
				case ts.SyntaxKind.StringLiteral:
					return name.text;
				default:
					return undefined;
			}
		}

		function isStatic(node: AST.Node): boolean {
			return (
				ts.canHaveModifiers(node) &&
				!!node.modifiers?.some(
					(modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
				)
			);
		}

		function getStaticParameterName(
			param: AST.ParameterDeclaration,
		): string | undefined {
			if (ts.isIdentifier(param.name)) {
				return param.name.text;
			}
			return undefined;
		}

		function getTypeText(
			typeNode: AST.TypeNode | undefined,
			sourceFile: ts.SourceFile,
		): string {
			return typeNode ? typeNode.getText(sourceFile) : "any";
		}

		function getLineOfNode(node: AST.Node, sourceFile: ts.SourceFile): number {
			return (
				sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
					.line + 1
			);
		}

		function isThisParam(param: AST.ParameterDeclaration | undefined): boolean {
			return (
				!!param && ts.isIdentifier(param.name) && param.name.text === "this"
			);
		}

		function isThisVoidParam(
			param: AST.ParameterDeclaration | undefined,
		): boolean {
			return (
				isThisParam(param) && param?.type?.kind === ts.SyntaxKind.VoidKeyword
			);
		}

		function getJSDocText(
			node: AST.Node,
			sourceFile: ts.SourceFile,
		): string | undefined {
			const commentRanges = ts.getLeadingCommentRanges(
				sourceFile.text,
				node.getFullStart(),
			);
			if (!commentRanges?.length) {
				return undefined;
			}
			for (let i = commentRanges.length - 1; i >= 0; i--) {
				const range = commentRanges[i];
				if (range && range.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
					return sourceFile.text.slice(range.pos, range.end);
				}
			}
			return undefined;
		}

		function getCommentTargetNode(node: OverloadNode): AST.Node {
			if (
				ts.isFunctionDeclaration(node) &&
				node.modifiers?.some(
					(modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
				)
			) {
				return node.parent;
			}
			return node;
		}

		function arraysAreEqual<T>(
			a: readonly T[],
			b: readonly T[],
			equal: (left: T, right: T) => boolean,
		): boolean {
			if (a.length !== b.length) {
				return false;
			}
			for (let i = 0; i < a.length; i++) {
				const left = a[i];
				const right = b[i];
				if (!left || !right || !equal(left, right)) {
					return false;
				}
			}
			return true;
		}

		function collectOverloadGroups(
			node: ScopeNode,
			services: TypeScriptFileServices & { options: Options },
		) {
			const members = getScopeMembers(node);
			if (!members) {
				return;
			}
			const overloads = new Map<string, OverloadNode[]>();
			for (const member of members) {
				if (ts.isFunctionDeclaration(member) && !member.body) {
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
					continue;
				}
				if (ts.isMethodDeclaration(member) && !member.body) {
					if (isAccessor(member)) {
						continue;
					}
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
					continue;
				}
				if (ts.isMethodSignature(member)) {
					if (isAccessor(member)) {
						continue;
					}
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
					continue;
				}
				if (ts.isConstructorDeclaration(member) && !member.body) {
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
					continue;
				}
				if (ts.isCallSignatureDeclaration(member)) {
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
					continue;
				}
				if (ts.isConstructSignatureDeclaration(member)) {
					addOverload(
						overloads,
						member,
						getOverloadKey(member, services.sourceFile),
					);
				}
			}

			const scopeTypeParameters =
				(node as AST.ClassDeclaration | AST.InterfaceDeclaration)
					.typeParameters ?? undefined;
			const failures = checkOverloads(
				[...overloads.values()],
				services.sourceFile,
				scopeTypeParameters,
				services.options.ignoreDifferentlyNamedParameters,
				services.options.ignoreOverloadsWithDifferentJSDoc,
			);
			addFailures(failures, services.sourceFile);
		}

		function visitNode(
			node: AST.Node,
			services: TypeScriptFileServices & { options: Options },
		) {
			if (isScopeNode(node)) {
				collectOverloadGroups(node, services);
			}
			ts.forEachChild(node, (child) => {
				visitNode(child, services);
			});
		}

		function isScopeNode(node: AST.Node): node is ScopeNode {
			switch (node.kind) {
				case ts.SyntaxKind.ClassDeclaration:
				case ts.SyntaxKind.ClassExpression:
				case ts.SyntaxKind.InterfaceDeclaration:
				case ts.SyntaxKind.ModuleBlock:
				case ts.SyntaxKind.SourceFile:
				case ts.SyntaxKind.TypeLiteral:
					return true;
				default:
					return false;
			}
		}

		return {
			visitors: {
				SourceFile: (node, services) => {
					visitNode(
						node,
						services as TypeScriptFileServices & { options: Options },
					);
				},
			},
		};
	},
});
