import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

type BodyNode =
	| AST.Block
	| AST.ClassDeclaration
	| AST.ClassExpression
	| AST.InterfaceDeclaration
	| AST.ModuleBlock
	| AST.SourceFile
	| AST.TypeLiteralNode;

interface Method {
	callSignature: boolean;
	name: string;
	static: boolean;
	type: "computed" | "normal" | "quoted";
}

function getMemberMethod(
	member: AST.ClassElement | AST.Statement | AST.TypeElement,
): Method | undefined {
	switch (member.kind) {
		case SyntaxKind.CallSignature:
			return {
				callSignature: true,
				name: "call",
				static: false,
				type: "normal",
			};

		case SyntaxKind.Constructor:
			return {
				callSignature: false,
				name: "constructor",
				static: false,
				type: "normal",
			};

		case SyntaxKind.ConstructSignature:
			return {
				callSignature: false,
				name: "new",
				static: false,
				type: "normal",
			};

		case SyntaxKind.ExportAssignment:
		case SyntaxKind.ExportDeclaration:
			return undefined;

		case SyntaxKind.FunctionDeclaration: {
			const name = member.name?.text;
			if (name == undefined) {
				return undefined;
			}
			return {
				callSignature: false,
				name,
				static: false,
				type: "normal",
			};
		}

		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature: {
			const nameInfo = getNameFromPropertyName(member.name);
			if (!nameInfo) {
				return undefined;
			}
			return {
				callSignature: false,
				name: nameInfo.name,
				static: isStatic(member),
				type: nameInfo.type,
			};
		}
	}

	if (
		ts.isExportDeclaration(member) ||
		ts.isImportDeclaration(member) ||
		ts.isTypeAliasDeclaration(member) ||
		ts.isInterfaceDeclaration(member) ||
		ts.isClassDeclaration(member) ||
		ts.isEnumDeclaration(member) ||
		ts.isModuleDeclaration(member)
	) {
		return undefined;
	}

	return undefined;
}

function getMembers(node: BodyNode) {
	switch (node.kind) {
		case SyntaxKind.Block:
		case SyntaxKind.ModuleBlock:
		case SyntaxKind.SourceFile:
			return node.statements;
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression:
			return node.members;
		case SyntaxKind.InterfaceDeclaration:
			return node.members;
		case SyntaxKind.TypeLiteral:
			return node.members;
	}
}

function getMethodDisplayName(method: Method) {
	if (method.static) {
		return `static ${method.name}`;
	}
	if (method.type === "quoted") {
		return `"${method.name}"`;
	}
	return method.name;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getNameFromPropertyName(
	name: ts.PropertyName,
): undefined | { name: string; type: "computed" | "normal" | "quoted" } {
	switch (name.kind) {
		case SyntaxKind.ComputedPropertyName:
			if (ts.isStringLiteral(name.expression)) {
				return { name: name.expression.text, type: "quoted" };
			}
			return undefined;

		case SyntaxKind.Identifier:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.PrivateIdentifier:
			return { name: name.text, type: "normal" };

		case SyntaxKind.StringLiteral:
			return { name: name.text, type: "quoted" };

		default:
			return undefined;
	}
}

function isSameMethod(method1: Method, method2: Method | undefined) {
	return (
		!!method2 &&
		method1.name === method2.name &&
		method1.static === method2.static &&
		method1.callSignature === method2.callSignature &&
		method1.type === method2.type
	);
}

function isStatic(node: ts.Node) {
	return (
		ts.canHaveModifiers(node) &&
		!!node.modifiers?.some((mod) => mod.kind === SyntaxKind.StaticKeyword)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Require that function overload signatures be consecutive.",
		id: "overloadSignaturesAdjacent",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		overloadSignatureSeparated: {
			primary: "All {{ name }} signatures should be adjacent.",
			secondary: [
				"Separating overload signatures makes code harder to read and maintain.",
				"Grouping all overloads for a function together makes it easier to read and understand that function.",
			],
			suggestions: [
				"Group all overload signatures for this function together.",
			],
		},
	},
	setup(context) {
		function checkNode(node: BodyNode, { sourceFile }: TypeScriptFileServices) {
			const members = getMembers(node);
			let lastMethod: Method | undefined;
			const seenMethods: Method[] = [];

			for (const member of members) {
				const method = getMemberMethod(member);
				if (method == undefined) {
					lastMethod = undefined;
					continue;
				}

				const indexOfSameMethod = seenMethods.findIndex((seenMethod) =>
					isSameMethod(method, seenMethod),
				);

				if (indexOfSameMethod > -1 && !isSameMethod(method, lastMethod)) {
					context.report({
						data: { name: getMethodDisplayName(method) },
						message: "overloadSignatureSeparated",
						range: getTSNodeRange(member, sourceFile),
					});
				} else if (indexOfSameMethod === -1) {
					seenMethods.push(method);
				}

				lastMethod = method;
			}
		}

		return {
			visitors: {
				Block: checkNode,
				ClassDeclaration: checkNode,
				ClassExpression: checkNode,
				InterfaceDeclaration: checkNode,
				ModuleBlock: checkNode,
				SourceFile: checkNode,
				TypeLiteral: checkNode,
			},
		};
	},
});
