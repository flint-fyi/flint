import {
	isArrayLiteralExpression,
	isIdentifier,
	isObjectLiteralExpression,
	isPropertyAssignment,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

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
	if (!args || !isObjectLiteralExpression(args)) {
		return undefined;
	}

	const messagesProperty = args.properties.find((prop) => {
		return (
			isPropertyAssignment(prop) &&
			isIdentifier(prop.name) &&
			prop.name.text === "messages"
		);
	});

	return messagesProperty;
}

export function* forEachMessageString(
	messagesProperty: AST.PropertyAssignment,
): Generator<MessageStringVisitorContext, void, void> {
	if (!isObjectLiteralExpression(messagesProperty.initializer)) {
		return;
	}

	for (const prop of messagesProperty.initializer.properties) {
		if (
			!isPropertyAssignment(prop) ||
			!isIdentifier(prop.name) ||
			!isObjectLiteralExpression(prop.initializer)
		) {
			continue;
		}

		const messageId = prop.name.text;

		for (const messageProp of prop.initializer.properties) {
			if (
				!isPropertyAssignment(messageProp) ||
				!isIdentifier(messageProp.name)
			) {
				continue;
			}

			const propertyName = messageProp.name.text;

			if (isStringLiteral(messageProp.initializer)) {
				yield {
					isInArray: false,
					messageId,
					node: messageProp.initializer,
					propertyName,
				};
			}

			if (isArrayLiteralExpression(messageProp.initializer)) {
				for (const el of messageProp.initializer.elements) {
					if (isStringLiteral(el)) {
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
