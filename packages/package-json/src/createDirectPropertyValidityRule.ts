import type { AnyRule } from "@flint.fyi/core";
import {
	getJsonNodeRange,
	jsonLanguage,
	type JsonNode,
} from "@flint.fyi/json-language";
import type { Result } from "package-json-validator";
import ts from "typescript";

import { getPackagePropertiesOfNames } from "./getPackagePropertiesOfNames.ts";
import { ruleCreator } from "./ruleCreator.ts";

export type PropertyValidator = (value: unknown) => Result;

export function createDirectPropertyValidityRule<PropertyName extends string>(
	propertyName: PropertyName,
	propertyNameAliases: readonly string[],
	propertyValidator: PropertyValidator,
) {
	const id = `${propertyName}Validity` as const;
	const propertyNames = new Set([propertyName, ...propertyNameAliases]);

	const rule: AnyRule = ruleCreator.createRule(jsonLanguage, {
		about: {
			description: `Enforces that the \`${propertyName}\`${propertyNameAliases.length ? ` (also: ${propertyNameAliases.map((alias) => `\`${alias}\``).join(", ")})` : ""} property is valid.`,
			id,
			presets: ["logical"],
		},
		messages: {
			validationError: {
				primary: `Invalid ${propertyName}: {{ error }}.`,
				secondary: [
					`Although this value is valid JSON, the package.json \`${propertyName}\` property is restricted in what it may contain.`,
				],
				suggestions: ["Correct the value to the expected type."],
			},
		},
		setup(context) {
			function checkValue(node: JsonNode, sourceFile: ts.JsonSourceFile) {
				const value: unknown = JSON.parse(node.getText(sourceFile));
				const result = propertyValidator(value);

				reportIssues(result, node, sourceFile);
			}

			function reportIssues(
				result: Result,
				node: JsonNode,
				sourceFile: ts.JsonSourceFile,
			) {
				if (!result.errorMessages.length) {
					return;
				}

				if (result.issues.length) {
					for (const issue of result.issues) {
						context.report({
							data: {
								error: issue.message,
							},
							message: "validationError",
							range: getJsonNodeRange(node, sourceFile),
						});
					}
				}

				const childrenWithIssues = result.childResults.filter(
					(childResult) => childResult.errorMessages.length,
				);
				// If the value is an object, and has child results with issues, then report those too
				if (
					node.kind === ts.SyntaxKind.ObjectLiteralExpression &&
					childrenWithIssues.length
				) {
					for (const childResult of childrenWithIssues) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const childNode = node.properties[childResult.index]!;
						reportIssues(
							childResult,
							(childNode.kind === ts.SyntaxKind.PropertyAssignment
								? childNode.initializer
								: childNode) as JsonNode,
							sourceFile,
						);
					}
				}
				// If the value is an array, and has child results with issues, then report those too
				else if (
					node.kind === ts.SyntaxKind.ArrayLiteralExpression &&
					childrenWithIssues.length
				) {
					for (const childResult of childrenWithIssues) {
						const childNode = node.elements[childResult.index];
						if (childNode) {
							reportIssues(
								childResult,
								childNode as unknown as ts.ObjectLiteralExpression,
								sourceFile,
							);
						}
					}
				}
			}

			return {
				visitors: {
					JsonSourceFile: (node: ts.JsonSourceFile, { sourceFile }) => {
						for (const initializer of getPackagePropertiesOfNames(
							node,
							propertyNames,
						)) {
							checkValue(initializer, sourceFile);
						}
					},
				},
			};
		},
	});

	return { id, rule };
}
