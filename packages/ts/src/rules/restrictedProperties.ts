import ts, { NodeFlags, SyntaxKind } from "typescript";
import { z } from "zod/v4";

import {
	getStaticValue,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { matchesSpecifier } from "../type-utils/matchesSpecifier.ts";
import { typeOrValueSpecifierSchema } from "../type-utils/schemas.ts";
import { ruleCreator } from "./ruleCreator.ts";

const restrictionSchema = z.object({
	message: z
		.string()
		.optional()
		.describe("A custom message to display when the restriction is triggered."),
	object: typeOrValueSpecifierSchema.describe(
		"A TypeOrValueSpecifier identifying the restricted receiver.",
	),
	property: z.string().describe("The property name to restrict."),
});

type Receiver =
	| { expression: ts.Expression; type?: never }
	| { expression?: never; type: ts.Type };

type Restriction = z.infer<typeof restrictionSchema>;

function getDeclarations(symbol: ts.Symbol, checker: Checker) {
	const resolved =
		symbol.flags & ts.SymbolFlags.Alias
			? checker.getAliasedSymbol(symbol)
			: symbol;
	return {
		declarations: nullThrows(
			resolved.getDeclarations(),
			"Resolved symbols must have declarations.",
		),
		name: resolved.getName(),
	};
}

function getPropertyName(
	node: AST.Expression | AST.PrivateIdentifier,
	checker: Checker,
	allowIdentifier: boolean,
) {
	if (
		ts.isPrivateIdentifier(node) ||
		(allowIdentifier && ts.isIdentifier(node))
	) {
		return node.text;
	}

	const staticValue = getStaticValue(node)?.value;
	if (
		typeof staticValue === "string" ||
		typeof staticValue === "number" ||
		typeof staticValue === "bigint"
	) {
		return String(staticValue);
	}

	const type = checker.getTypeAtLocation(node);
	if (type.isStringLiteral() || type.isNumberLiteral()) {
		return String(type.value);
	}

	return undefined;
}

function symbolMatches(
	symbol: ts.Symbol | undefined,
	restriction: Restriction,
	checker: Checker,
	program: ts.Program,
) {
	if (!symbol) {
		return false;
	}

	const { declarations, name } = getDeclarations(symbol, checker);
	return matchesSpecifier(name, declarations, restriction.object, program);
}

function typeMatches(
	type: ts.Type,
	restriction: Restriction,
	checker: Checker,
	program: ts.Program,
): boolean {
	if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
		return false;
	}

	if (type.isUnion()) {
		const viable = type.types.filter(
			(constituent) =>
				!(constituent.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)),
		);
		return viable.every((constituent) =>
			typeMatches(constituent, restriction, checker, program),
		);
	}

	if (type.isIntersection()) {
		return type.types.some((constituent) =>
			typeMatches(constituent, restriction, checker, program),
		);
	}

	if (
		symbolMatches(type.aliasSymbol, restriction, checker, program) ||
		symbolMatches(type.getSymbol(), restriction, checker, program)
	) {
		return true;
	}

	const constraint = checker.getBaseConstraintOfType(type);
	if (constraint && typeMatches(constraint, restriction, checker, program)) {
		return true;
	}

	return (
		type.isClassOrInterface() &&
		nullThrows(
			type.getBaseTypes(),
			"Class and interface types must provide base types.",
		).some((base) => typeMatches(base, restriction, checker, program))
	);
}

function valueMatches(
	expression: ts.Expression,
	restriction: Restriction,
	checker: Checker,
	program: ts.Program,
	seen = new Set<ts.Symbol>(),
): boolean {
	const symbol = checker.getSymbolAtLocation(expression);
	if (symbolMatches(symbol, restriction, checker, program)) {
		return true;
	}

	if (symbol && !seen.has(symbol)) {
		seen.add(symbol);
		const declaration = symbol.valueDeclaration;
		if (
			declaration &&
			ts.isVariableDeclaration(declaration) &&
			declaration.initializer &&
			(declaration.parent.flags & NodeFlags.Const) !== 0 &&
			valueMatches(declaration.initializer, restriction, checker, program, seen)
		) {
			return true;
		}
	}

	return typeMatches(
		checker.getTypeAtLocation(expression),
		restriction,
		checker,
		program,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallows accessing specified properties on configured types or values.",
		id: "restrictedProperties",
	},
	messages: {
		restricted: {
			primary:
				"Accessing the '{{ property }}' property on this type or value is restricted.",
			secondary: [
				"This property has been restricted by project configuration.",
			],
			suggestions: ["Use an allowed property or value instead."],
		},
		restrictedWithMessage: {
			primary:
				"Accessing the '{{ property }}' property on this type or value is restricted. {{ customMessage }}",
			secondary: [
				"This property has been restricted by project configuration.",
			],
			suggestions: ["Use an allowed property or value instead."],
		},
	},
	options: {
		restrictions: z
			.array(restrictionSchema)
			.default([])
			.describe("Restrictions on properties of specified types or values."),
	},
	setup(context) {
		function check(
			key: AST.Expression | AST.PrivateIdentifier,
			receiver: Receiver,
			services: TypeScriptFileServices & {
				options: { restrictions: Restriction[] };
			},
			allowIdentifier = true,
		) {
			const property = getPropertyName(
				key,
				services.typeChecker,
				allowIdentifier,
			);
			if (property === undefined) {
				return;
			}

			for (const restriction of services.options.restrictions) {
				if (restriction.property !== property) {
					continue;
				}

				const matches = receiver.expression
					? valueMatches(
							receiver.expression,
							restriction,
							services.typeChecker,
							services.program,
						)
					: typeMatches(
							receiver.type,
							restriction,
							services.typeChecker,
							services.program,
						);
				if (!matches) {
					continue;
				}

				context.report({
					data: { customMessage: restriction.message ?? "", property },
					message: restriction.message ? "restrictedWithMessage" : "restricted",
					range: {
						begin: key.getStart(services.sourceFile),
						end: key.getEnd(),
					},
				});
				return;
			}
		}

		function checkBindingPattern(
			pattern: AST.ObjectBindingPattern,
			services: Parameters<typeof check>[2],
		) {
			const receiver = {
				type: services.typeChecker.getTypeAtLocation(pattern),
			};
			for (const element of pattern.elements) {
				if (element.dotDotDotToken) {
					continue;
				}
				const key = element.propertyName ?? (element.name as AST.Identifier);
				if (ts.isComputedPropertyName(key)) {
					check(key.expression, receiver, services, false);
				} else {
					check(key, receiver, services);
				}
			}
		}

		function checkAssignmentPattern(
			pattern: AST.ObjectLiteralExpression,
			receiver: Receiver,
			services: Parameters<typeof check>[2],
		) {
			for (const property of pattern.properties) {
				if (ts.isShorthandPropertyAssignment(property)) {
					check(property.name, receiver, services);
					continue;
				}

				if (!ts.isPropertyAssignment(property)) {
					continue;
				}

				const isComputed = ts.isComputedPropertyName(property.name);
				const key = isComputed ? property.name.expression : property.name;
				check(key, receiver, services, !isComputed);

				const nestedPattern = ts.isObjectLiteralExpression(property.initializer)
					? property.initializer
					: undefined;
				if (!nestedPattern) {
					continue;
				}

				const propertyName = getPropertyName(
					key,
					services.typeChecker,
					!isComputed,
				);
				if (propertyName === undefined) {
					continue;
				}

				const receiverType = receiver.expression
					? services.typeChecker.getTypeAtLocation(receiver.expression)
					: receiver.type;
				const propertyType = services.typeChecker.getTypeOfPropertyOfType(
					receiverType,
					propertyName,
				);
				if (propertyType) {
					checkAssignmentPattern(
						nestedPattern,
						{ type: propertyType },
						services,
					);
				}
			}
		}

		return {
			visitors: {
				BinaryExpression: (node, services) => {
					if (
						node.operatorToken.kind !== SyntaxKind.EqualsToken ||
						!ts.isObjectLiteralExpression(node.left)
					) {
						return;
					}
					checkAssignmentPattern(
						node.left,
						{ expression: node.right },
						services,
					);
				},
				ElementAccessExpression: (node, services) => {
					check(
						node.argumentExpression,
						{ expression: node.expression },
						services,
						false,
					);
				},
				ObjectBindingPattern: checkBindingPattern,
				PropertyAccessExpression: (node, services) => {
					check(node.name, { expression: node.expression }, services);
				},
			},
		};
	},
});
