import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const literalToPrimitiveTypeFlags: Record<number, ts.TypeFlags> = {
	[ts.TypeFlags.BigIntLiteral]: ts.TypeFlags.BigInt,
	[ts.TypeFlags.BooleanLiteral]: ts.TypeFlags.Boolean,
	[ts.TypeFlags.NumberLiteral]: ts.TypeFlags.Number,
	[ts.TypeFlags.StringLiteral]: ts.TypeFlags.String,
	[ts.TypeFlags.TemplateLiteral]: ts.TypeFlags.String,
};

const literalTypeFlags = [
	ts.TypeFlags.BigIntLiteral,
	ts.TypeFlags.BooleanLiteral,
	ts.TypeFlags.NumberLiteral,
	ts.TypeFlags.StringLiteral,
	ts.TypeFlags.TemplateLiteral,
];

const primitiveTypeFlags = [
	ts.TypeFlags.BigInt,
	ts.TypeFlags.Boolean,
	ts.TypeFlags.Number,
	ts.TypeFlags.String,
];

const primitiveTypeFlagNames: Record<number, string> = {
	[ts.TypeFlags.BigInt]: "bigint",
	[ts.TypeFlags.Boolean]: "boolean",
	[ts.TypeFlags.Number]: "number",
	[ts.TypeFlags.String]: "string",
};

function describeLiteralType(type: ts.Type): string {
	if (type.isStringLiteral()) {
		return JSON.stringify(type.value);
	}

	if (tsutils.isBigIntLiteralType(type)) {
		return `${type.value.negative ? "-" : ""}${type.value.base10Value}n`;
	}

	if (type.isLiteral()) {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		return String(type.value);
	}

	if (tsutils.isIntrinsicErrorType(type) && type.aliasSymbol) {
		return String(type.aliasSymbol.escapedName);
	}

	if (type.flags & ts.TypeFlags.Any) {
		return "any";
	}

	if (type.flags & ts.TypeFlags.Never) {
		return "never";
	}

	if (type.flags & ts.TypeFlags.Unknown) {
		return "unknown";
	}

	if (tsutils.isTemplateLiteralType(type)) {
		return "template literal type";
	}

	if (tsutils.isTrueLiteralType(type)) {
		return "true";
	}

	if (tsutils.isFalseLiteralType(type)) {
		return "false";
	}

	return "literal type";
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isDescendantOf(node: AST.AnyNode, potentialAncestor: ts.Node) {
	let current: ts.Node | undefined = node;

	while (current) {
		if (current === potentialAncestor) {
			return true;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isNodeInsideReturnType(node: AST.AnyNode) {
	let current = node.parent as AST.AnyNode | undefined;

	while (current) {
		if (
			current.kind === ts.SyntaxKind.FunctionDeclaration ||
			current.kind === ts.SyntaxKind.FunctionExpression ||
			current.kind === ts.SyntaxKind.ArrowFunction ||
			current.kind === ts.SyntaxKind.MethodDeclaration ||
			current.kind === ts.SyntaxKind.MethodSignature ||
			current.kind === ts.SyntaxKind.FunctionType ||
			current.kind === ts.SyntaxKind.CallSignature ||
			current.kind === ts.SyntaxKind.ConstructSignature ||
			current.kind === ts.SyntaxKind.ConstructorType
		) {
			return !!current.type && isDescendantOf(node, current.type);
		}

		current = current.parent as AST.AnyNode | undefined;
	}

	return false;
}

function unionTypePartsUnlessBoolean(type: ts.Type) {
	if (
		type.isUnion() &&
		type.types.length === 2 &&
		type.types[0] &&
		type.types[1] &&
		tsutils.isFalseLiteralType(type.types[0]) &&
		tsutils.isTrueLiteralType(type.types[1])
	) {
		return [type];
	}
	return tsutils.unionConstituents(type);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports union and intersection type constituents that are redundant or override other types.",
		id: "redundantTypeConstituents",
		presets: ["logical"],
	},
	messages: {
		errorTypeOverrides: {
			primary:
				"{{typeName}} is an 'error' type that acts as 'any' and overrides all other types in this {{container}} type.",
			secondary: [
				"Error types that resolve to 'any' make the entire union or intersection effectively 'any'.",
				"This typically indicates a type reference that TypeScript couldn't resolve.",
			],
			suggestions: ["Remove the redundant type constituent."],
		},
		literalOverridden: {
			primary: "{{literal}} is overridden by {{primitive}} in this union type.",
			secondary: [
				"When a primitive type like 'string' is in a union with a string literal, the literal is redundant.",
				"The primitive type already includes all possible literal values.",
			],
			suggestions: ["Remove the literal type."],
		},
		overridden: {
			primary:
				"{{typeName}} is overridden by other types in this {{container}} type.",
			secondary: [
				"This type constituent has no effect because it is subsumed by other types in the {{container}}.",
				"Consider removing it to simplify the type.",
			],
			suggestions: ["Remove the redundant type."],
		},
		overrides: {
			primary:
				"{{typeName}} overrides all other types in this {{container}} type.",
			secondary: [
				"This type makes all other constituents in the {{container}} redundant.",
				"Consider simplifying to just this type.",
			],
			suggestions: ["Simplify to just this type."],
		},
		primitiveOverridden: {
			primary:
				"{{primitive}} is overridden by {{literal}} in this intersection type.",
			secondary: [
				"When a primitive type intersects with its literal type, the result is the literal type.",
				"The primitive type is redundant in this intersection.",
			],
			suggestions: ["Remove the primitive type."],
		},
	},
	setup(context) {
		return {
			visitors: {
				IntersectionType: (node, { sourceFile, typeChecker }) => {
					const seenLiteralTypes = new Map<ts.TypeFlags, string[]>();
					const seenPrimitiveTypes = new Map<ts.TypeFlags, AST.TypeNode[]>();
					const seenUnionTypes = new Map<
						AST.TypeNode,
						{ typeFlags: ts.TypeFlags; typeName: string }[]
					>();

					for (const typeNode of node.types) {
						const nodeType = typeChecker.getTypeAtLocation(typeNode);
						const typeParts = unionTypePartsUnlessBoolean(nodeType);

						for (const typePart of typeParts) {
							const typeName = describeLiteralType(typePart);

							if (typePart.flags === ts.TypeFlags.Any) {
								context.report({
									data: { container: "intersection", typeName },
									message:
										typeName !== "any" ? "errorTypeOverrides" : "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (typePart.flags === ts.TypeFlags.Never) {
								context.report({
									data: { container: "intersection", typeName },
									message: "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (typePart.flags === ts.TypeFlags.Unknown) {
								context.report({
									data: { container: "intersection", typeName },
									message: "overridden",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							for (const literalTypeFlag of literalTypeFlags) {
								if (typePart.flags === literalTypeFlag) {
									const primitiveFlag =
										literalToPrimitiveTypeFlags[literalTypeFlag];
									if (primitiveFlag) {
										const existing = seenLiteralTypes.get(primitiveFlag);
										if (existing) {
											existing.push(typeName);
										} else {
											seenLiteralTypes.set(primitiveFlag, [typeName]);
										}
									}
									break;
								}
							}

							for (const primitiveTypeFlag of primitiveTypeFlags) {
								if (typePart.flags === primitiveTypeFlag) {
									const existing = seenPrimitiveTypes.get(primitiveTypeFlag);
									if (existing) {
										existing.push(typeNode);
									} else {
										seenPrimitiveTypes.set(primitiveTypeFlag, [typeNode]);
									}
								}
							}
						}

						if (typeParts.length >= 2) {
							seenUnionTypes.set(
								typeNode,
								typeParts.map((typePart) => ({
									typeFlags: typePart.flags,
									typeName: describeLiteralType(typePart),
								})),
							);
						}
					}

					if (seenUnionTypes.size > 0) {
						for (const [typeRef, typeValues] of seenUnionTypes) {
							let primitiveFlag: ts.TypeFlags | undefined;
							for (const { typeFlags } of typeValues) {
								const mapped = literalToPrimitiveTypeFlags[typeFlags];
								if (mapped && seenPrimitiveTypes.has(mapped)) {
									primitiveFlag = mapped;
								} else {
									primitiveFlag = undefined;
									break;
								}
							}
							if (primitiveFlag !== undefined) {
								context.report({
									data: {
										literal: typeValues.map((v) => v.typeName).join(" | "),
										primitive: primitiveTypeFlagNames[primitiveFlag] ?? "",
									},
									message: "primitiveOverridden",
									range: getTSNodeRange(typeRef, sourceFile),
								});
							}
						}
						return;
					}

					for (const [primitiveTypeFlag, typeNodes] of seenPrimitiveTypes) {
						const matchedLiteralTypes = seenLiteralTypes.get(primitiveTypeFlag);
						if (matchedLiteralTypes) {
							for (const typeNode of typeNodes) {
								context.report({
									data: {
										literal: matchedLiteralTypes.join(" | "),
										primitive: primitiveTypeFlagNames[primitiveTypeFlag] ?? "",
									},
									message: "primitiveOverridden",
									range: getTSNodeRange(typeNode, sourceFile),
								});
							}
						}
					}
				},
				UnionType: (node, { sourceFile, typeChecker }) => {
					const seenLiteralTypes = new Map<
						ts.TypeFlags,
						{ literalValue: string; typeNode: AST.TypeNode }[]
					>();
					const seenPrimitiveTypes = new Set<ts.TypeFlags>();

					for (const typeNode of node.types) {
						const nodeType = typeChecker.getTypeAtLocation(typeNode);
						const typeParts = unionTypePartsUnlessBoolean(nodeType);

						for (const typePart of typeParts) {
							const typeName = describeLiteralType(typePart);

							if (
								typePart.flags === ts.TypeFlags.Any ||
								typePart.flags === ts.TypeFlags.Unknown
							) {
								context.report({
									data: { container: "union", typeName },
									message:
										typePart.flags === ts.TypeFlags.Any && typeName !== "any"
											? "errorTypeOverrides"
											: "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (
								typePart.flags === ts.TypeFlags.Never &&
								!isNodeInsideReturnType(node)
							) {
								context.report({
									data: { container: "union", typeName: "never" },
									message: "overridden",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							for (const literalTypeFlag of literalTypeFlags) {
								if (typePart.flags === literalTypeFlag) {
									const primitiveFlag =
										literalToPrimitiveTypeFlags[literalTypeFlag];
									if (primitiveFlag) {
										const existing = seenLiteralTypes.get(primitiveFlag);
										if (existing) {
											existing.push({ literalValue: typeName, typeNode });
										} else {
											seenLiteralTypes.set(primitiveFlag, [
												{ literalValue: typeName, typeNode },
											]);
										}
									}
									break;
								}
							}

							for (const primitiveTypeFlag of primitiveTypeFlags) {
								if ((typePart.flags & primitiveTypeFlag) !== 0) {
									seenPrimitiveTypes.add(primitiveTypeFlag);
								}
							}
						}
					}

					const overriddenTypeNodes = new Map<
						AST.TypeNode,
						{ literalValue: string; primitiveTypeFlag: ts.TypeFlags }[]
					>();

					for (const [
						primitiveTypeFlag,
						typeNodesWithText,
					] of seenLiteralTypes) {
						if (seenPrimitiveTypes.has(primitiveTypeFlag)) {
							for (const { literalValue, typeNode } of typeNodesWithText) {
								const existing = overriddenTypeNodes.get(typeNode);
								if (existing) {
									existing.push({ literalValue, primitiveTypeFlag });
								} else {
									overriddenTypeNodes.set(typeNode, [
										{ literalValue, primitiveTypeFlag },
									]);
								}
							}
						}
					}

					for (const [typeNode, typeFlagsWithText] of overriddenTypeNodes) {
						const grouped = new Map<ts.TypeFlags, string[]>();
						for (const {
							literalValue,
							primitiveTypeFlag,
						} of typeFlagsWithText) {
							const existing = grouped.get(primitiveTypeFlag);
							if (existing) {
								existing.push(literalValue);
							} else {
								grouped.set(primitiveTypeFlag, [literalValue]);
							}
						}

						for (const [primitiveTypeFlag, literals] of grouped) {
							context.report({
								data: {
									literal: literals.join(" | "),
									primitive: primitiveTypeFlagNames[primitiveTypeFlag] ?? "",
								},
								message: "literalOverridden",
								range: getTSNodeRange(typeNode, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
