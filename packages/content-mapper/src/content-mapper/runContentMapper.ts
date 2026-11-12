import { stderr, stdin, stdout } from "node:process";

import {
	TRANSFORM_FAILURE_CODE,
	type ContentMapperProject,
	type JsonRpcResponse,
	type OpenProjectParams,
	type RunContentMapperOptions,
	type TransformParams,
	type TransformResult,
} from "./protocol.ts";

interface JsonRpcRequest {
	id: number | string;
	jsonrpc: "2.0";
	method: string;
	params?: unknown;
}

export async function runContentMapper({
	diagnosticSource,
	input = stdin,
	openProject,
	output = stdout,
}: RunContentMapperOptions): Promise<void> {
	const projects = new Map<string, ContentMapperProject>();
	let initialized = false;
	let pending: Buffer = Buffer.alloc(0);
	const writeFrame = output.write.bind(output);
	if (output === stdout) {
		// Frames own stdout, so anything else the process prints, such as a
		// framework config's console.log, must not corrupt the protocol stream.
		stdout.write = stderr.write.bind(stderr);
	}
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
			writeFrame(frame, (error) => {
				if (error) {
					reject(error);
					return;
				}
				output.off("error", onError);
				resolve();
			});
		});
	};
	const dispatch = async ({
		id,
		method,
		params,
	}: JsonRpcRequest): Promise<void> => {
		if (method === "initialize") {
			if (initialized) {
				await write(
					responseError(id, -32_600, "Content mapper is already initialized"),
				);
				return;
			}
			if (
				!isRecord(params) ||
				!Array.isArray(params.positionEncodings) ||
				!params.positionEncodings.includes("utf-16")
			) {
				await write(
					responseError(
						id,
						-32_602,
						"initialize requires utf-16 position support",
					),
				);
				return;
			}
			initialized = true;
			await write({
				id,
				jsonrpc: "2.0",
				result: { diagnosticSource, positionEncoding: "utf-16" },
			});
			return;
		}
		if (!initialized) {
			await write(
				responseError(id, -32_600, "Content mapper is not initialized"),
			);
			return;
		}
		if (
			method !== "openProject" &&
			method !== "closeProject" &&
			method !== "transform"
		) {
			await write(responseError(id, -32_601, `Unknown method: ${method}`));
			return;
		}
		if (!isRecord(params)) {
			await write(
				responseError(id, -32_602, `${method} requires object params`),
			);
			return;
		}
		const projectHandle = getString(params, "projectHandle") ?? "";
		if (method === "openProject") {
			if (
				!projectHandle ||
				getString(params, "configFileName") === undefined ||
				!isRecord(params.compilerOptions) ||
				projects.has(projectHandle)
			) {
				await write(
					responseError(
						id,
						-32_602,
						"openProject requires a unique projectHandle, configFileName, and compilerOptions",
					),
				);
				return;
			}
			let project: ContentMapperProject;
			try {
				project = await openProject(params as unknown as OpenProjectParams);
			} catch (error) {
				await write(internalError(id, error));
				return;
			}
			projects.set(projectHandle, project);
			await write({
				id,
				jsonrpc: "2.0",
				result: {
					configIdentity: project.configIdentity ?? "",
					...(project.optionDiagnostics?.length
						? { optionDiagnostics: project.optionDiagnostics }
						: {}),
					...(project.watchedFiles?.length
						? { watchedFiles: project.watchedFiles }
						: {}),
				},
			});
			return;
		}
		const project = projects.get(projectHandle);
		if (!project) {
			await write(
				responseError(
					id,
					-32_602,
					`Unknown project handle: ${projectHandle || "<missing>"}`,
				),
			);
			return;
		}
		if (method === "closeProject") {
			projects.delete(projectHandle);
			await write({ id, jsonrpc: "2.0", result: null });
			return;
		}
		const content = getString(params, "content");
		if (content === undefined || getString(params, "fileName") === undefined) {
			await write(
				responseError(id, -32_602, "transform requires content and fileName"),
			);
			return;
		}
		let result: TransformResult;
		try {
			result = await project.transform(params as unknown as TransformParams);
		} catch (error) {
			result = {
				diagnostics: [
					{
						code: TRANSFORM_FAILURE_CODE,
						length: content.length,
						messageText: error instanceof Error ? error.message : String(error),
						start: 0,
					},
				],
				extension: ".ts",
				text: "",
			};
		}
		await write({ id, jsonrpc: "2.0", result });
	};
	// The protocol is a sequential request stream over stdio: each frame must
	// be handled before the next, so the awaits below are inherently serial.
	// flint-disable-lines-begin performance/loopAwaits
	for await (const chunk of input) {
		pending = Buffer.concat([
			pending,
			Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
		]);
		while (true) {
			const headerEnd = pending.indexOf("\r\n\r\n");
			if (headerEnd === -1) {
				break;
			}
			const contentLength = /^content-length: (\d+)$/im.exec(
				pending.subarray(0, headerEnd).toString(),
			)?.[1];
			if (contentLength === undefined) {
				throw new Error(
					"Content mapper received a frame without a Content-Length header",
				);
			}
			const bodyStart = headerEnd + 4;
			const bodyEnd = bodyStart + Number(contentLength);
			if (pending.byteLength < bodyEnd) {
				break;
			}
			const body = pending.subarray(bodyStart, bodyEnd).toString();
			pending = pending.subarray(bodyEnd);
			let request: unknown;
			try {
				request = JSON.parse(body) as unknown;
			} catch (error) {
				await write(
					responseError(
						null,
						-32_700,
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
				await write(responseError(null, -32_600, "Invalid JSON-RPC request"));
				continue;
			}
			await dispatch(request as unknown as JsonRpcRequest);
		}
	}
	// flint-disable-lines-end performance/loopAwaits
	if (pending.length) {
		throw new Error("Content mapper input ended in the middle of a frame");
	}
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
		-32_603,
		error instanceof Error ? error.message : String(error),
	);
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
