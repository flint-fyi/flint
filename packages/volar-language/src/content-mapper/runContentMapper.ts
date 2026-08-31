import { stdin, stdout } from "node:process";

import type {
	ContentMapperProject,
	JsonRpcResponse,
	MappedOutput,
	OpenProjectParams,
	OptionDiagnostic,
	PositionEncoding,
	RunContentMapperOptions,
	SpanMapping,
	TransformParams,
	TransformResult,
} from "./protocol.ts";

interface JsonRpcRequest {
	id?: null | number | string;
	jsonrpc: "2.0";
	method: string;
	params?: unknown;
}

const MAXIMUM_HEADER_BYTES = 8 * 1024;
const CONTENT_LENGTH_MARKER = "content-length:";

export async function runContentMapper({
	diagnosticSource,
	input = stdin,
	openProject,
	output = stdout,
	transformFailureCode = 1,
}: RunContentMapperOptions): Promise<void> {
	const projects = new Map<string, ContentMapperProject>();
	let positionEncoding: PositionEncoding = "utf-16";
	let initialized = false;
	let pending = Buffer.alloc(0);
	const write = async (response: JsonRpcResponse): Promise<void> => {
		const body = Buffer.from(JSON.stringify(response));
		const frame = Buffer.concat([
			Buffer.from(`Content-Length: ${body.byteLength}\r\n\r\n`),
			body,
		]);
		await new Promise<void>((resolve, reject) => {
			const onError = (error: Error): void => {
				reject(error);
			};
			output.once("error", onError);
			output.write(frame, (error) => {
				if (error) {
					reject(error);
					return;
				}
				output.off("error", onError);
				resolve();
			});
		});
	};
	const dispatch = async (request: JsonRpcRequest): Promise<void> => {
		const id = request.id ?? null;
		if (request.method === "initialize") {
			if (initialized) {
				await write(
					responseError(id, -32600, "Content mapper is already initialized"),
				);
				return;
			}
			if (!isRecord(request.params) || request.params.protocolVersion !== 1) {
				await write(
					responseError(id, -32602, "initialize requires protocolVersion 1"),
				);
				return;
			}
			const encodings = request.params.positionEncodings;
			const selectedEncoding = Array.isArray(encodings)
				? encodings.find(
						(encoding): encoding is PositionEncoding =>
							encoding === "utf-8" || encoding === "utf-16",
					)
				: undefined;
			if (!selectedEncoding) {
				await write(
					responseError(
						id,
						-32602,
						"initialize requires utf-8 or utf-16 position support",
					),
				);
				return;
			}
			positionEncoding = selectedEncoding;
			initialized = true;
			await write({
				id,
				jsonrpc: "2.0",
				result: { diagnosticSource, positionEncoding, protocolVersion: 1 },
			});
			return;
		}
		if (!initialized) {
			await write(
				responseError(id, -32600, "Content mapper is not initialized"),
			);
			return;
		}
		if (
			request.method !== "openProject" &&
			request.method !== "closeProject" &&
			request.method !== "transform"
		) {
			await write(
				responseError(id, -32601, `Unknown method: ${request.method}`),
			);
			return;
		}
		if (!isRecord(request.params)) {
			await write(
				responseError(id, -32602, `${request.method} requires object params`),
			);
			return;
		}
		if (request.method === "openProject") {
			const projectHandle = getString(request.params, "projectHandle");
			const configFileName = getString(request.params, "configFileName");
			if (
				!projectHandle ||
				configFileName === undefined ||
				!isRecord(request.params.compilerOptions) ||
				projects.has(projectHandle)
			) {
				await write(
					responseError(
						id,
						-32602,
						"openProject requires a unique projectHandle, configFileName, and compilerOptions",
					),
				);
				return;
			}
			let project: ContentMapperProject;
			try {
				project = await openProject(
					request.params as unknown as OpenProjectParams,
				);
			} catch (error) {
				await write(internalError(id, error));
				return;
			}
			let optionDiagnostics: OptionDiagnostic[] | undefined;
			try {
				optionDiagnostics = project.validateOptions?.();
			} catch (error) {
				await Promise.allSettled([
					Promise.resolve().then(() => project.close?.()),
				]);
				await write(internalError(id, error));
				return;
			}
			projects.set(projectHandle, project);
			await write({
				id,
				jsonrpc: "2.0",
				result: {
					configIdentity: project.configIdentity ?? "",
					...(optionDiagnostics?.length ? { optionDiagnostics } : {}),
					...(project.watchedFiles?.length
						? { watchedFiles: project.watchedFiles }
						: {}),
				},
			});
			return;
		}
		const projectHandle = getString(request.params, "projectHandle");
		const project = projectHandle ? projects.get(projectHandle) : undefined;
		if (!project) {
			await write(
				responseError(
					id,
					-32602,
					`Unknown project handle: ${projectHandle ?? "<missing>"}`,
				),
			);
			return;
		}
		if (request.method === "closeProject") {
			projects.delete(projectHandle ?? "");
			try {
				await project.close?.();
			} catch (error) {
				await write(internalError(id, error));
				return;
			}
			await write({ id, jsonrpc: "2.0", result: null });
			return;
		}
		{
			const content = getString(request.params, "content");
			const fileName = getString(request.params, "fileName");
			if (content === undefined || fileName === undefined) {
				await write(
					responseError(id, -32602, "transform requires content and fileName"),
				);
				return;
			}
			let response: JsonRpcResponse;
			try {
				const result = await project.transform(
					request.params as unknown as TransformParams,
				);
				response = {
					id,
					jsonrpc: "2.0",
					result:
						positionEncoding === "utf-8"
							? encodeResult(result, content)
							: result,
				};
			} catch (error) {
				response = {
					id,
					jsonrpc: "2.0",
					result: {
						diagnostics: [
							{
								code: transformFailureCode,
								length:
									positionEncoding === "utf-8"
										? Buffer.byteLength(content)
										: content.length,
								messageText:
									error instanceof Error ? error.message : String(error),
								start: 0,
							},
						],
						extension: ".ts",
						text: "",
					},
				};
			}
			await write(response);
			return;
		}
	};
	try {
		for await (const chunk of input) {
			pending = Buffer.concat([
				pending,
				Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
			]);
			while (true) {
				const headerEnd = pending.indexOf("\r\n\r\n");
				if (headerEnd < 0) {
					if (pending.byteLength > MAXIMUM_HEADER_BYTES) {
						await write(
							responseError(null, -32700, "Content mapper header is too large"),
						);
						pending = trailingHeaderMarkerPrefix(pending);
					}
					break;
				}
				if (headerEnd > MAXIMUM_HEADER_BYTES) {
					await write(
						responseError(null, -32700, "Content mapper header is too large"),
					);
					const nextHeader = pending
						.toString("latin1")
						.toLowerCase()
						.indexOf(CONTENT_LENGTH_MARKER);
					pending =
						nextHeader > 0
							? pending.subarray(nextHeader)
							: pending.subarray(headerEnd + 4);
					continue;
				}
				const header = pending.subarray(0, headerEnd).toString();
				const match = /^Content-Length: (\d+)$/im.exec(header);
				const bodyLength = match ? Number(match[1]) : 0;
				if (!match || bodyLength <= 0 || bodyLength > 16 * 1024 * 1024) {
					await write(
						responseError(null, -32700, "Missing Content-Length header"),
					);
					pending = pending.subarray(headerEnd + 4);
					continue;
				}
				if (pending.byteLength < headerEnd + 4 + bodyLength) {
					break;
				}
				const body = pending.subarray(
					headerEnd + 4,
					headerEnd + 4 + bodyLength,
				);
				pending = pending.subarray(headerEnd + 4 + bodyLength);
				let request: unknown;
				try {
					request = JSON.parse(body.toString()) as unknown;
				} catch (error) {
					await write(
						responseError(
							null,
							-32700,
							error instanceof Error ? error.message : "Invalid JSON",
						),
					);
					continue;
				}
				if (
					!isRecord(request) ||
					request.jsonrpc !== "2.0" ||
					typeof request.method !== "string" ||
					!(
						typeof request.id === "string" ||
						(typeof request.id === "number" && Number.isFinite(request.id))
					)
				) {
					await write(responseError(null, -32600, "Invalid JSON-RPC request"));
					continue;
				}
				await dispatch(request as unknown as JsonRpcRequest);
			}
		}
		if (pending.length) {
			await write(
				responseError(null, -32700, "Incomplete content mapper frame"),
			);
		}
	} finally {
		await Promise.allSettled(
			[...projects.values()].map(async (project) => await project.close?.()),
		);
		projects.clear();
	}
}

function encodeOutput(
	result: MappedOutput,
	originalText: string,
): MappedOutput {
	const mappings = result.mappings?.map(
		(mapping): SpanMapping => [
			...utf8Range(result.text, mapping[0], mapping[1]),
			...utf8Range(originalText, mapping[2], mapping[3]),
			mapping[4],
			...(mapping[5] === undefined ? [] : [mapping[5]]),
		],
	);
	return {
		...result,
		diagnosticDirectives: result.diagnosticDirectives && {
			...result.diagnosticDirectives,
			directives: result.diagnosticDirectives.directives.map((directive) => [
				...utf8Range(originalText, directive[0], directive[1]),
				utf8Offset(result.text, directive[2]),
				utf8Offset(result.text, directive[3]),
				directive[4],
				...(directive[5] === undefined ? [] : [directive[5]]),
			]),
		},
		mappings,
	};
}

function encodeResult(
	result: TransformResult,
	originalText: string,
): TransformResult {
	const diagnostics = result.diagnostics?.map((diagnostic) => ({
		...diagnostic,
		length: utf8Range(originalText, diagnostic.start, diagnostic.length)[1],
		start: utf8Offset(originalText, diagnostic.start),
	}));
	return {
		...encodeOutput(result, originalText),
		diagnostics,
		supplemental: result.supplemental?.map((supplemental) =>
			encodeOutput(supplemental, originalText),
		),
	};
}

function getString(
	record: Record<string, unknown>,
	key: string,
): string | undefined {
	return typeof record[key] === "string" ? record[key] : undefined;
}

function internalError(
	id: JsonRpcResponse["id"],
	error: unknown,
): JsonRpcResponse {
	return responseError(
		id,
		-32603,
		error instanceof Error ? error.message : String(error),
	);
}

function isHighSurrogate(code: number): boolean {
	return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
	return code >= 0xdc00 && code <= 0xdfff;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function responseError(
	id: JsonRpcResponse["id"],
	code: number,
	message: string,
): JsonRpcResponse {
	return { error: { code, message }, id, jsonrpc: "2.0" };
}

function trailingHeaderMarkerPrefix(bytes: Buffer): Buffer {
	const maximumLength = Math.min(
		bytes.byteLength,
		CONTENT_LENGTH_MARKER.length - 1,
	);
	for (let length = maximumLength; length > 0; length -= 1) {
		if (
			bytes.subarray(-length).toString().toLowerCase() ===
			CONTENT_LENGTH_MARKER.slice(0, length)
		) {
			return bytes.subarray(-length);
		}
	}
	return Buffer.alloc(0);
}

function utf8Offset(text: string, offset: number): number {
	if (
		!Number.isInteger(offset) ||
		offset < 0 ||
		offset > text.length ||
		(offset > 0 &&
			offset < text.length &&
			isHighSurrogate(text.charCodeAt(offset - 1)) &&
			isLowSurrogate(text.charCodeAt(offset)))
	) {
		throw new Error(`Invalid UTF-16 offset ${offset}`);
	}
	return Buffer.byteLength(text.slice(0, offset));
}

function utf8Range(
	text: string,
	start: number,
	length: number,
): [number, number] {
	if (!Number.isInteger(length) || length < 0) {
		throw new Error(`Invalid UTF-16 range length ${length}`);
	}
	const end = start + length;
	const utf8Start = utf8Offset(text, start);
	return [utf8Start, utf8Offset(text, end) - utf8Start];
}
