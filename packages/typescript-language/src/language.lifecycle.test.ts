import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { setVolarCreateFile, typescriptLanguage } from "./language.ts";

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
	const project = { checker: {}, program };
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
		factory[Symbol.dispose]();

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

	it("closes the session when a later update fails", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
		});
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));
		mocks.session.update.mockImplementationOnce(() => {
			throw new Error("update failed");
		});

		expect(() => factory.createFile(fileData("/repo/second.ts"))).toThrow(
			"update failed",
		);
		expect(() => first.services.sourceFile).toThrow(
			/session has been disposed/i,
		);
		expect(() => factory.createFile(fileData("/repo/third.ts"))).toThrow(
			/session has been disposed/i,
		);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
		expect(() => {
			first[Symbol.dispose]();
		}).not.toThrow();
		expect(() => {
			first[Symbol.dispose]();
		}).not.toThrow();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("fails active services and later files after a partial update closes the session", () => {
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

	it("closes the session when first-file project lookup fails", () => {
		mockSnapshot({});
		mocks.session.getProjectForFile.mockReturnValue(undefined);

		expect(() =>
			createFactory().createFile(fileData("/repo/first.ts")),
		).toThrow("Could not find project");
		expect(mocks.session.update).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("closes the session when later source lookup fails", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));

		expect(() => factory.createFile(fileData("/repo/missing.ts"))).toThrow(
			"Could not retrieve source file",
		);
		expect(() => first.services.sourceFile).toThrow(
			/session has been disposed/i,
		);
		expect(() => factory.createFile(fileData("/repo/third.ts"))).toThrow(
			/session has been disposed/i,
		);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("aggregates a file failure with a session cleanup failure", () => {
		mockSnapshot({});
		mocks.session[Symbol.dispose].mockImplementationOnce(() => {
			throw new Error("cleanup failed");
		});

		let caught: unknown;
		try {
			createFactory().createFile(fileData("/repo/missing.ts"));
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		const aggregate = caught as AggregateError;
		expect(aggregate.errors[0]).toHaveProperty(
			"message",
			expect.stringContaining(
				"Could not retrieve source file for: /repo/missing.ts",
			),
		);
		expect(aggregate.errors[1]).toHaveProperty("message", "cleanup failed");
		expect(aggregate.cause).toBe(aggregate.errors[0]);
	});

	it("flattens snapshot and API cleanup failures after a file failure", () => {
		mockSnapshot({});
		const snapshotError = new Error("snapshot cleanup failed");
		const closeError = new Error("API close failed");
		mocks.session[Symbol.dispose].mockImplementationOnce(() => {
			throw new AggregateError([snapshotError, closeError], "cleanup failed", {
				cause: snapshotError,
			});
		});

		let caught: unknown;
		try {
			createFactory().createFile(fileData("/repo/missing.ts"));
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		const aggregate = caught as AggregateError;
		const fileError = aggregate.errors[0];
		expect(fileError).toHaveProperty(
			"message",
			expect.stringContaining(
				"Could not retrieve source file for: /repo/missing.ts",
			),
		);
		expect(aggregate.errors).toEqual([fileError, snapshotError, closeError]);
		expect(aggregate.cause).toBe(fileError);
	});

	it("cleans up when directive parsing fails", () => {
		mockSnapshot({ "/repo/first.ts": { fileName: "/repo/first.ts" } });
		mocks.parseDirectives.mockImplementationOnce(() => {
			throw new Error("directive failed");
		});

		expect(() =>
			createFactory().createFile(fileData("/repo/first.ts")),
		).toThrow("directive failed");
		expect(mocks.session.update).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("cleans up an unsupported extension without Volar registration", () => {
		mockSnapshot({
			"/repo/first.unknown": { fileName: "/repo/first.unknown" },
		});

		expect(() =>
			createFactory().createFile(fileData("/repo/first.unknown")),
		).toThrow("Unknown extension");
		expect(mocks.session.update).toHaveBeenCalledOnce();
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});

	it("closes the session for a registered-but-blocked Volar path", () => {
		mockSnapshot({
			"/repo/first.ts": { fileName: "/repo/first.ts" },
			"/repo/second.vue": { fileName: "/repo/second.vue" },
		});
		setVolarCreateFile(vi.fn());
		const factory = createFactory();
		const first = factory.createFile(fileData("/repo/first.ts"));

		expect(() => factory.createFile(fileData("/repo/second.vue"))).toThrow(
			"until Volar supports",
		);
		expect(() => first.services.sourceFile).toThrow(
			/session has been disposed/i,
		);
		expect(mocks.session[Symbol.dispose]).toHaveBeenCalledOnce();
	});
});
