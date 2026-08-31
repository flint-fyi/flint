import { SyntaxKind, type Node } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const literalToPrimitiveTypeFlags: Record<number, TypeFlags> = {
	[TypeFlags.BigIntLiteral]: TypeFlags.BigInt,
	[TypeFlags.BooleanLiteral]: TypeFlags.Boolean,
	[TypeFlags.NumberLiteral]: TypeFlags.Number,
	[TypeFlags.StringLiteral]: TypeFlags.String,
	[TypeFlags.TemplateLiteral]: TypeFlags.String,
};

const literalTypeFlags = [
	TypeFlags.BigIntLiteral,
	TypeFlags.BooleanLiteral,
	TypeFlags.NumberLiteral,
	TypeFlags.StringLiteral,
	TypeFlags.TemplateLiteral,
];

const primitiveTypeFlags = [
	TypeFlags.BigInt,
	TypeFlags.Boolean,
	TypeFlags.Number,
	TypeFlags.String,
];

const primitiveTypeFlagNames: Record<number, string> = {
	[TypeFlags.BigInt]: "bigint",
	[TypeFlags.Boolean]: "boolean",
	[TypeFlags.Number]: "number",
	[TypeFlags.String]: "string",
};

function describeLiteralType(type: Type): string {
	if (type.isStringLiteralType()) {
		return JSON.stringify(type.value);
	}

	if (type.flags & TypeFlags.BigIntLiteral) {
		return `${type.value}n`;
	}

	if (type.isLiteralType()) {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		return String(type.value);
	}

	if (type.intrinsicName === "error" && type.aliasSymbol) {
		return type.getAliasSymbol()?.name ?? "error";
	}

	if (type.flags & TypeFlags.Any) {
		return "any";
	}

	if (type.flags & TypeFlags.Never) {
		return "never";
	}

	if (type.flags & TypeFlags.Unknown) {
		return "unknown";
	}

	if (type.flags & TypeFlags.TemplateLiteral) {
		return "template literal type";
	}

	if (type.intrinsicName === "true") {
		return "true";
	}

	if (type.intrinsicName === "false") {
		return "false";
	}

	return "literal type";
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isDescendantOf(node: AST.AnyNode, potentialAncestor: Node) {
	let current: Node | undefined = node;

	while (current) {
		if (current === potentialAncestor) {
			return true;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent as Node | undefined;
	}

	return false;
}

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isNodeInsideReturnType(node: AST.AnyNode) {
	let current = node.parent;

	while (current) {
		if (
			current.kind === SyntaxKind.FunctionDeclaration ||
			current.kind === SyntaxKind.FunctionExpression ||
			current.kind === SyntaxKind.ArrowFunction ||
			current.kind === SyntaxKind.MethodDeclaration ||
			current.kind === SyntaxKind.MethodSignature ||
			current.kind === SyntaxKind.FunctionType ||
			current.kind === SyntaxKind.CallSignature ||
			current.kind === SyntaxKind.ConstructSignature ||
			current.kind === SyntaxKind.ConstructorType
		) {
			return !!current.type && isDescendantOf(node, current.type);
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent;
	}

	return false;
}

function unionTypePartsUnlessBoolean(type: Type) {
	const types = type.isUnionType() ? type.getTypes() : undefined;
	if (
		types?.length === 2 &&
		types.every((typePart) => typePart.flags & TypeFlags.BooleanLiteral)
	) {
		return [type];
	}
	return types ?? [type];
}

function getTypeFlags(type: Type): TypeFlags {
	const types = type.isUnionType() ? type.getTypes() : undefined;
	return types?.length === 2 &&
		types.every((typePart) => typePart.flags & TypeFlags.BooleanLiteral)
		? TypeFlags.Boolean
		: type.flags;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports union and intersection type constituents that are redundant or override other types.",
		id: "redundantTypeConstituents",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		errorTypeOverrides: {
			primary:
				"{{ typeName }} is an 'error' type that acts as 'any' and overrides all other types in this {{ container }} type.",
			secondary: [
				"Error types that resolve to 'any' make the entire union or intersection effectively 'any'.",
				"This typically indicates a type reference that TypeScript couldn't resolve.",
			],
			suggestions: ["Remove the redundant type constituent."],
		},
		literalOverridden: {
			primary:
				"{{ literal }} is overridden by {{ primitive }} in this union type.",
			secondary: [
				"When a primitive type like 'string' is in a union with a string literal, the literal is redundant.",
				"The primitive type already includes all possible literal values.",
			],
			suggestions: ["Remove the literal type."],
		},
		overridden: {
			primary:
				"{{ typeName }} is overridden by other types in this {{ container }} type.",
			secondary: [
				"This type constituent has no effect because it is subsumed by other types in the {{ container }}.",
				"Consider removing it to simplify the type.",
			],
			suggestions: ["Remove the redundant type."],
		},
		overrides: {
			primary:
				"{{ typeName }} overrides all other types in this {{ container }} type.",
			secondary: [
				"This type makes all other constituents in the {{ container }} redundant.",
				"Consider simplifying to just this type.",
			],
			suggestions: ["Simplify to just this type."],
		},
		primitiveOverridden: {
			primary:
				"{{ primitive }} is overridden by {{ literal }} in this intersection type.",
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
				IntersectionType: (node, { checker, sourceFile }) => {
					const seenLiteralTypes = new Map<TypeFlags, string[]>();
					const seenPrimitiveTypes = new Map<TypeFlags, AST.TypeNode[]>();
					const seenUnionTypes = new Map<
						AST.TypeNode,
						{ typeFlags: TypeFlags; typeName: string }[]
					>();

					for (const typeNode of node.types) {
						const nodeType = checker.getTypeAtLocation(typeNode);
						const typeParts = unionTypePartsUnlessBoolean(nodeType);

						for (const typePart of typeParts) {
							const typeName = describeLiteralType(typePart);
							const typeFlags = getTypeFlags(typePart);

							if (typeFlags === TypeFlags.Any) {
								context.report({
									data: { container: "intersection", typeName },
									message:
										typeName !== "any" ? "errorTypeOverrides" : "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (typeFlags === TypeFlags.Never) {
								context.report({
									data: { container: "intersection", typeName },
									message: "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (typeFlags === TypeFlags.Unknown) {
								context.report({
									data: { container: "intersection", typeName },
									message: "overridden",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							for (const literalTypeFlag of literalTypeFlags) {
								if (typeFlags === literalTypeFlag) {
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
								if (typeFlags === primitiveTypeFlag) {
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
									typeFlags: getTypeFlags(typePart),
									typeName: describeLiteralType(typePart),
								})),
							);
						}
					}

					if (seenUnionTypes.size) {
						for (const [typeRef, typeValues] of seenUnionTypes) {
							let primitiveFlag: TypeFlags | undefined;
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
				UnionType: (node, { checker, sourceFile }) => {
					const seenLiteralTypes = new Map<
						TypeFlags,
						{ literalValue: string; typeNode: AST.TypeNode }[]
					>();
					const seenPrimitiveTypes = new Set<TypeFlags>();

					for (const typeNode of node.types) {
						const nodeType = checker.getTypeAtLocation(typeNode);
						const typeParts = unionTypePartsUnlessBoolean(nodeType);

						for (const typePart of typeParts) {
							const typeName = describeLiteralType(typePart);
							const typeFlags = getTypeFlags(typePart);

							if (
								typeFlags === TypeFlags.Any ||
								typeFlags === TypeFlags.Unknown
							) {
								context.report({
									data: { container: "union", typeName },
									message:
										typeFlags === TypeFlags.Any && typeName !== "any"
											? "errorTypeOverrides"
											: "overrides",
									range: getTSNodeRange(typeNode, sourceFile),
								});
								continue;
							}

							if (
								typeFlags === TypeFlags.Never &&
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
								if (typeFlags === literalTypeFlag) {
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
								if ((typeFlags & primitiveTypeFlag) !== 0) {
									seenPrimitiveTypes.add(primitiveTypeFlag);
								}
							}
						}
					}

					const overriddenTypeNodes = new Map<
						AST.TypeNode,
						{ literalValue: string; primitiveTypeFlag: TypeFlags }[]
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
						const grouped = new Map<TypeFlags, string[]>();
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
