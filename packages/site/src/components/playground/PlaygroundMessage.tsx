import type { JSX } from "react";

import { splitMessage } from "./splitMessage.ts";

export interface PlaygroundMessageProps {
	message: string;
}

export function PlaygroundMessage({
	message,
}: PlaygroundMessageProps): JSX.Element {
	return (
		<>
			{splitMessage(message).map((part, index) =>
				part.isCode ? <code key={index}>{part.text}</code> : part.text,
			)}
		</>
	);
}
