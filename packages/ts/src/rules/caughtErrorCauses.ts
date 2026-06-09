import ts from "typescript";

import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const errorConstructors = new Set([
	"AggregateError",
	"Error",
	"EvalError",
	"RangeError",
	"ReferenceError",
	"SyntaxError",
	"TypeError",
	"URIError",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports throwing new errors in catch blocks without preserving the original error as the cause.",
		id: "caughtErrorCauses",
		presets: ["logicalStrict"],
	},
	messages: {
		missingCause: {
			primary:
				"Preserve the original error by passing it as the `cause` option when throwing a new error.",
			secondary: [
				"When re-throwing errors, the original error contains valuable debugging information.",
				"Using the `cause` option maintains the complete error chain, improving traceability.",
				"Without preserving the cause, the original stack trace and error details are lost.",
			],
			suggestions: [
				"Add `{ cause: <caughtError> }` as the second argument to the error constructor.",
			],
		},
	},
	setup(context) {
		function getCatchParameter(node: ts.Node): ts.Identifier | undefined {
			const catchClause = ts.findAncestor(node, ts.isCatchClause);
			if (!catchClause) {
				return undefined;
			}

			const variable = catchClause.variableDeclaration;
			if (variable && ts.isIdentifier(variable.name)) {
				return variable.name;
			}

			return undefined;
		}

		function isCauseProperty(property: ts.ObjectLiteralElementLike) {
			if (ts.isPropertyAssignment(property)) {
				return (
					(ts.isIdentifier(property.name) ||
						ts.isStringLiteral(property.name)) &&
					property.name.text === "cause"
				);
			}

			return (
				ts.isShorthandPropertyAssignment(property) &&
				property.name.text === "cause"
			);
		}

		// A `cause` is provably missing only when the options argument slot is
		// absent or is an object literal without a `cause` property. Spreads and
		// non-literal options could carry a cause, so they don't report.
		function lacksErrorCause(node: ts.NewExpression, errorName: string) {
			// AggregateError takes its options object as the third argument.
			const optionsIndex = errorName === "AggregateError" ? 2 : 1;
			const args = node.arguments ?? [];

			if (args.slice(0, optionsIndex + 1).some(ts.isSpreadElement)) {
				return false;
			}

			const optionsArg = args[optionsIndex];
			if (optionsArg === undefined) {
				return true;
			}

			if (!ts.isObjectLiteralExpression(optionsArg)) {
				return false;
			}

			if (optionsArg.properties.some(ts.isSpreadAssignment)) {
				return false;
			}

			return !optionsArg.properties.some(isCauseProperty);
		}

		return {
			visitors: {
				ThrowStatement: (node, { sourceFile }) => {
					if (!ts.isNewExpression(node.expression)) {
						return;
					}

					const newExpr = node.expression;
					if (!ts.isIdentifier(newExpr.expression)) {
						return;
					}

					const errorName = newExpr.expression.text;
					if (!errorConstructors.has(errorName)) {
						return;
					}

					if (!getCatchParameter(node)) {
						return;
					}

					if (!lacksErrorCause(newExpr, errorName)) {
						return;
					}

					context.report({
						message: "missingCause",
						range: {
							begin: newExpr.getStart(sourceFile),
							end: newExpr.getEnd(),
						},
					});
				},
			},
		};
	},
});
