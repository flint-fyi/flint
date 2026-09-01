import { PassThrough, Writable } from "node:stream";

import { describe, expect, test, vi } from "vitest";

import {
	createVolarTransform,
	type VolarTransformSource,
} from "./createVolarTransform.ts";
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
	positionEncodings: string[] = ["utf-8"],
): Promise<void> {
	server.input.write(
		frame(request(1, "initialize", { positionEncodings, protocolVersion: 1 })),
	);
	await nextResponse(server.output);
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
			headerEnd < 0
				? undefined
				: Number(
						/Content-Length: (\d+)/i.exec(
							state.bytes.subarray(0, headerEnd).toString(),
						)?.[1],
					);
		if (
			headerEnd >= 0 &&
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

async function open(server: ContentMapperServer): Promise<JsonRpcResponse> {
	server.input.write(
		frame(
			request(2, "openProject", {
				compilerOptions: {},
				configFileName: "/tsconfig.json",
				projectHandle: "project",
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

describe("runContentMapper", () => {
	test("handles split and coalesced UTF-8 framed lifecycle requests", async () => {
		const close = vi.fn();
		const { completion, input, output } = startServer({
			diagnosticSource: "flint",
			openProject: ({ options }) => ({
				close,
				transform: ({ content }): TransformResult => ({
					extension: ".ts",
					mappings: [[0, content.length, 0, content.length, 0]],
					text: content,
				}),
				validateOptions: () =>
					options === "valid"
						? []
						: [
								{
									code: 1,
									messageText: "Expected options to be valid",
									path: [],
								},
							],
			}),
		});
		const initialize = frame(
			request(1, "initialize", {
				locale: "en-US",
				positionEncodings: ["utf-8", "utf-16"],
				protocolVersion: 1,
			}),
		);
		input.write(initialize.subarray(0, 7));
		input.write(initialize.subarray(7));
		expect((await nextResponse(output)).result).toEqual({
			diagnosticSource: "flint",
			positionEncoding: "utf-8",
			protocolVersion: 1,
		});

		input.write(
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
		expect((await nextResponse(output)).result).toEqual({
			configIdentity: "",
			optionDiagnostics: [
				{ code: 1, messageText: "Expected options to be valid", path: [] },
			],
		});
		expect((await nextResponse(output)).result).toEqual({ configIdentity: "" });

		input.write(
			frame(
				request(4, "transform", {
					content: "const café = '😀';",
					fileName: "/项目/a.vue",
					projectHandle: "a",
				}),
			),
		);
		expect((await nextResponse(output)).result).toEqual({
			extension: ".ts",
			mappings: [[0, 21, 0, 21, 0]],
			text: "const café = '😀';",
		});
		input.write(frame(request(5, "closeProject", { projectHandle: "a" })));
		expect((await nextResponse(output)).result).toBeNull();
		expect(close).toHaveBeenCalledOnce();
		input.end();
		await completion;
		expect(close).toHaveBeenCalledTimes(2);
	});

	test("isolates handles and reports malformed or unknown requests", async () => {
		const { completion, input, output } = startServer({
			diagnosticSource: "flint",
			openProject: ({ projectHandle }) => ({
				transform: (): TransformResult => ({
					extension: ".ts",
					text: projectHandle,
				}),
			}),
		});
		input.write(
			frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8"],
					protocolVersion: 1,
				}),
			),
		);
		await nextResponse(output);
		for (const projectHandle of ["a", "b"]) {
			input.write(
				frame(
					request(2, "openProject", {
						compilerOptions: {},
						configFileName: "",
						projectHandle,
					}),
				),
			);
			await nextResponse(output);
		}
		input.write(
			frame(
				request(3, "transform", {
					content: "",
					fileName: "/x",
					projectHandle: "b",
				}),
			),
		);
		expect((await nextResponse(output)).result).toMatchObject({ text: "b" });
		input.write(frame(request(4, "missing", {})));
		expect((await nextResponse(output)).error?.code).toBe(-32601);
		input.write(frame(request(5, "transform", { projectHandle: "missing" })));
		expect((await nextResponse(output)).error?.code).toBe(-32602);
		input.write(Buffer.from("Content-Length: 1\r\n\r\n{"));
		expect((await nextResponse(output)).error?.code).toBe(-32700);
		input.end();
		await completion;
	});

	test("turns transform failures into mapper diagnostics", async () => {
		const { completion, input, output } = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: () => {
					throw new Error("SFC parse failed");
				},
			}),
		});
		input.write(
			frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8"],
					protocolVersion: 1,
				}),
			),
		);
		await nextResponse(output);
		input.write(
			frame(
				request(2, "openProject", {
					compilerOptions: {},
					configFileName: "",
					projectHandle: "a",
				}),
			),
		);
		await nextResponse(output);
		input.write(
			frame(
				request(3, "transform", {
					content: "bad",
					fileName: "/a.vue",
					projectHandle: "a",
				}),
			),
		);
		expect((await nextResponse(output)).result).toEqual({
			diagnostics: [
				{ code: 1, length: 3, messageText: "SFC parse failed", start: 0 },
			],
			extension: ".ts",
			text: "",
		});
		input.end();
		await completion;
	});
});

describe("content mapper protocol", () => {
	test("accepts the pinned nightly initialize request without a protocol version", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: () => ({ extension: ".ts", text: "" }),
			}),
		});
		server.input.write(
			frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8", "utf-16"],
				}),
			),
		);

		expect((await nextResponse(server.output)).result).toEqual({
			diagnosticSource: "flint",
			positionEncoding: "utf-8",
			protocolVersion: 1,
		});
		server.input.end();
		await server.completion;
	});

	test("converts all result offsets to UTF-8, including supplemental outputs", async () => {
		const { completion, input, output, ...server } = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: (): TransformResult => ({
					diagnosticDirectives: {
						directives: [[1, 3, 0, 3, 1, 7]],
						unusedExpectDirectiveDiagnostics: [],
					},
					diagnostics: [{ length: 3, messageText: "issue", start: 1 }],
					extension: ".ts",
					mappings: [[0, 3, 1, 3, 1]],
					supplemental: [
						{
							diagnosticDirectives: {
								directives: [[1, 3, 0, 3, 0]],
								unusedExpectDirectiveDiagnostics: [],
							},
							extension: ".tsx",
							mappings: [[0, 3, 1, 3, 2, 0]],
							text: "é😀B",
						},
					],
					text: "é😀B",
				}),
			}),
		});
		const running = { completion, input, output, ...server };
		await initialize(running);
		await open(running);
		input.write(
			frame(
				request(3, "transform", {
					content: "Aé😀Z",
					fileName: "/a.vue",
					projectHandle: "project",
				}),
			),
		);
		expect((await nextResponse(output)).result).toEqual({
			diagnosticDirectives: {
				directives: [[1, 6, 0, 6, 1, 7]],
				unusedExpectDirectiveDiagnostics: [],
			},
			diagnostics: [{ length: 6, messageText: "issue", start: 1 }],
			extension: ".ts",
			mappings: [[0, 6, 1, 6, 1]],
			supplemental: [
				{
					diagnosticDirectives: {
						directives: [[1, 6, 0, 6, 0]],
						unusedExpectDirectiveDiagnostics: [],
					},
					extension: ".tsx",
					mappings: [[0, 6, 1, 6, 2, 0]],
					text: "é😀B",
				},
			],
			text: "é😀B",
		});
		input.end();
		await completion;
	});

	test("leaves UTF-16 offsets unchanged", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: () => ({
					diagnostics: [{ length: 2, messageText: "issue", start: 1 }],
					extension: ".ts",
					mappings: [[1, 2, 1, 2, 0]],
					text: "A😀Z",
				}),
			}),
		});
		await initialize(server, ["utf-16"]);
		await open(server);
		server.input.write(
			frame(
				request(3, "transform", {
					content: "A😀Z",
					fileName: "a.vue",
					projectHandle: "project",
				}),
			),
		);
		expect((await nextResponse(server.output)).result).toMatchObject({
			diagnostics: [{ length: 2, messageText: "issue", start: 1 }],
			mappings: [[1, 2, 1, 2, 0]],
		});
		server.input.end();
		await server.completion;
	});

	test.each([
		[
			"mapping start",
			{ extension: ".ts", mappings: [[1, 0, 0, 0, 0]], text: "😀" },
		],
		[
			"mapping end",
			{ extension: ".ts", mappings: [[0, 1, 0, 0, 0]], text: "😀" },
		],
		[
			"diagnostic start",
			{
				diagnostics: [{ length: 0, messageText: "issue", start: 1 }],
				extension: ".ts",
				text: "",
			},
		],
		[
			"diagnostic end",
			{
				diagnostics: [{ length: 1, messageText: "issue", start: 0 }],
				extension: ".ts",
				text: "",
			},
		],
		[
			"directive start",
			{
				diagnosticDirectives: {
					directives: [[1, 0, 0, 0, 0]],
					unusedExpectDirectiveDiagnostics: [],
				},
				extension: ".ts",
				text: "",
			},
		],
		[
			"directive end",
			{
				diagnosticDirectives: {
					directives: [[0, 1, 0, 0, 0]],
					unusedExpectDirectiveDiagnostics: [],
				},
				extension: ".ts",
				text: "",
			},
		],
		[
			"noninteger mapping offset",
			{ extension: ".ts", mappings: [[0.5, 0, 0, 0, 0]], text: "😀" },
		],
		[
			"negative mapping offset",
			{ extension: ".ts", mappings: [[-1, 0, 0, 0, 0]], text: "😀" },
		],
		[
			"out-of-bounds mapping end",
			{ extension: ".ts", mappings: [[0, 3, 0, 0, 0]], text: "😀" },
		],
	] satisfies [string, TransformResult][])(
		"rejects an invalid UTF-16 %s",
		async (_name, result) => {
			const server = startServer({
				diagnosticSource: "flint",
				openProject: () => ({ transform: (): TransformResult => result }),
			});
			await initialize(server);
			await open(server);
			server.input.end(
				frame(
					request(3, "transform", {
						content: "😀",
						fileName: "a.vue",
						projectHandle: "project",
					}),
				),
			);
			expect((await nextResponse(server.output)).result).toMatchObject({
				diagnostics: [{ code: 1, length: 4, start: 0 }],
				extension: ".ts",
				text: "",
			});
			await server.completion;
		},
	);

	test("accepts all UTF-16 boundaries around astral characters", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: (): TransformResult => ({
					diagnosticDirectives: {
						directives: [[0, 2, 0, 2, 0]],
						unusedExpectDirectiveDiagnostics: [],
					},
					diagnostics: [{ length: 2, messageText: "issue", start: 0 }],
					extension: ".ts",
					mappings: [[0, 2, 0, 2, 0]],
					text: "😀",
				}),
			}),
		});
		await initialize(server);
		await open(server);
		server.input.end(
			frame(
				request(3, "transform", {
					content: "😀",
					fileName: "a.vue",
					projectHandle: "project",
				}),
			),
		);
		expect((await nextResponse(server.output)).result).toMatchObject({
			diagnosticDirectives: { directives: [[0, 4, 0, 4, 0]] },
			diagnostics: [{ length: 4, start: 0 }],
			mappings: [[0, 4, 0, 4, 0]],
		});
		await server.completion;
	});

	test("returns project identity, watched files, and option diagnostics", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				configIdentity: "vue@1",
				transform: () => ({ extension: ".ts", text: "" }),
				validateOptions: () => [
					{ code: 12, messageText: "bad option", path: ["rules", 0] },
				],
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

	test.each(["open", "validate", "close"])(
		"returns an internal error when %s throws",
		async (failure) => {
			const close = vi.fn(() => {
				if (failure === "close") {
					throw new Error("close failed");
				}
			});
			const server = startServer({
				diagnosticSource: "flint",
				openProject: () => {
					if (failure === "open") {
						throw new Error("open failed");
					}
					return {
						close,
						transform: () => ({ extension: ".ts", text: "" }),
						validateOptions: () => {
							if (failure === "validate") {
								throw new Error("validate failed");
							}
							return [];
						},
					};
				},
			});
			await initialize(server);
			let response = await open(server);
			if (failure === "close") {
				server.input.write(
					frame(
						request("close-id", "closeProject", { projectHandle: "project" }),
					),
				);
				response = await nextResponse(server.output);
			}
			expect(response).toMatchObject({
				error: { code: -32603, message: `${failure} failed` },
				id: failure === "close" ? "close-id" : 2,
			});
			expect(close).toHaveBeenCalledTimes(failure === "open" ? 0 : 1);
			server.input.end();
			await server.completion;
		},
	);

	test("recovers from malformed headers and JSON bodies", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: () => ({
				transform: () => ({ extension: ".ts", text: "" }),
			}),
		});
		server.input.write(
			Buffer.concat([
				Buffer.from("Bad: header\r\n\r\n"),
				frame(
					request(1, "initialize", {
						positionEncodings: ["utf-8"],
						protocolVersion: 1,
					}),
				),
			]),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32700);
		expect((await nextResponse(server.output)).id).toBe(1);
		server.input.write(
			Buffer.concat([
				Buffer.from("Content-Length: 1\r\n\r\n{"),
				frame(request("valid", "missing", {})),
			]),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32700);
		expect(await nextResponse(server.output)).toMatchObject({ id: "valid" });
		server.input.end();
		await server.completion;
	});

	test.each([
		["incomplete header", Buffer.from("Content-Len")],
		["incomplete body", Buffer.from("Content-Length: 4\r\n\r\n{")],
	])("reports %s at EOF", async (_name, bytes) => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.end(bytes);
		expect((await nextResponse(server.output)).error?.code).toBe(-32700);
		await server.completion;
	});

	test.each([0, 16 * 1024 * 1024 + 1])(
		"rejects Content-Length %i",
		async (length) => {
			const server = startServer({
				diagnosticSource: "flint",
				openProject: vi.fn(),
			});
			server.input.end(`Content-Length: ${length}\r\n\r\n`);
			expect((await nextResponse(server.output)).error?.code).toBe(-32700);
			await server.completion;
		},
	);

	test("bounds delimiter-free header growth and accepts a later frame", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.write("x".repeat(8193));
		expect((await nextResponse(server.output)).error).toMatchObject({
			code: -32700,
		});
		server.input.write(
			frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8"],
					protocolVersion: 1,
				}),
			),
		);
		expect((await nextResponse(server.output)).id).toBe(1);
		server.input.end();
		await server.completion;
	});

	test("retains a split header marker after delimiter-free overflow", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		const validFrame = frame(
			request(1, "initialize", {
				positionEncodings: ["utf-8"],
				protocolVersion: 1,
			}),
		);
		const markerSplit = 11;
		server.input.write(
			Buffer.concat([
				Buffer.from("x".repeat(8193)),
				Buffer.from(
					validFrame.subarray(0, markerSplit).toString().toLowerCase(),
				),
			]),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32700);
		server.input.end(validFrame.subarray(markerSplit));
		expect((await nextResponse(server.output)).id).toBe(1);
		await server.completion;
	});

	test("recovers a valid coalesced frame after an oversized garbage prefix", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.end(
			Buffer.concat([
				Buffer.from("x".repeat(8193)),
				frame(
					request(1, "initialize", {
						positionEncodings: ["utf-8"],
						protocolVersion: 1,
					}),
				),
			]),
		);
		expect((await nextResponse(server.output)).error?.code).toBe(-32700);
		expect((await nextResponse(server.output)).id).toBe(1);
		await server.completion;
	});

	test.each(["coalesced", "split"])(
		"recovers a lowercase %s frame after an oversized garbage prefix",
		async (delivery) => {
			const server = startServer({
				diagnosticSource: "flint",
				openProject: vi.fn(),
			});
			const validFrame = frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8"],
					protocolVersion: 1,
				}),
			);
			const lowercaseFrame = Buffer.concat([
				Buffer.from("content-length:"),
				validFrame.subarray("Content-Length:".length),
			]);
			const prefix = Buffer.from("x".repeat(8193));
			if (delivery === "split") {
				server.input.write(
					Buffer.concat([prefix, lowercaseFrame.subarray(0, 11)]),
				);
				server.input.end(lowercaseFrame.subarray(11));
			} else {
				server.input.end(Buffer.concat([prefix, lowercaseFrame]));
			}
			expect((await nextResponse(server.output)).error?.code).toBe(-32700);
			expect((await nextResponse(server.output)).id).toBe(1);
			await server.completion;
		},
	);

	test("preserves valid request IDs and rejects all invalid ID forms", async () => {
		const server = startServer({
			diagnosticSource: "flint",
			openProject: vi.fn(),
		});
		server.input.write(
			Buffer.concat([
				frame(
					request("text", "initialize", {
						positionEncodings: ["utf-8"],
						protocolVersion: 1,
					}),
				),
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
			expect(await nextResponse(server.output)).toMatchObject({
				error: { code: -32600 },
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
			error: { code: -32600 },
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
			frame(
				request(1, "initialize", {
					positionEncodings: ["utf-8"],
					protocolVersion: 1,
				}),
			),
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
				frame(
					request(1, "initialize", {
						positionEncodings: ["utf-8"],
						protocolVersion: 1,
					}),
				),
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

	test("propagates output errors and closes open projects", async () => {
		const input = new PassThrough();
		const close = vi.fn();
		let writes = 0;
		const output = new Writable({
			write(_chunk, _encoding, callback): void {
				writes += 1;
				callback(writes === 3 ? new Error("output failed") : undefined);
			},
		});
		const completion = runContentMapper({
			diagnosticSource: "flint",
			input,
			openProject: () => ({
				close,
				transform: () => ({ extension: ".ts", text: "" }),
			}),
			output,
		});
		input.end(
			Buffer.concat([
				frame(
					request(1, "initialize", {
						positionEncodings: ["utf-8"],
						protocolVersion: 1,
					}),
				),
				frame(
					request(2, "openProject", {
						compilerOptions: {},
						configFileName: "",
						projectHandle: "project",
					}),
				),
				frame(request(3, "missing", {})),
			]),
		);
		await expect(completion).rejects.toThrow("output failed");
		expect(close).toHaveBeenCalledOnce();
	});
});

test("createVolarTransform flattens mapped ranges and excludes scaffolding", () => {
	const source = "éfoo BAR";
	const generated = "éfoo baz(); BAR";
	const transform = createVolarTransform({
		extension: ".ts",
		mappings: [
			{ generatedOffsets: [0, 12], lengths: [4, 3], sourceOffsets: [0, 5] },
			{
				generatedLengths: [3],
				generatedOffsets: [5],
				lengths: [0],
				sourceOffsets: [4],
			},
		] as unknown as VolarTransformSource["mappings"],
		text: generated,
	});
	expect(
		transform({ content: source, fileName: "/a.vue", projectHandle: "a" }),
	).toEqual({
		extension: ".ts",
		mappings: [
			[0, 4, 0, 4, 0],
			[5, 3, 4, 0, 1],
			[12, 3, 5, 3, 0],
		],
		text: generated,
	});
});

test("createVolarTransform preserves feature masks and validates mappings", () => {
	const transform = createVolarTransform({
		extension: ".ts",
		mappings: [
			{
				data: {
					completion: true,
					format: true,
					navigation: true,
					semantic: true,
					structure: true,
					verification: true,
				},
				generatedOffsets: [0],
				lengths: [1],
				sourceOffsets: [0],
			},
			{
				data: {},
				generatedOffsets: [1],
				lengths: [1],
				sourceOffsets: [1],
			},
		],
		text: "ab",
	});
	expect(
		transform({ content: "ab", fileName: "a", projectHandle: "a" }),
	).toEqual({
		extension: ".ts",
		mappings: [
			[0, 1, 0, 1, 0],
			[1, 1, 1, 1, 0, 0],
		],
		text: "ab",
	});
	expect(() =>
		createVolarTransform({
			extension: ".ts",
			mappings: [
				{
					data: {},
					generatedOffsets: [0, 1],
					lengths: [1],
					sourceOffsets: [0, 1],
				},
			],
			text: "ab",
		})({ content: "ab", fileName: "a", projectHandle: "a" }),
	).toThrow(/parallel arrays/);
});

test.each([
	[
		"semantic highlight false",
		{ semantic: { shouldHighlight: (): boolean => false } },
		(1 << 0) | (1 << 12) | (1 << 19),
	],
	[
		"semantic highlight true",
		{ semantic: { shouldHighlight: (): boolean => true } },
		(1 << 0) | (1 << 12) | (1 << 13) | (1 << 19),
	],
	[
		"navigation highlight false",
		{ navigation: { shouldHighlight: (): boolean => false } },
		0b1111111_1000 & ~(1 << 7),
	],
	[
		"navigation highlight true",
		{ navigation: { shouldHighlight: (): boolean => true } },
		0b1111111_1000,
	],
	[
		"navigation rename false",
		{ navigation: { shouldRename: (): boolean => false } },
		0b1111111_1000 & ~(1 << 8),
	],
	[
		"navigation rename true",
		{ navigation: { shouldRename: (): boolean => true } },
		0b1111111_1000,
	],
] as const)("preserves %s callback semantics", (_name, data, expected) => {
	const transform = createVolarTransform({
		extension: ".ts",
		mappings: [
			{ data, generatedOffsets: [0], lengths: [1], sourceOffsets: [0] },
		],
		text: "a",
	});
	expect(
		transform({ content: "a", fileName: "a", projectHandle: "a" }),
	).toMatchObject({
		mappings: [[0, 1, 0, 1, 0, expected]],
	});
});

describe("createVolarTransform mapping validation", () => {
	function transformMappings(
		mappings: unknown[],
		text = "abcdef",
		content = "abcdef",
	): () => unknown {
		return () =>
			createVolarTransform({
				extension: ".ts",
				mappings: mappings as VolarTransformSource["mappings"],
				text,
			})({
				content,
				fileName: "a",
				projectHandle: "a",
			});
	}

	test("accepts exact duplicate original ranges at disjoint virtual ranges", () => {
		expect(
			transformMappings([
				{ generatedOffsets: [0, 3], lengths: [2, 2], sourceOffsets: [0, 0] },
			]),
		).not.toThrow();
	});

	test.each([
		["partial", [0, 1], [3, 3], undefined],
		["contained", [0, 1], [4, 2], [2, 2]],
	] as const)(
		"rejects %s original overlaps",
		(_name, sourceOffsets, lengths, generatedLengths) => {
			expect(
				transformMappings([
					{
						...(generatedLengths && {
							generatedLengths: [...generatedLengths],
						}),
						generatedOffsets: [0, 3],
						lengths: [...lengths],
						sourceOffsets: [...sourceOffsets],
					},
				]),
			).toThrow(/partially overlap/);
		},
	);

	test("rejects generated overlap and accepts adjacent and zero-length ranges", () => {
		expect(
			transformMappings([
				{ generatedOffsets: [0, 1], lengths: [2, 2], sourceOffsets: [0, 2] },
			]),
		).toThrow(/overlap at virtual/);
		expect(
			transformMappings([
				{
					generatedLengths: [2, 0, 2],
					generatedOffsets: [0, 2, 2],
					lengths: [2, 0, 2],
					sourceOffsets: [0, 2, 2],
				},
			]),
		).not.toThrow();
	});

	test("orders zero-length mappings before nonempty mappings at the same virtual start", () => {
		expect(
			transformMappings([
				{
					generatedLengths: [2, 0, 0],
					generatedOffsets: [0, 0, 0],
					lengths: [2, 0, 0],
					sourceOffsets: [0, 2, 0],
				},
			])(),
		).toMatchObject({
			mappings: [
				[0, 0, 0, 0, 0],
				[0, 0, 2, 0, 0],
				[0, 2, 0, 2, 0],
			],
		});
	});

	test.each([
		{ generatedOffsets: [0, 1], lengths: [1], sourceOffsets: [0, 1] },
		{ generatedOffsets: [0, 1], lengths: [1, 1], sourceOffsets: [0] },
		{
			generatedLengths: [1],
			generatedOffsets: [0, 1],
			lengths: [1, 1],
			sourceOffsets: [0, 1],
		},
	])("rejects every parallel array mismatch form", (mapping) => {
		expect(transformMappings([mapping])).toThrow(/parallel arrays/);
	});

	test.each([
		["negative", -1, 1, 0, 1],
		["noninteger", 0.5, 1, 0, 1],
		["virtual out of bounds", 5, 2, 0, 1],
		["original out of bounds", 0, 1, 5, 2],
	] as const)(
		"rejects %s ranges",
		(_name, generatedStart, generatedLength, sourceStart, sourceLength) => {
			expect(
				transformMappings([
					{
						generatedLengths: [generatedLength],
						generatedOffsets: [generatedStart],
						lengths: [sourceLength],
						sourceOffsets: [sourceStart],
					},
				]),
			).toThrow(/invalid or out-of-bounds/);
		},
	);

	test("uses verbatim only for identical text and atom otherwise", () => {
		expect(
			transformMappings(
				[{ generatedOffsets: [0, 1], lengths: [1, 1], sourceOffsets: [0, 1] }],
				"ab",
				"ax",
			)(),
		).toMatchObject({
			mappings: [
				[0, 1, 0, 1, 0],
				[1, 1, 1, 1, 1],
			],
		});
	});

	test("omits only the full feature mask and preserves zero and subsets", () => {
		const result = createVolarTransform({
			extension: ".ts",
			mappings: [
				{
					data: {
						completion: true,
						format: true,
						navigation: true,
						semantic: true,
						structure: true,
						verification: true,
					},
					generatedOffsets: [0],
					lengths: [1],
					sourceOffsets: [0],
				},
				{ data: {}, generatedOffsets: [1], lengths: [1], sourceOffsets: [1] },
				{
					data: { semantic: true },
					generatedOffsets: [2],
					lengths: [1],
					sourceOffsets: [2],
				},
			],
			text: "abc",
		})({ content: "abc", fileName: "a", projectHandle: "a" });
		expect(result.mappings).toEqual([
			[0, 1, 0, 1, 0],
			[1, 1, 1, 1, 0, 0],
			[2, 1, 2, 1, 0, (1 << 0) | (1 << 12) | (1 << 13) | (1 << 19)],
		]);
	});
});
