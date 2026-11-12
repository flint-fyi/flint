import { spawn } from "node:child_process";
import { PassThrough, Writable } from "node:stream";
import url from "node:url";

import { describe, expect, test, vi } from "vitest";

import type {
	JsonRpcResponse,
	RunContentMapperOptions,
	TransformResult,
} from "./protocol.ts";
import { runContentMapper } from "./runContentMapper.ts";

interface ContentMapperServer {
	completion: Promise<void>;
	input: PassThrough;
	output: PassThrough;
}

interface ResponseBuffer {
	bytes: Buffer;
	waiters: (() => void)[];
}

function frame(value: unknown): Buffer {
	const body = Buffer.from(JSON.stringify(value));
	return Buffer.concat([
		Buffer.from(`Content-Length: ${body.byteLength}\r\n\r\n`),
		body,
	]);
}

const responseBuffers = new WeakMap<PassThrough, ResponseBuffer>();

async function initialize(
	server: ContentMapperServer,
	positionEncodings: string[] = ["utf-8", "utf-16"],
): Promise<JsonRpcResponse> {
	server.input.write(frame(request(1, "initialize", { positionEncodings })));
	return await nextResponse(server.output);
}

async function nextResponse(output: PassThrough): Promise<JsonRpcResponse> {
	let state = responseBuffers.get(output);
	if (!state) {
		const createdState: ResponseBuffer = {
			bytes: Buffer.alloc(0),
			waiters: [],
		};
		state = createdState;
		responseBuffers.set(output, createdState);
		output.on("data", (chunk: Buffer) => {
			createdState.bytes = Buffer.concat([createdState.bytes, chunk]);
			createdState.waiters.shift()?.();
		});
	}
	for (;;) {
		const headerEnd = state.bytes.indexOf("\r\n\r\n");
		const length =
			headerEnd === -1
				? undefined
				: Number(
						/content-length: (\d+)/i.exec(
							state.bytes.subarray(0, headerEnd).toString(),
						)?.[1],
					);
		if (
			headerEnd !== -1 &&
			length !== undefined &&
			state.bytes.byteLength >= headerEnd + 4 + length
		) {
			const bodyEnd = headerEnd + 4 + length;
			const response = JSON.parse(
				state.bytes.subarray(headerEnd + 4, bodyEnd).toString(),
			) as JsonRpcResponse;
			state.bytes = state.bytes.subarray(bodyEnd);
			return response;
		}
		// Responses arrive one at a time, so waiting for each is inherently serial.
		// flint-disable-next-line performance/loopAwaits
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Timed out waiting for content mapper response"));
			}, 2000);
			state.waiters.push(() => {
				clearTimeout(timeout);
				resolve();
			});
		});
	}
}

async function open(
	server: ContentMapperServer,
	projectHandle = "project",
): Promise<JsonRpcResponse> {
	server.input.write(
		frame(
			request(2, "openProject", {
				compilerOptions: {},
				configFileName: "/tsconfig.json",
				projectHandle,
			}),
		),
	);
	return await nextResponse(server.output);
}

function request(id: number | string, method: string, params: unknown): object {
	return { id, jsonrpc: "2.0", method, params };
}

function startServer(options: RunContentMapperOptions): ContentMapperServer {
	const input = new PassThrough();
	const output = new PassThrough();
	const completion = runContentMapper({ ...options, input, output });
	return { completion, input, output };
}

describe(runContentMapper, () => {
	test("handles split and coalesced framed lifecycle requests", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: ({ options }) => ({
				optionDiagnostics:
					options === "valid"
						? []
						: [
								{
									code: 1,
									messageText: "Expected options to be valid",
									path: [],
								},
							],
				transform: ({ content }): TransformResult => ({
					extension: ".ts",
					mappings: [[0, content.length, 0, content.length, 0]],
					text: content,
				}),
			}),
		});
		const initializeFrame = frame(
			request(1, "initialize", {
				locale: "en-US",
				positionEncodings: ["utf-8", "utf-16"],
			}),
		);
		server.input.write(initializeFrame.subarray(0, 7));
		server.input.write(initializeFrame.subarray(7));
		expect((await nextResponse(server.output)).result).toEqual({
			diagnosticSource: "flint",
			positionEncoding: "utf-16",
		});

		server.input.write(
			Buffer.concat([
				frame(
					request(2, "openProject", {
						compilerOptions: { strict: true },
						configFileName: "/项目/tsconfig.json",
						options: false,
						projectHandle: "a",
					}),
				),
				frame(
					request(3, "openProject", {
						compilerOptions: {},
						configFileName: "/b/tsconfig.json",
						options: "valid",
						projectHandle: "b",
					}),
				),
			]),
		);
		expect((await nextResponse(server.output)).result).toEqual({
			configIdentity: "",
			optionDiagnostics: [
				{ code: 1, messageText: "Expected options to be valid", path: [] },
			],
		});
		expect((await nextResponse(server.output)).result).toEqual({
			configIdentity: "",
		});

		server.input.write(
			frame(
				request(4, "transform", {
					content: "const café = '😀';",
					fileName: "/项目/a.vue",
					projectHandle: "a",
				}),
			),
		);
		expect((await nextResponse(server.output)).result).toEqual({
			extension: ".ts",
			mappings: [[0, 18, 0, 18, 0]],
			text: "const café = '😀';",
		});
		server.input.write(
			frame(request(5, "closeProject", { projectHandle: "a" })),
		);
		expect((await nextResponse(server.output)).result).toBeNull();
		server.input.write(
			frame(
				request(6, "transform", {
					content: "",
					fileName: "/项目/a.vue",
					projectHandle: "a",
				}),
			),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32_602);
		server.input.end();
		await server.completion;
	});

	test("isolates handles and reports malformed or unknown requests", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: ({ projectHandle }) => ({
				transform: (): TransformResult => ({
					extension: ".ts",
					text: projectHandle,
				}),
			}),
		});
		await initialize(server);
		await open(server, "a");
		await open(server, "b");
		server.input.write(
			frame(
				request(3, "transform", {
					content: "",
					fileName: "/x",
					projectHandle: "b",
				}),
			),
		);
		expect((await nextResponse(server.output)).result).toMatchObject({
			text: "b",
		});
		expect((await open(server, "a")).error?.code).toBe(-32_602);
		server.input.write(frame(request(4, "missing", {})));
		expect((await nextResponse(server.output)).error?.code).toBe(-32_601);
		server.input.write(
			frame(request(5, "transform", { projectHandle: "missing" })),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32_602);
		server.input.write(Buffer.from("Content-Length: 1\r\n\r\n{"));
		expect((await nextResponse(server.output)).error?.code).toBe(-32_700);
		server.input.end();
		await server.completion;
	});

	test("turns transform failures into mapper diagnostics", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: () => {
					throw new Error("SFC parse failed");
				},
			}),
		});
		await initialize(server);
		await open(server);
		server.input.write(
			frame(
				request(3, "transform", {
					content: "bad😀",
					fileName: "/a.vue",
					projectHandle: "project",
				}),
			),
		);
		expect((await nextResponse(server.output)).result).toEqual({
			diagnostics: [
				{ code: 1, length: 5, messageText: "SFC parse failed", start: 0 },
			],
			extension: ".ts",
			text: "",
		});
		server.input.end();
		await server.completion;
	});

	test("returns an error when the client does not offer utf-16 positions", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});

		expect((await initialize(server, ["utf-8"])).error).toMatchObject({
			code: -32_602,
		});
		expect((await initialize(server)).result).toEqual({
			diagnosticSource: "flint",
			positionEncoding: "utf-16",
		});
		expect((await initialize(server)).error).toMatchObject({
			code: -32_600,
		});
		server.input.end();
		await server.completion;
	});

	test("returns project identity, watched files, and option diagnostics", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				configIdentity: "vue@1",
				optionDiagnostics: [
					{ code: 12, messageText: "bad option", path: ["rules", 0] },
				],
				transform: () => ({ extension: ".ts", text: "" }),
				watchedFiles: ["/config/vue.json"],
			}),
		});
		await initialize(server);
		expect((await open(server)).result).toEqual({
			configIdentity: "vue@1",
			optionDiagnostics: [
				{ code: 12, messageText: "bad option", path: ["rules", 0] },
			],
			watchedFiles: ["/config/vue.json"],
		});
		server.input.end();
		await server.completion;
	});

	test("returns an internal error when opening a project throws", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => {
				throw new Error("open failed");
			},
		});
		await initialize(server);

		expect(await open(server)).toMatchObject({
			error: { code: -32_603, message: "open failed" },
			id: 2,
		});
		server.input.end();
		await server.completion;
	});

	test("throws when a frame has no Content-Length header", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.end("Bad: header\r\n\r\n{}");

		await expect(server.completion).rejects.toThrow(/Content-Length/);
	});

	test("throws when input ends in the middle of a frame", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.end("Content-Length: 4\r\n\r\n{");

		await expect(server.completion).rejects.toThrow(/middle of a frame/);
	});

	test("preserves valid request IDs and rejects all invalid ID forms", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.write(
			Buffer.concat([
				frame(request("text", "initialize", { positionEncodings: ["utf-16"] })),
				frame({ id: 42, jsonrpc: "2.0", method: "missing", params: {} }),
			]),
		);
		expect((await nextResponse(server.output)).id).toBe("text");
		expect((await nextResponse(server.output)).id).toBe(42);
		for (const invalid of [
			{ jsonrpc: "2.0", method: "missing" },
			{ id: null, jsonrpc: "2.0", method: "missing" },
			{ id: true, jsonrpc: "2.0", method: "missing" },
		]) {
			server.input.write(frame(invalid));
			// flint-disable-next-line performance/loopAwaits
			expect(await nextResponse(server.output)).toMatchObject({
				error: { code: -32_600 },
				id: null,
			});
		}
		const nonfiniteId = Buffer.from(
			'{"jsonrpc":"2.0","id":1e999,"method":"missing","params":{}}',
		);
		server.input.write(
			Buffer.concat([
				Buffer.from(`Content-Length: ${nonfiniteId.byteLength}\r\n\r\n`),
				nonfiniteId,
			]),
		);
		expect(await nextResponse(server.output)).toMatchObject({
			error: { code: -32_600 },
			id: null,
		});
		server.input.end();
		await server.completion;
	});

	test("writes exact UTF-8 Content-Length", async () => {
		const input = new PassThrough();
		const output = new PassThrough();
		const chunks: Buffer[] = [];
		output.on("data", (chunk: Buffer) => chunks.push(chunk));
		const completion = runContentMapper({
			diagnosticSource: "源😀",
			input,
			openProject: vi.fn(),
			output,
		});
		input.end(
			frame(request(1, "initialize", { positionEncodings: ["utf-16"] })),
		);
		await completion;
		const bytes = Buffer.concat(chunks);
		const headerEnd = bytes.indexOf("\r\n\r\n");
		const declared = Number(
			/Content-Length: (\d+)/.exec(bytes.toString())?.[1],
		);
		expect(declared).toBe(bytes.subarray(headerEnd + 4).byteLength);
	});

	test("waits for each atomic output frame before processing the next request", async () => {
		const input = new PassThrough();
		const callbacks: (() => void)[] = [];
		const chunks: Buffer[] = [];
		const output = new Writable({
			highWaterMark: 1,
			write(chunk: Buffer, _encoding, callback): void {
				chunks.push(Buffer.from(chunk));
				callbacks.push(callback);
			},
		});
		const openProject = vi.fn(() => ({
			transform: () => ({ extension: ".ts", text: "" }),
		}));
		const completion = runContentMapper({
			diagnosticSource: "flint",
			input,
			openProject,
			output,
		});
		input.end(
			Buffer.concat([
				frame(request(1, "initialize", { positionEncodings: ["utf-16"] })),
				frame(
					request(2, "openProject", {
						compilerOptions: {},
						configFileName: "",
						projectHandle: "project",
					}),
				),
			]),
		);
		await vi.waitFor(() => {
			expect(chunks).toHaveLength(1);
		});
		expect(openProject).not.toHaveBeenCalled();
		expect(chunks[0]?.toString()).toMatch(/^Content-Length: \d+\r\n\r\n\{/);
		callbacks.shift()?.();
		await vi.waitFor(() => {
			expect(chunks).toHaveLength(2);
		});
		expect(openProject).toHaveBeenCalledOnce();
		callbacks.shift()?.();
		await completion;
	});

	test("propagates output errors", async () => {
		const input = new PassThrough();
		let writes = 0;
		const output = new Writable({
			write(_chunk, _encoding, callback): void {
				writes += 1;
				callback(writes === 2 ? new Error("output failed") : undefined);
			},
		});
		const completion = runContentMapper({
			diagnosticSource: "flint",
			input,
			openProject: vi.fn(),
			output,
		});
		input.end(
			Buffer.concat([
				frame(request(1, "initialize", { positionEncodings: ["utf-16"] })),
				frame(request(2, "missing", {})),
			]),
		);
		await expect(completion).rejects.toThrow("output failed");
	});

	test("does not write console output to stdout when serving over stdout", async () => {
		const child = spawn(
			process.execPath,
			[
				"--input-type=module",
				"--eval",
				`
					import { runContentMapper } from ${JSON.stringify(url.pathToFileURL(`${import.meta.dirname}/runContentMapper.ts`).href)};
					await runContentMapper({
						diagnosticSource: "flint",
						openProject: () => {
							console.log("logged from a config");
							process.stdout.write("written from a config");
							return { transform: () => ({ extension: ".ts", text: "" }) };
						},
					});
				`,
			],
			{ stdio: "pipe" },
		);
		const stdout: Buffer[] = [];
		const stderr: Buffer[] = [];
		child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
		child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
		const exitCode = new Promise<null | number>((resolve) => {
			child.on("close", resolve);
		});
		child.stdin.end(
			Buffer.concat([
				frame(request(1, "initialize", { positionEncodings: ["utf-16"] })),
				frame(
					request(2, "openProject", {
						compilerOptions: {},
						configFileName: "/tsconfig.json",
						projectHandle: "project",
					}),
				),
			]),
		);

		expect(await exitCode).toBe(0);
		expect(Buffer.concat(stdout).toString()).toBe(
			Buffer.concat([
				frame({
					id: 1,
					jsonrpc: "2.0",
					result: { diagnosticSource: "flint", positionEncoding: "utf-16" },
				}),
				frame({ id: 2, jsonrpc: "2.0", result: { configIdentity: "" } }),
			]).toString(),
		);
		expect(Buffer.concat(stderr).toString()).toContain(
			"logged from a config\nwritten from a config",
		);
	});
});
