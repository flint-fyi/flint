import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { registerTypeScriptContentMapper } from "./contentMappers.ts";
import { typescriptLanguage } from "./language.ts";

const mocks = vi.hoisted(() => ({
	createTypeScriptProjectSession: vi.fn(),
	parseDirectives: vi.fn(() => ({})),
	session: {
		getProjectForFile: vi.fn(),
		getSnapshot: vi.fn(),
		[Symbol.dispose]: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("./createTypeScriptProjectSession.ts", () => ({
	createTypeScriptProjectSession: mocks.createTypeScriptProjectSession,
}));

vi.mock("./directives/parseDirectivesFromTypeScriptFile.ts", () => ({
	parseDirectivesFromTypeScriptFile: mocks.parseDirectives,
}));

const fileData = (filePathAbsolute: string) => ({
	filePath: filePathAbsolute,
	filePathAbsolute,
	sourceText: "export {};",
});

function createFactory() {
	return typescriptLanguage.createFileFactory(
		createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
	);
}

function mockSnapshot(sourceFiles: Record<string, object>) {
	const program = {
		getSourceFile: vi.fn((filePath: string) => sourceFiles[filePath]),
		getSourceFileNames: vi.fn(() => Object.keys(sourceFiles)),
	};
	const project = { program, typeChecker: {} };
	const snapshot = {
		getDefaultProjectForFile: vi.fn<() => object | undefined>(() => project),
		getProjects: vi.fn(() => [project]),
	};
	mocks.session.getProjectForFile.mockReturnValue(project);
	mocks.session.getSnapshot.mockReturnValue(snapshot);
	mocks.session.update.mockReturnValue(snapshot);
	return { program, snapshot };
}

describe("typescriptLanguage failed file lifecycle", () => {
	it("keeps a session until its factory is disposed", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
			"/repo/second.ts": { fileName: "/repo/second.ts" },
		});
		mocks.createTypeScriptProjectSession.mockReturnValue(mocks.session);
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));
		first[Symbol.dispose]();

		const second = factory.createFile(fileData("/repo/second.ts"));
		expect(second.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/second.ts",
		);
		second[Symbol.dispose]();
		factory[Symbol.dispose]?.();

		expect(mocks.createTypeScriptProjectSession).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("closes a first-file session exactly once when updating fails", () => {
		mocks.session.update.mockImplementationOnce(() => {
			throw new Error("update failed");
		});
		const factory = createFactory();

		expect(() => factory.createFile(fileData("/repo/first.ts"))).toThrow(
			"update failed",
		);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("fails active services and later files when a later update fails", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));
		mocks.session.update.mockImplementationOnce(() => {
			mocks.session.getSnapshot.mockImplementation(() => {
				throw new Error("TypeScript project session has been disposed.");
			});
			throw new Error("previous snapshot disposal failed");
		});

		expect(() => factory.createFile(fileData("/repo/second.ts"))).toThrow(
			"previous snapshot disposal failed",
		);
		expect(() => first.services.sourceFile).toThrow(
			/session has been disposed/i,
		);
		expect(() => factory.createFile(fileData("/repo/third.ts"))).toThrow(
			/session has been disposed/i,
		);
		expect(() => {
			first[Symbol.dispose]();
		}).not.toThrow();
		expect(() => {
			first[Symbol.dispose]();
		}).not.toThrow();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	// Preparing one file can fail for reasons local to it — a content-mapped
	// file with no ancestor tsconfig, an unknown extension — and that must not
	// tear down the session every other file shares. Session-level failures
	// (a failed `update`, covered above) still close it.
	it("fails one file without closing the session when project lookup fails", () => {
		mockSnapshot({});
		mocks.session.getProjectForFile.mockReturnValue(undefined);

		expect(() =>
			createFactory().createFile(fileData("/repo/first.ts")),
		).toThrow("Could not find project");
		expect(mocks.session.update).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).not.toHaveBeenCalled();
	});

	it("fails one file without closing the session when source lookup fails", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));

		expect(() => factory.createFile(fileData("/repo/missing.ts"))).toThrow(
			"Could not retrieve source file",
		);
		expect(first.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/first.ts",
		);
		expect(mocks.session[Symbol.dispose]).not.toHaveBeenCalled();
	});

	it("reopens a file whose first creation failed", () => {
		const { program } = mockSnapshot({});
		const factory = createFactory();

		expect(() => factory.createFile(fileData("/repo/first.ts"))).toThrow(
			"Could not retrieve source file",
		);

		// The failed attempt rolled its path back out of the open files, so the
		// retry opens it rather than assuming it is already in the snapshot.
		program.getSourceFile.mockReturnValue({ fileName: "/repo/first.ts" });
		const retried = factory.createFile(fileData("/repo/first.ts"));

		expect(retried.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/first.ts",
		);
		expect(mocks.session.update).toHaveBeenCalledTimes(2);
		expect(mocks.session[Symbol.dispose]).not.toHaveBeenCalled();
	});

	it("opens the file in a new session when the native process exits during an update", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		mocks.session.update.mockImplementationOnce(() => {
			throw new Error("Unexpected EOF while reading from child process");
		});
		const factory = createFactory();

		const first = factory.createFile(fileData("/repo/first.ts"));

		expect(first.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/first.ts",
		);
		expect(mocks.createTypeScriptProjectSession).toHaveBeenCalledTimes(2);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("fails only the file when the native process exits each time the file is opened", () => {
		mockSnapshot({ "/repo/second.ts": { fileName: "/repo/second.ts" } });
		mocks.session.update
			.mockImplementationOnce(() => {
				throw new Error("Unexpected EOF while reading from child process");
			})
			.mockImplementationOnce(() => {
				throw new Error("EPIPE: broken pipe, write");
			});
		const factory = createFactory();

		expect(() => factory.createFile(fileData("/repo/first.ts"))).toThrow(
			"TypeScript's native process exited while opening /repo/first.ts.",
		);

		const second = factory.createFile(fileData("/repo/second.ts"));

		expect(second.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/second.ts",
		);
		expect(mocks.createTypeScriptProjectSession).toHaveBeenCalledTimes(3);
	});

	it("retries the batch in a new session when the native process exits during preparation", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
			"/repo/second.ts": { fileName: "/repo/second.ts" },
		});
		mocks.session.update.mockImplementationOnce(() => {
			throw new Error("Unexpected EOF while reading from child process");
		});
		const factory = createFactory();

		factory.prepareFiles?.(["/repo/first.ts", "/repo/second.ts"]);
		const updatesAfterPreparation = mocks.session.update.mock.calls.length;
		const first = factory.createFile(fileData("/repo/first.ts"));

		expect(mocks.session.update.mock.calls.at(-1)).toEqual([
			{
				changed: ["/repo/first.ts", "/repo/second.ts"],
				openFiles: ["/repo/first.ts", "/repo/second.ts"],
			},
		]);
		expect(mocks.session.update).toHaveBeenCalledTimes(updatesAfterPreparation);
		expect(first.services.sourceFile).toHaveProperty(
			"fileName",
			"/repo/first.ts",
		);
		expect(mocks.createTypeScriptProjectSession).toHaveBeenCalledTimes(2);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("fails one file without closing the session when directives fail", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		mocks.parseDirectives.mockImplementationOnce(() => {
			throw new Error("directive failed");
		});

		expect(() =>
			createFactory().createFile(fileData("/repo/first.ts")),
		).toThrow("directive failed");
		expect(mocks.session.update).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).not.toHaveBeenCalled();
	});

	it("replaces an idle session when the first mapper is registered after the session started", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
			"/repo/second.ts": { fileName: "/repo/second.ts" },
		});
		const factory = createFactory();
		factory.createFile(fileData("/repo/first.ts"))[Symbol.dispose]();
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".mapped"],
				packageName: "mapper",
			}),
		};

		factory.createFile(fileData("/repo/second.ts"));

		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
		expect(mocks.createTypeScriptProjectSession.mock.calls).toEqual([
			[expect.anything(), { runExternalCode: false }],
			[expect.anything(), { runExternalCode: true }],
		]);
	});

	it("keeps a session started without mappers when a mapper is registered while a file is active", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
			"/repo/second.ts": { fileName: "/repo/second.ts" },
		});
		const factory = createFactory();
		factory.createFile(fileData("/repo/first.ts"));
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".mapped"],
				packageName: "mapper",
			}),
		};

		factory.createFile(fileData("/repo/second.ts"));

		expect(mocks.session[Symbol.dispose]).not.toHaveBeenCalled();
		expect(mocks.createTypeScriptProjectSession).toHaveBeenCalledOnce();
	});

	it("fails an unsupported extension without opening a session", () => {
		mockSnapshot({
			"/repo/first.unknown": { fileName: "/repo/first.unknown" },
		});

		expect(() =>
			createFactory().createFile(fileData("/repo/first.unknown")),
		).toThrow("Unknown extension");
		expect(mocks.createTypeScriptProjectSession).not.toHaveBeenCalled();
		expect(mocks.session.update).not.toHaveBeenCalled();
	});

	it("suggests the matching Flint plugin when no mapper is registered for a framework extension", () => {
		mockSnapshot({});
		mocks.session.getProjectForFile.mockReturnValue(undefined);

		expect(() =>
			createFactory().createFile(fileData("/repo/Component.vue")),
		).toThrow("Did you install & import @flint.fyi/vue?");
		expect(mocks.createTypeScriptProjectSession).not.toHaveBeenCalled();
	});

	it("hands a mapper the file's source text when creating a mapped file", () => {
		mockSnapshot({
			"/repo/Component.mapped": { fileName: "/repo/Component.mapped" },
		});
		const createFile = vi.fn(() => ({}));
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				createFile,
				extensions: [".mapped"],
				packageName: "mapped",
			}),
		};

		createFactory().createFile(fileData("/repo/Component.mapped"));

		expect(createFile).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ sourceText: "export {};" }),
		);
	});

	describe("mapped file range adjustment", () => {
		function createMappedFile() {
			mockSnapshot({
				"/repo/Component.mapped": { fileName: "/repo/Component.mapped" },
			});
			using unregister = {
				[Symbol.dispose]: registerTypeScriptContentMapper({
					extensions: [".mapped"],
					packageName: "mapped",
				}),
			};
			return createFactory().createFile(fileData("/repo/Component.mapped"));
		}

		it("decodes an authored range without consulting the span map when begin is encoded as negative", () => {
			const file = createMappedFile();

			expect(
				file.adjustReportRange?.({ begin: -1 - 5, end: 8 }, "report"),
			).toEqual({
				begin: 5,
				end: 8,
			});
			expect(
				file.adjustReportRange?.({ begin: -1 - 5, end: 8 }, "change"),
			).toEqual({
				begin: 5,
				end: 8,
			});
		});

		it("keeps an authored range at offset 0 when begin is encoded as negative", () => {
			const file = createMappedFile();

			expect(file.adjustReportRange?.({ begin: -1, end: 3 }, "report")).toEqual(
				{
					begin: 0,
					end: 3,
				},
			);
		});

		it("drops a virtual range when the mapped file has no span map", () => {
			const file = createMappedFile();

			expect(
				file.adjustReportRange?.({ begin: 0, end: 3 }, "report"),
			).toBeNull();
		});
	});
});
