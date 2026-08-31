import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

const mocks = vi.hoisted(() => ({
	apis: [] as { close: Mock }[],
	closeError: undefined as Error | undefined,
	dispose: vi.fn(),
	snapshotDisposes: [] as Mock[],
	updateSnapshotError: undefined as Error | undefined,
}));

vi.mock("typescript-native/unstable/sync", () => ({
	API: class {
		close = vi.fn(() => {
			if (mocks.closeError) {
				throw mocks.closeError;
			}
		});

		constructor() {
			mocks.apis.push(this);
		}

		updateSnapshot() {
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
		mocks.snapshotDisposes.length = 0;
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
});
