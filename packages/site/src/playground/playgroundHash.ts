import { getFileNameError } from "./getFileNameError.ts";
import type { PlaygroundFile } from "./types.ts";

const hashPrefix = "#files=";

export interface PlaygroundState {
	activeFileName: string;
	files: PlaygroundFile[];
}

/**
 * Compresses playground files into a URL hash, which browsers don't send to servers.
 */
export async function encodePlaygroundHash(
	state: PlaygroundState,
): Promise<string> {
	const bytes = await transform(
		new TextEncoder().encode(JSON.stringify(state)),
		new CompressionStream("deflate-raw"),
	);

	return hashPrefix + bytesToBase64Url(bytes);
}

/**
 * Reads playground files from a URL hash.
 * @returns The files, `false` if the hash has invalid files, or `undefined` if it has none.
 */
export async function decodePlaygroundHash(
	hash: string,
): Promise<false | PlaygroundState | undefined> {
	if (!hash.startsWith(hashPrefix)) {
		return undefined;
	}

	try {
		const bytes = await transform(
			base64UrlToBytes(hash.slice(hashPrefix.length)),
			new DecompressionStream("deflate-raw"),
		);

		return parseState(JSON.parse(new TextDecoder().decode(bytes))) ?? false;
	} catch {
		return false;
	}
}

function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
	return Uint8Array.from(
		atob(text.replaceAll("-", "+").replaceAll("_", "/")),
		(character) => character.codePointAt(0) ?? 0,
	);
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCodePoint(byte);
	}

	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/, "");
}

function parseState(value: unknown): PlaygroundState | undefined {
	if (
		typeof value !== "object" ||
		!value ||
		!("activeFileName" in value) ||
		!("files" in value) ||
		typeof value.activeFileName !== "string" ||
		!Array.isArray(value.files) ||
		!value.files.length
	) {
		return undefined;
	}

	const files: PlaygroundFile[] = [];

	for (const file of value.files as unknown[]) {
		if (
			typeof file !== "object" ||
			!file ||
			!("code" in file) ||
			!("name" in file) ||
			typeof file.code !== "string" ||
			typeof file.name !== "string" ||
			getFileNameError(
				file.name,
				files.map((other) => other.name),
			)
		) {
			return undefined;
		}

		files.push({ code: file.code, name: file.name });
	}

	return {
		activeFileName: files.some((file) => file.name === value.activeFileName)
			? value.activeFileName
			: files[0].name,
		files,
	};
}

async function transform(
	bytes: Uint8Array<ArrayBuffer>,
	stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
	return new Uint8Array(
		// flint-disable-next-line node/blobReadingMethods -- this reads a stream, not a Blob
		await new Response(
			new Blob([bytes]).stream().pipeThrough(stream),
		).arrayBuffer(),
	);
}
