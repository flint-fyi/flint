export function parseJsonSafe(text: string | undefined): unknown {
	try {
		return text && (JSON.parse(text) as unknown);
	} catch {
		return undefined;
	}
}
