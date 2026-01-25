import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	CapturingGroup,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type Checker,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

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

	if (ts.isCallExpression(unwrapped)) {
		return unwrapped;
	}

	if (
		ts.isNonNullExpression(unwrapped) ||
		ts.isAsExpression(unwrapped) ||
		ts.isTypeAssertionExpression(unwrapped)
	) {
		return extractCallExpression(unwrapped.expression);
	}

	return undefined;
}

function findAssignmentsToSymbol(
	symbol: ts.Symbol,
	sourceFile: AST.SourceFile,
	typeChecker: Checker,
) {
	const assignments: ts.BinaryExpression[] = [];

	function visit(node: ts.Node) {
		if (
			ts.isBinaryExpression(node) &&
			node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			ts.isIdentifier(node.left)
		) {
			const leftSymbol = typeChecker.getSymbolAtLocation(node.left);
			if (leftSymbol === symbol) {
				assignments.push(node);
			}
		}
		ts.forEachChild(node, visit);
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
	sourceFile: AST.SourceFile,
) {
	const unwrapped = skipParentheses(node);

	if (ts.isIdentifier(unwrapped)) {
		const symbol = typeChecker.getSymbolAtLocation(unwrapped);
		if (symbol) {
			const resolvedSymbol =
				symbol.flags & ts.SymbolFlags.Alias
					? typeChecker.getAliasedSymbol(symbol)
					: symbol;
			return getRegexInfoFromSymbol(resolvedSymbol, typeChecker, sourceFile);
		}
	}

	if (ts.isCallExpression(unwrapped)) {
		const regexInfo = getRegexFromCall(unwrapped, typeChecker, sourceFile);
		if (regexInfo) {
			const namedGroups = getNamedCapturingGroups(
				regexInfo.pattern,
				regexInfo.flags,
			);
			if (namedGroups.length > 0) {
				return namedGroups;
			}
		}
	}

	if (
		ts.isNonNullExpression(unwrapped) ||
		ts.isAsExpression(unwrapped) ||
		ts.isTypeAssertionExpression(unwrapped)
	) {
		return getNamedGroupsFromExpression(
			unwrapped.expression as AST.Expression,
			typeChecker,
			sourceFile,
		);
	}

	return undefined;
}

function getRegexFromCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	return (
		getRegexFromExecCall(node, typeChecker, sourceFile) ??
		getRegexFromMatchCall(node, typeChecker, sourceFile) ??
		getRegexFromMatchAllCall(node, typeChecker, sourceFile)
	);
}

function getRegexFromExecCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}

	if (node.expression.name.text !== "exec" || node.arguments.length !== 1) {
		return undefined;
	}

	const regexObject = node.expression.expression;
	return getRegexInfoFromExpression(
		regexObject as AST.Expression,
		typeChecker,
		sourceFile,
	);
}

function getRegexFromMatchAllCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}

	if (node.expression.name.text !== "matchAll" || node.arguments.length !== 1) {
		return undefined;
	}

	const objectType = typeChecker.getTypeAtLocation(node.expression.expression);
	if (!(objectType.flags & ts.TypeFlags.StringLike)) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const regexArg = node.arguments[0]!;

	return getRegexInfoFromExpression(regexArg, typeChecker, sourceFile);
}

function getRegexFromMatchCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "match" ||
		node.arguments.length !== 1
	) {
		return undefined;
	}

	const objectType = typeChecker.getTypeAtLocation(node.expression.expression);
	if (!(objectType.flags & ts.TypeFlags.StringLike)) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const regexArg = node.arguments[0]!;

	const info = getRegexInfoFromExpression(regexArg, typeChecker, sourceFile);
	if (info?.flags.includes("g")) {
		return undefined;
	}

	return info;
}

function getRegexInfoFromExpression(
	node: AST.Expression,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	const unwrapped = skipParentheses(node);

	if (ts.isRegularExpressionLiteral(unwrapped)) {
		return getRegExpLiteralDetails(unwrapped, { sourceFile });
	}

	if (ts.isCallExpression(unwrapped) || ts.isNewExpression(unwrapped)) {
		const construction = getRegExpConstruction(unwrapped, {
			sourceFile,
			typeChecker,
		} as TypeScriptFileServices);
		if (construction) {
			return {
				flags: construction.flags,
				pattern: construction.pattern.replace(/\\\\/g, "\\"),
			};
		}
	}

	if (ts.isIdentifier(unwrapped)) {
		const symbol = typeChecker.getSymbolAtLocation(unwrapped);
		if (symbol) {
			const declarations = symbol.getDeclarations();
			if (declarations) {
				for (const declaration of declarations) {
					if (
						ts.isVariableDeclaration(declaration) &&
						declaration.initializer
					) {
						return getRegexInfoFromExpression(
							declaration.initializer as AST.Expression,
							typeChecker,
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
	symbol: ts.Symbol,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
) {
	const declarations = symbol.getDeclarations();

	if (declarations) {
		for (const declaration of declarations) {
			if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
				const callExpression = extractCallExpression(
					declaration.initializer as AST.Expression,
				);
				if (callExpression) {
					const regexInfo = getRegexFromCall(
						callExpression,
						typeChecker,
						sourceFile,
					);
					if (regexInfo) {
						const namedGroups = getNamedCapturingGroups(
							regexInfo.pattern,
							regexInfo.flags,
						);
						if (namedGroups.length > 0) {
							return namedGroups;
						}
					}
				}
			}

			if (ts.isParameter(declaration)) {
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
				sourceFile,
			);
			if (regexInfo) {
				const namedGroups = getNamedCapturingGroups(
					regexInfo.pattern,
					regexInfo.flags,
				);
				if (namedGroups.length > 0) {
					return namedGroups;
				}
			}
		}
	}

	return undefined;
}

function isAnyType(type: ts.Type): boolean {
	return (type.flags & ts.TypeFlags.Any) !== 0;
}

function isRegExpExecArrayOrRegExpMatchArray(
	type: ts.Type,
	typeChecker: Checker,
): boolean {
	const symbol = type.getSymbol();
	if (symbol) {
		const name = symbol.getName();
		if (name === "RegExpExecArray" || name === "RegExpMatchArray") {
			return true;
		}
	}

	if (type.isUnionOrIntersection()) {
		return type.types.every(
			(constituent) =>
				isRegExpExecArrayOrRegExpMatchArray(constituent, typeChecker) ||
				(constituent.flags & ts.TypeFlags.Null) !== 0 ||
				(constituent.flags & ts.TypeFlags.Undefined) !== 0,
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
				"Use `.groups.{{name}}` instead of numeric index for the named capturing group '{{name}}'.",
			secondary: [
				"When a regex has named capturing groups, accessing them by name is more readable and maintainable.",
				"Numeric indices are fragile and can break if the regex pattern is modified.",
			],
			suggestions: [
				"Replace the indexed access with `.groups.{{name}}`.",
				"Use the named capturing group syntax for better code clarity.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile, typeChecker }) => {
					const argument = skipParentheses(node.argumentExpression);
					if (!ts.isNumericLiteral(argument)) {
						return;
					}

					const index = Number(argument.text);
					if (index === 0 || !Number.isInteger(index) || index < 0) {
						return;
					}

					const object = skipParentheses(node.expression as AST.Expression);
					const objectType = typeChecker.getTypeAtLocation(object);

					if (isAnyType(objectType)) {
						return;
					}

					if (!isRegExpExecArrayOrRegExpMatchArray(objectType, typeChecker)) {
						return;
					}

					const namedGroups = getNamedGroupsFromExpression(
						object,
						typeChecker,
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
