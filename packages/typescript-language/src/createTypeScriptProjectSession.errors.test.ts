import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { registerTypeScriptContentMapper } from "./contentMappers.ts";
import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

const mocks = vi.hoisted(() => ({
	apis: [] as { close: Mock }[],
	closeError: undefined as Error | undefined,
	dispose: vi.fn(),
	fileSystems: [] as { fileExists?: (fileName: string) => boolean }[],
	openedProjectSourceTexts: [] as (string | undefined)[],
	parsedConfigPaths: [] as string[],
	snapshotDisposes: [] as Mock[],
	updateSnapshotCalls: [] as unknown[],
	updateSnapshotError: undefined as Error | undefined,
	updateSnapshotErrors: [] as (Error | undefined)[],
}));

vi.mock("typescript-native/unstable/sync", () => ({
	API: class {
		close = vi.fn(() => {
			if (mocks.closeError) {
				throw mocks.closeError;
			}
		});
		fs: {
			fileExists?: (fileName: string) => boolean;
			readFile?: (fileName: string) => unknown;
		};

		constructor(options: {
			fs: {
				fileExists?: (fileName: string) => boolean;
				readFile?: (fileName: string) => unknown;
			};
		}) {
			this.fs = options.fs;
			mocks.apis.push(this);
			mocks.fileSystems.push(options.fs);
		}

		parseConfigFile() {
			return { fileNames: [] };
		}

		readConfigFile(fileName: string) {
			mocks.parsedConfigPaths.push(fileName);
			return { config: JSON.parse(this.fs.readFile?.(fileName) as string) };
		}

		updateSnapshot(changes?: unknown) {
			mocks.updateSnapshotCalls.push(changes);
			for (const projectPath of (
				changes as undefined | { openProjects?: string[] }
			)?.openProjects ?? []) {
				mocks.openedProjectSourceTexts.push(
					this.fs.readFile?.(projectPath) as string | undefined,
				);
			}
			const queuedError = mocks.updateSnapshotErrors.shift();
			if (queuedError) {
				throw queuedError;
			}
			if (mocks.updateSnapshotError) {
				throw mocks.updateSnapshotError;
			}

			return { dispose: mocks.snapshotDisposes.shift() ?? mocks.dispose };
		}
	},
}));

describe(`${createTypeScriptProjectSession.name} error handling`, () => {
	beforeEach(() => {
		mocks.apis.length = 0;
		mocks.closeError = undefined;
		mocks.dispose.mockReset();
		mocks.fileSystems.length = 0;
		mocks.openedProjectSourceTexts.length = 0;
		mocks.parsedConfigPaths.length = 0;
		mocks.snapshotDisposes.length = 0;
		mocks.updateSnapshotCalls.length = 0;
		mocks.updateSnapshotErrors.length = 0;
		mocks.updateSnapshotError = undefined;
	});

	it("closes the API when creating the initial snapshot fails", () => {
		const error = new Error("snapshot failed");
		mocks.updateSnapshotError = error;

		expect(() =>
			createTypeScriptProjectSession(
				createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
			),
		).toThrow(error);
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("preserves ordered initial snapshot and API close failures", () => {
		const snapshotError = new Error("snapshot failed");
		const closeError = new Error("API close failed");
		mocks.updateSnapshotError = snapshotError;
		mocks.closeError = closeError;

		let caught: unknown;
		try {
			createTypeScriptProjectSession(
				createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
			);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		expect((caught as AggregateError).errors).toEqual([
			snapshotError,
			closeError,
		]);
		expect((caught as AggregateError).cause).toBe(snapshotError);
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("closes the API once when disposing the current snapshot fails", () => {
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);
		const error = new Error("dispose failed");
		mocks.dispose.mockImplementation(() => {
			throw error;
		});

		expect(() => {
			session[Symbol.dispose]();
		}).toThrow(error);
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("preserves an API failure when it alone fails during disposal", () => {
		const error = new Error("API close failed");
		mocks.closeError = error;
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		expect(() => {
			session[Symbol.dispose]();
		}).toThrow(error);
		expect(mocks.dispose).toHaveBeenCalledOnce();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
	});

	it("preserves snapshot and API failures when disposing the session", () => {
		const snapshotError = new Error("snapshot disposal failed");
		const closeError = new Error("API close failed");
		mocks.dispose.mockImplementation(() => {
			throw snapshotError;
		});
		mocks.closeError = closeError;
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		let caught: unknown;
		try {
			session[Symbol.dispose]();
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		expect((caught as AggregateError).errors).toEqual([
			snapshotError,
			closeError,
		]);
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
		expect(mocks.dispose).toHaveBeenCalledOnce();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("disposes the replacement and closes the session when replacing the previous snapshot fails", () => {
		const error = new Error("previous snapshot disposal failed");
		const disposePrevious = vi.fn(() => {
			throw error;
		});
		const disposeReplacement = vi.fn();
		mocks.snapshotDisposes.push(disposePrevious, disposeReplacement);
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		expect(() => session.update({ openFiles: ["/repo/index.ts"] })).toThrow(
			error,
		);
		expect(disposeReplacement).toHaveBeenCalledOnce();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
		expect(() => session.getSnapshot()).toThrow(/disposed/i);
		expect(() => session.update({ openFiles: [] })).toThrow(/disposed/i);
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
		expect(disposeReplacement).toHaveBeenCalledOnce();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("preserves flat ordered replacement and cleanup failures with the original cause", () => {
		const previousError = new Error("previous snapshot disposal failed");
		const replacementError = new Error("replacement snapshot disposal failed");
		const closeError = new Error("API close failed");
		const disposePrevious = vi.fn(() => {
			throw previousError;
		});
		const disposeReplacement = vi.fn(() => {
			throw replacementError;
		});
		mocks.snapshotDisposes.push(disposePrevious, disposeReplacement);
		mocks.closeError = closeError;
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		let caught: unknown;
		try {
			session.update({ openFiles: ["/repo/index.ts"] });
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		expect((caught as AggregateError).errors).toEqual([
			previousError,
			replacementError,
			closeError,
		]);
		expect((caught as AggregateError).cause).toBe(previousError);
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
		expect(disposeReplacement).toHaveBeenCalledOnce();
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("retries opening authored projects after the reopen snapshot fails", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/tsconfig.json", "{}");
		const unregister = registerTypeScriptContentMapper({
			extensions: [".vue"],
			packageName: "unused-mapper",
		});
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: ["/repo/tsconfig.json"] });
		expect(unregister()).toBe(true);
		mocks.updateSnapshotErrors.push(undefined, new Error("reopen failed"));

		expect(() => session.update({})).toThrow("reopen failed");
		expect(() => session.update({})).not.toThrow();
		expect(mocks.updateSnapshotCalls.at(-1)).toMatchObject({
			openProjects: ["/repo/tsconfig.json"],
		});
	});

	it("restores changed overlays when the close snapshot fails so a retry reopens the project", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/tsconfig.json", "{}");
		using firstRegistration = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "first-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: ["/repo/tsconfig.json"] });
		using secondRegistration = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".svelte"],
				packageName: "second-mapper",
			}),
		};
		host.vfsUpsertFile(
			"/repo/tsconfig.json",
			'{ "references": [{ "path": "./shared" }] }',
		);
		mocks.updateSnapshotErrors.push(new Error("close failed"));

		expect(() => session.update({})).toThrow("close failed");
		expect(() => session.update({})).not.toThrow();

		const retryCalls = mocks.updateSnapshotCalls.slice(-2);
		expect(retryCalls[0]).toMatchObject({
			closeProjects: [expect.stringContaining("typescript-overlays")],
		});
		expect(retryCalls[1]).toMatchObject({
			openProjects: [expect.stringContaining("typescript-overlays")],
		});
		expect(
			JSON.parse(mocks.openedProjectSourceTexts.at(-1) ?? ""),
		).toMatchObject({
			contentMappers: [
				{ package: "first-mapper" },
				{ package: "second-mapper" },
			],
			references: [{ path: "/repo/shared" }],
		});
	});

	it("restores earlier overlays when a later config parse fails so a retry reopens them", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const firstConfigFilePath = "/repo/first/tsconfig.json";
		const secondConfigFilePath = "/repo/second/tsconfig.json";
		host.vfsUpsertFile(firstConfigFilePath, "{}");
		host.vfsUpsertFile(secondConfigFilePath, "{}");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);
		session.update({
			openProjects: [firstConfigFilePath, secondConfigFilePath],
		});
		host.vfsUpsertFile(
			firstConfigFilePath,
			'{ "references": [{ "path": "./shared" }] }',
		);
		host.vfsUpsertFile(secondConfigFilePath, "{");

		expect(() => session.update({})).toThrow();
		host.vfsUpsertFile(secondConfigFilePath, "{}");
		expect(() => session.update({})).not.toThrow();

		expect(mocks.updateSnapshotCalls.at(-1)).toMatchObject({
			openProjects: [expect.stringContaining("typescript-overlays")],
		});
		expect(
			JSON.parse(mocks.openedProjectSourceTexts.at(-1) ?? ""),
		).toMatchObject({ references: [{ path: "/repo/first/shared" }] });
	});

	it("removes the stable parse virtual file after every config parse", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/tsconfig.json", "{}");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);

		for (let revision = 0; revision < 10; revision += 1) {
			host.vfsUpsertFile("/repo/tsconfig.json", `{ "revision": ${revision} }`);
			session.update({ openProjects: ["/repo/tsconfig.json"] });
		}

		expect(new Set(mocks.parsedConfigPaths)).toEqual(
			new Set(["/repo/tsconfig.json.flint-parse.json"]),
		);
		expect(
			mocks.fileSystems[0]?.fileExists?.(
				"/repo/tsconfig.json.flint-parse.json",
			),
		).toBe(false);
	});
});
