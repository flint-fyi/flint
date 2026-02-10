import type { AST } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

interface MessageStringVisitorContext {
	isInArray: boolean;
	messageId: string;
	node: AST.StringLiteral;
	propertyName: string;
}

export function findMessagesProperty(
	node: AST.CallExpression,
): AST.PropertyAssignment | undefined {
	const args = node.arguments[1];
	if (args?.kind !== SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const messagesProperty = args.properties.find((prop) => {
		return (
			prop.kind === SyntaxKind.PropertyAssignment &&
			prop.name.kind === SyntaxKind.Identifier &&
			prop.name.text === "messages"
		);
	});

	if (messagesProperty?.kind === SyntaxKind.PropertyAssignment) {
		return messagesProperty;
	}

	return undefined;
}

export function* forEachMessageString(
	messagesProperty: AST.PropertyAssignment,
): Generator<MessageStringVisitorContext> {
	if (
		messagesProperty.initializer.kind !== SyntaxKind.ObjectLiteralExpression
	) {
		return;
	}

	for (const prop of messagesProperty.initializer.properties) {
		if (
			prop.kind !== SyntaxKind.PropertyAssignment ||
			prop.name.kind !== SyntaxKind.Identifier ||
			prop.initializer.kind !== SyntaxKind.ObjectLiteralExpression
		) {
			continue;
		}

		const messageId = prop.name.text;

		for (const messageProp of prop.initializer.properties) {
			if (
				messageProp.kind !== SyntaxKind.PropertyAssignment ||
				messageProp.name.kind !== SyntaxKind.Identifier
			) {
				continue;
			}

			const propertyName = messageProp.name.text;

			if (messageProp.initializer.kind === SyntaxKind.StringLiteral) {
				yield {
					isInArray: false,
					messageId,
					node: messageProp.initializer,
					propertyName,
				};
			}

			if (messageProp.initializer.kind === SyntaxKind.ArrayLiteralExpression) {
				for (const el of messageProp.initializer.elements) {
					if (el.kind === SyntaxKind.StringLiteral) {
						yield {
							isInArray: true,
							messageId,
							node: el,
							propertyName,
						};
					}
				}
			}
		}
	}
}

export function getStringOriginalQuote(
	node: AST.StringLiteral,
	sourceFile: AST.SourceFile,
): string {
	const text = node.getText(sourceFile);
	return text[0] ?? '"';
}

export function isCreateRuleCall(node: AST.CallExpression): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "createRule"
	);
}

export function isLanguageCreateRule(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	return isCreateRuleCall(node) && !isRuleCreatorCreateRule(node, typeChecker);
}

// TODO: Maybe need to check it more strictly
// https://github.com/flint-fyi/flint/issues/152
export function isRuleCreatorCreateRule(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	if (!isCreateRuleCall(node)) {
		return false;
	}

	const propertyAccess = node.expression as AST.PropertyAccessExpression;
	const type = typeChecker.getTypeAtLocation(propertyAccess.expression);

	return type.getSymbol()?.getName() === "RuleCreator";
}

// TODO: Maybe need to check it more strictly
// https://github.com/flint-fyi/flint/issues/152
export function isRuleContextReport(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	const propertyAccess = node.expression;
	const type = typeChecker.getTypeAtLocation(propertyAccess.expression);
	const typeName = type.getSymbol()?.getName();

	return typeName === "RuleContext" && propertyAccess.name.text === "report";
}
