import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { registerTypeScriptContentMapper } from "./contentMappers.ts";
import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

const mocks = vi.hoisted(() => ({
	apis: [] as { close: Mock }[],
	dispose: vi.fn(),
	openedProjectSourceTexts: [] as (string | undefined)[],
	snapshotCalls: [] as unknown[],
	snapshotDisposes: [] as Mock[],
	snapshotError: undefined as Error | undefined,
	snapshotErrors: [] as (Error | undefined)[],
}));

vi.mock("typescript-native/sync", () => ({
	API: class {
		close = vi.fn();
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
		}

		createSnapshot(changes?: unknown) {
			mocks.snapshotCalls.push(changes);
			for (const projectPath of (
				changes as undefined | { openProjects?: string[] }
			)?.openProjects ?? []) {
				mocks.openedProjectSourceTexts.push(
					this.fs.readFile?.(projectPath) as string | undefined,
				);
			}
			const queuedError = mocks.snapshotErrors.shift();
			if (queuedError) {
				throw queuedError;
			}
			if (mocks.snapshotError) {
				throw mocks.snapshotError;
			}

			return {
				dispose: mocks.snapshotDisposes.shift() ?? mocks.dispose,
				update: (nextChanges: unknown) => this.createSnapshot(nextChanges),
			};
		}

		// Mirrors an instance method of the native API, which callers invoke on
		// the instance, so it can't be static even though this stub ignores state.
		// flint-disable-next-line ts/classMethodsThis
		parseConfigFile() {
			return { fileNames: [] };
		}

		readConfigFile(fileName: string) {
			return { config: JSON.parse(this.fs.readFile?.(fileName) as string) };
		}
	},
}));

describe(`${createTypeScriptProjectSession.name} error handling`, () => {
	beforeEach(() => {
		mocks.apis.length = 0;
		mocks.dispose.mockReset();
		mocks.openedProjectSourceTexts.length = 0;
		mocks.snapshotDisposes.length = 0;
		mocks.snapshotCalls.length = 0;
		mocks.snapshotErrors.length = 0;
		mocks.snapshotError = undefined;
	});

	it("closes the API when creating the initial snapshot fails", () => {
		const error = new Error("snapshot failed");
		mocks.snapshotError = error;

		expect(() =>
			createTypeScriptProjectSession(
				createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
			),
		).toThrow(error);
		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("closes the API once when the session is disposed twice", () => {
		const session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		session[Symbol.dispose]();
		session[Symbol.dispose]();

		expect(mocks.apis[0]?.close).toHaveBeenCalledOnce();
	});

	it("throws the disposal error when the previous snapshot fails to dispose", () => {
		const error = new Error("previous snapshot disposal failed");
		mocks.snapshotDisposes.push(
			vi.fn(() => {
				throw error;
			}),
		);
		using session = createTypeScriptProjectSession(
			createVFSLinterHost({ caseSensitive: true, cwd: "/repo" }),
		);

		expect(() => session.update({ openFiles: ["/repo/index.ts"] })).toThrow(
			error,
		);
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
		mocks.snapshotErrors.push(new Error("close failed"));

		expect(() => session.update({})).toThrow("close failed");
		expect(() => session.update({})).not.toThrow();

		const retryCalls = mocks.snapshotCalls.slice(-2);
		expect(retryCalls[0]).toMatchObject({
			closeProjects: [expect.stringContaining(".flint-overlay.json")],
		});
		expect(retryCalls[1]).toMatchObject({
			openProjects: [expect.stringContaining(".flint-overlay.json")],
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

		expect(mocks.snapshotCalls.at(-1)).toMatchObject({
			openProjects: [expect.stringContaining(".flint-overlay.json")],
		});
		expect(
			JSON.parse(mocks.openedProjectSourceTexts.at(-1) ?? ""),
		).toMatchObject({ references: [{ path: "/repo/first/shared" }] });
	});
});
