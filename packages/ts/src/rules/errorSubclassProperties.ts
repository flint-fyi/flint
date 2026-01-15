import { SyntaxKind } from "typescript";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function analyzeConstructor(node: AST.ClassDeclaration) {
	let constructor: AST.ConstructorDeclaration | undefined;

	for (const member of node.members) {
		if (ts.isConstructorDeclaration(member) && member.body) {
			constructor = member;
			break;
		}
	}

	if (!constructor) {
		return undefined;
	}

	let hasSuperCall = false;
	let superCallPassesMessage = false;
	let hasNameAssignment = false;
	let nameValue: string | undefined;
	let hasRedundantMessageAssignment = false;
	let superCallNode: ts.CallExpression | undefined;
	let nameAssignmentNode: ts.BinaryExpression | undefined;
	let messageAssignmentNode: ts.BinaryExpression | undefined;

	const body = constructor.body;
	if (!body) {
		return undefined;
	}

	for (const statement of body.statements) {
		if (ts.isExpressionStatement(statement)) {
			const expr = statement.expression;

			if (
				ts.isCallExpression(expr) &&
				expr.expression.kind === SyntaxKind.SuperKeyword
			) {
				hasSuperCall = true;
				superCallNode = expr;
				superCallPassesMessage = expr.arguments.length > 0;
			}

			if (
				ts.isBinaryExpression(expr) &&
				expr.operatorToken.kind === SyntaxKind.EqualsToken
			) {
				const left = expr.left;
				if (
					ts.isPropertyAccessExpression(left) &&
					left.expression.kind === SyntaxKind.ThisKeyword
				) {
					const propName = left.name.text;

					if (propName === "name") {
						hasNameAssignment = true;
						nameAssignmentNode = expr;
						if (ts.isStringLiteral(expr.right)) {
							nameValue = expr.right.text;
						} else if (
							ts.isPropertyAccessExpression(expr.right) &&
							ts.isPropertyAccessExpression(expr.right.expression) &&
							expr.right.expression.expression.kind ===
								SyntaxKind.ThisKeyword &&
							expr.right.expression.name.text === "constructor" &&
							expr.right.name.text === "name"
						) {
							nameValue = "this.constructor.name";
						}
					}

					if (
						propName === "message" &&
						hasSuperCall &&
						superCallPassesMessage
					) {
						hasRedundantMessageAssignment = true;
						messageAssignmentNode = expr;
					}
				}
			}
		}
	}

	return {
		constructor,
		hasNameAssignment,
		hasRedundantMessageAssignment,
		hasSuperCall,
		messageAssignmentNode,
		nameAssignmentNode,
		nameValue,
		superCallNode,
		superCallPassesMessage,
	};
}

function getClassName(node: AST.ClassDeclaration): string | undefined {
	return node.name?.text;
}

function isErrorSubclass(node: AST.ClassDeclaration): boolean {
	if (!node.heritageClauses) {
		return false;
	}

	for (const clause of node.heritageClauses) {
		if (clause.token !== SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const type of clause.types) {
			const typeName = type.expression;
			if (ts.isIdentifier(typeName) && typeName.text.endsWith("Error")) {
				return true;
			}
		}
	}

	return false;
}

function isValidErrorClassName(
	name: string | undefined,
): name is `${string}Error` {
	return !!name && /^[A-Z]/.test(name) && name.endsWith("Error");
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports incorrect Error subclass definitions that don't follow best practices.",
		id: "errorSubclassProperties",
		presets: ["logicalStrict"],
	},
	messages: {
		invalidClassName: {
			primary:
				"Error subclass name '{{ name }}' should start with an uppercase letter and end with 'Error'.",
			secondary: [
				"Error class names should follow the convention of being capitalized and ending with 'Error'.",
				"This makes it clear that the class is an error type.",
			],
			suggestions: [
				"Rename the class to end with 'Error', e.g., '{{ suggested }}'.",
			],
		},
		missingName: {
			primary:
				"Error subclass is missing a `this.name` assignment in the constructor.",
			secondary: [
				"Without a `name` property, errors will display as `[Error: ...]` instead of `[ClassName: ...]`.",
				"Setting `this.name` helps identify the error type when debugging.",
			],
			suggestions: ["Add `this.name = 'ClassName';` to the constructor."],
		},
		redundantMessage: {
			primary:
				"Assignment to `this.message` is redundant when the message is already passed to `super()`.",
			secondary: [
				"The `super()` call automatically sets the `message` property.",
				"Assigning it again is unnecessary.",
			],
			suggestions: ["Remove the redundant `this.message` assignment."],
		},
		useConstructorName: {
			primary: "Avoid using `this.constructor.name` for the error name.",
			secondary: [
				"Using `this.constructor.name` will not work correctly after minification.",
				"Use a string literal instead to ensure the error name is preserved.",
			],
			suggestions: [
				"Use a string literal like `this.name = '{{ className }}';`.",
			],
		},
		wrongName: {
			primary:
				"Error subclass name property '{{ nameValue }}' should match the class name '{{ className }}'.",
			secondary: [
				"The `name` property should match the class name for consistency.",
				"Mismatched names can cause confusion when debugging.",
			],
			suggestions: [
				"Change the name assignment to `this.name = '{{ className }}';`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile }) => {
					if (!isErrorSubclass(node)) {
						return;
					}

					const className = getClassName(node);

					if (!isValidErrorClassName(className)) {
						const baseName = className ?? "Custom";
						const suggested = baseName.endsWith("Error")
							? baseName
							: `${baseName}Error`;
						context.report({
							data: {
								name: className ?? "(anonymous)",
								suggested,
							},
							message: "invalidClassName",
							range: getTSNodeRange(node.name ?? node, sourceFile),
						});
						return;
					}

					const constructorInfo = analyzeConstructor(node);

					if (!constructorInfo) {
						return;
					}

					if (
						constructorInfo.hasRedundantMessageAssignment &&
						constructorInfo.messageAssignmentNode
					) {
						context.report({
							message: "redundantMessage",
							range: getTSNodeRange(
								constructorInfo.messageAssignmentNode,
								sourceFile,
							),
						});
					}

					if (!constructorInfo.hasNameAssignment) {
						context.report({
							message: "missingName",
							range: getTSNodeRange(constructorInfo.constructor, sourceFile),
						});
						return;
					}

					if (
						constructorInfo.nameValue === "this.constructor.name" &&
						constructorInfo.nameAssignmentNode
					) {
						context.report({
							data: { className },
							message: "useConstructorName",
							range: getTSNodeRange(
								constructorInfo.nameAssignmentNode,
								sourceFile,
							),
						});
						return;
					}

					if (
						constructorInfo.nameValue &&
						constructorInfo.nameValue !== className &&
						constructorInfo.nameAssignmentNode
					) {
						context.report({
							data: {
								className,
								nameValue: constructorInfo.nameValue,
							},
							message: "wrongName",
							range: getTSNodeRange(
								constructorInfo.nameAssignmentNode,
								sourceFile,
							),
						});
					}
				},
			},
		};
	},
});
