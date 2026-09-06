import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	CapturingGroup,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	isBinaryExpression,
	isIdentifier,
	isParameterDeclaration,
	isVariableDeclaration,
	SyntaxKind,
	type BinaryExpression,
	type Node,
} from "typescript-native/unstable/ast";
import {
	SymbolFlags,
	TypeFlags,
	type Program,
	type Symbol,
	type Type,
} from "typescript-native/unstable/sync";

import {
	forEachChild,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { skipParentheses } from "./utils/skipParentheses.ts";

interface NamedCapturingGroup {
	index: number;
	name: string;
}

function extractCallExpression(expression: AST.Expression) {
	const unwrapped = skipParentheses(expression);

	if (unwrapped.kind === SyntaxKind.CallExpression) {
		return unwrapped;
	}

	if (
		unwrapped.kind === SyntaxKind.NonNullExpression ||
		unwrapped.kind === SyntaxKind.AsExpression ||
		unwrapped.kind === SyntaxKind.TypeAssertionExpression
	) {
		return extractCallExpression(unwrapped.expression);
	}

	return undefined;
}

function findAssignmentsToSymbol(
	symbol: Symbol,
	sourceFile: AST.SourceFile,
	typeChecker: Checker,
) {
	const assignments: BinaryExpression[] = [];

	function visit(node: Node) {
		if (
			isBinaryExpression(node) &&
			node.operatorToken.kind === SyntaxKind.EqualsToken &&
			isIdentifier(node.left)
		) {
			const leftSymbol = typeChecker.getSymbolAtLocation(node.left);
			if (leftSymbol === symbol) {
				assignments.push(node);
			}
		}
		forEachChild(node as AST.AnyNode, visit);
	}

	visit(sourceFile);

	return assignments;
}

function getNamedCapturingGroups(pattern: string, flags: string) {
	const groups: NamedCapturingGroup[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return groups;
	}

	let index = 0;

	visitRegExpAST(ast, {
		onCapturingGroupEnter(node: CapturingGroup) {
			index++;
			if (node.name) {
				groups.push({ index, name: node.name });
			}
		},
	});

	return groups;
}

function getNamedGroupsFromExpression(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	const unwrapped = skipParentheses(node);

	if (unwrapped.kind === SyntaxKind.Identifier) {
		const symbol = typeChecker.getSymbolAtLocation(unwrapped);
		if (symbol) {
			const resolvedSymbol =
				symbol.flags & SymbolFlags.Alias
					? typeChecker.getAliasedSymbol(symbol)
					: symbol;
			return getRegexInfoFromSymbol(
				resolvedSymbol,
				typeChecker,
				program,
				sourceFile,
			);
		}
	}

	if (unwrapped.kind === SyntaxKind.CallExpression) {
		const regexInfo = getRegexFromCall(
			unwrapped,
			typeChecker,
			program,
			sourceFile,
		);
		if (regexInfo) {
			const namedGroups = getNamedCapturingGroups(
				regexInfo.pattern,
				regexInfo.flags,
			);
			if (namedGroups.length) {
				return namedGroups;
			}
		}
	}

	if (
		unwrapped.kind === SyntaxKind.NonNullExpression ||
		unwrapped.kind === SyntaxKind.AsExpression ||
		unwrapped.kind === SyntaxKind.TypeAssertionExpression
	) {
		return getNamedGroupsFromExpression(
			unwrapped.expression,
			typeChecker,
			program,
			sourceFile,
		);
	}

	return undefined;
}

function getRegexFromCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	return (
		getRegexFromExecCall(node, typeChecker, program, sourceFile) ??
		getRegexFromMatchCall(node, typeChecker, program, sourceFile) ??
		getRegexFromMatchAllCall(node, typeChecker, program, sourceFile)
	);
}

function getRegexFromExecCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return undefined;
	}

	if (node.expression.name.text !== "exec" || node.arguments.length !== 1) {
		return undefined;
	}

	const regexObject = node.expression.expression;
	return getRegexInfoFromExpression(
		regexObject,
		typeChecker,
		program,
		sourceFile,
	);
}

function getRegexFromMatchAllCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return undefined;
	}

	if (node.expression.name.text !== "matchAll" || node.arguments.length !== 1) {
		return undefined;
	}

	const objectType = typeChecker.getTypeAtLocation(node.expression.expression);
	if (!(objectType.flags & TypeFlags.StringLike)) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const regexArg = node.arguments[0]!;

	return getRegexInfoFromExpression(regexArg, typeChecker, program, sourceFile);
}

function getRegexFromMatchCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.text !== "match" ||
		node.arguments.length !== 1
	) {
		return undefined;
	}

	const objectType = typeChecker.getTypeAtLocation(node.expression.expression);
	if (!(objectType.flags & TypeFlags.StringLike)) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const regexArg = node.arguments[0]!;

	const info = getRegexInfoFromExpression(
		regexArg,
		typeChecker,
		program,
		sourceFile,
	);
	if (info?.flags.includes("g")) {
		return undefined;
	}

	return info;
}

function getRegexInfoFromExpression(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	const unwrapped = skipParentheses(node);

	if (unwrapped.kind === SyntaxKind.RegularExpressionLiteral) {
		return getRegExpLiteralDetails(unwrapped, { sourceFile });
	}

	if (
		unwrapped.kind === SyntaxKind.CallExpression ||
		unwrapped.kind === SyntaxKind.NewExpression
	) {
		const construction = getRegExpConstruction(unwrapped, {
			typeChecker,
			program,
			sourceFile,
		} as TypeScriptFileServices);
		if (construction) {
			return {
				flags: construction.flags,
				pattern: construction.pattern.replace(/\\\\/g, "\\"),
			};
		}
	}

	if (unwrapped.kind === SyntaxKind.Identifier) {
		const symbol = typeChecker.getSymbolAtLocation(unwrapped);
		if (symbol) {
			if (symbol.declarations.length) {
				for (const declarationHandle of symbol.declarations) {
					const declaration = declarationHandle.resolve();
					if (!declaration) {
						continue;
					}
					if (isVariableDeclaration(declaration) && declaration.initializer) {
						return getRegexInfoFromExpression(
							declaration.initializer as AST.Expression,
							typeChecker,
							program,
							sourceFile,
						);
					}
				}
			}
		}
	}

	return undefined;
}

function getRegexInfoFromSymbol(
	symbol: Symbol,
	typeChecker: Checker,
	program: Program,
	sourceFile: AST.SourceFile,
) {
	if (symbol.declarations.length) {
		for (const declarationHandle of symbol.declarations) {
			const declaration = declarationHandle.resolve();
			if (!declaration) {
				continue;
			}
			if (isVariableDeclaration(declaration) && declaration.initializer) {
				const callExpression = extractCallExpression(
					declaration.initializer as AST.Expression,
				);
				if (callExpression) {
					const regexInfo = getRegexFromCall(
						callExpression,
						typeChecker,
						program,
						sourceFile,
					);
					if (regexInfo) {
						const namedGroups = getNamedCapturingGroups(
							regexInfo.pattern,
							regexInfo.flags,
						);
						if (namedGroups.length) {
							return namedGroups;
						}
					}
				}
			}

			if (isParameterDeclaration(declaration)) {
				continue;
			}
		}
	}

	const assignments = findAssignmentsToSymbol(symbol, sourceFile, typeChecker);
	for (const assignment of assignments) {
		const callExpression = extractCallExpression(
			assignment.right as AST.Expression,
		);
		if (callExpression) {
			const regexInfo = getRegexFromCall(
				callExpression,
				typeChecker,
				program,
				sourceFile,
			);
			if (regexInfo) {
				const namedGroups = getNamedCapturingGroups(
					regexInfo.pattern,
					regexInfo.flags,
				);
				if (namedGroups.length) {
					return namedGroups;
				}
			}
		}
	}

	return undefined;
}

function isAnyType(type: Type): boolean {
	return (type.flags & TypeFlags.Any) !== 0;
}

function isRegExpExecArrayOrRegExpMatchArray(type: Type): boolean {
	const symbol = type.getSymbol();
	if (symbol) {
		const name = symbol.name;
		if (name === "RegExpExecArray" || name === "RegExpMatchArray") {
			return true;
		}
	}

	if (type.isUnionType() || type.isIntersectionType()) {
		return type
			.getTypes()
			.every(
				(constituent) =>
					isRegExpExecArrayOrRegExpMatchArray(constituent) ||
					(constituent.flags & TypeFlags.Null) !== 0 ||
					(constituent.flags & TypeFlags.Undefined) !== 0,
			);
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports indexed access on regex result arrays when named capturing groups should be used.",
		id: "regexResultArrayGroups",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferGroups: {
			primary:
				"Use `.groups.{{ name }}` instead of numeric index for the named capturing group '{{ name }}'.",
			secondary: [
				"When a regex has named capturing groups, accessing them by name is more readable and maintainable.",
				"Numeric indices are fragile and can break if the regex pattern is modified.",
			],
			suggestions: [
				"Replace the indexed access with `.groups.{{ name }}`.",
				"Use the named capturing group syntax for better code clarity.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (
					node,
					{ typeChecker, program, sourceFile },
				) => {
					const argument = skipParentheses(node.argumentExpression);
					if (argument.kind !== SyntaxKind.NumericLiteral) {
						return;
					}

					const index = Number(argument.text);
					if (index <= 0 || !Number.isInteger(index)) {
						return;
					}

					const object = skipParentheses(node.expression);
					const objectType = typeChecker.getTypeAtLocation(object);

					if (isAnyType(objectType)) {
						return;
					}

					if (!isRegExpExecArrayOrRegExpMatchArray(objectType)) {
						return;
					}

					const namedGroups = getNamedGroupsFromExpression(
						object,
						typeChecker,
						program,
						sourceFile,
					);
					if (!namedGroups) {
						return;
					}

					const namedGroup = namedGroups.find((group) => group.index === index);
					if (!namedGroup) {
						return;
					}

					context.report({
						data: {
							name: namedGroup.name,
						},
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${object.getText(sourceFile)}${node.questionDotToken ? "?" : ""}.groups.${namedGroup.name}`,
						},
						message: "preferGroups",
						range: {
							begin: node.argumentExpression.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
