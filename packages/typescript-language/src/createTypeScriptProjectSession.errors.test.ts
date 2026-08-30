import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

const mocks = vi.hoisted(() => ({
	apis: [] as { close: Mock }[],
	dispose: vi.fn(),
	updateSnapshotError: undefined as Error | undefined,
}));

vi.mock("typescript-native/unstable/sync", () => ({
	API: class {
		close = vi.fn();

		constructor() {
			mocks.apis.push(this);
		}

		updateSnapshot() {
			if (mocks.updateSnapshotError) {
				throw mocks.updateSnapshotError;
			}

			return { dispose: mocks.dispose };
		}
	},
}));

describe(`${createTypeScriptProjectSession.name} error handling`, () => {
	beforeEach(() => {
		mocks.apis.length = 0;
		mocks.dispose.mockReset();
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
});
