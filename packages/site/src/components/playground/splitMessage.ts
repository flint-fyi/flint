export interface MessagePart {
	isCode: boolean;
	text: string;
}

/**
 * Splits a report message into plain text and `backtick`-wrapped code.
 */
export function splitMessage(message: string): MessagePart[] {
	return message
		.split(/(`[^`]+`)/)
		.filter(Boolean)
		.map((part) =>
			part.length > 2 && part.startsWith("`") && part.endsWith("`")
				? { isCode: true, text: part.slice(1, -1) }
				: { isCode: false, text: part },
		);
}
