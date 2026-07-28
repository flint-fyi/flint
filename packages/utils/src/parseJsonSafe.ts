export function parseJsonSafe(text: string | undefined) {
	try {
		return text && (JSON.parse(text) as unknown);
	} catch {
		return;
	}
}
