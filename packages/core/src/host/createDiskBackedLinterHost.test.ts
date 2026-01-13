// flint-disable-file unnecessaryBlocks
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDiskBackedLinterHost } from "./createDiskBackedLinterHost.ts";
import { normalizePath } from "./normalizePath.ts";

const INTEGRATION_DIR_NAME = ".flint-disk-backed-linter-host-integration-tests";

function findUpNodeModules(startDir: string): string {
	let current = startDir;
	while (true) {
		const candidate = path.join(current, "node_modules");
		if (fs.existsSync(candidate)) {
			return candidate;
		}
		const parent = path.dirname(current);
		if (parent === current) {
			throw new Error("Could not find node_modules directory.");
		}
		current = parent;
	}
}

/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_$" }] */

describe("createDiskBackedLinterHost", () => {
	const integrationRoot = path.join(
		findUpNodeModules(import.meta.dirname),
		INTEGRATION_DIR_NAME,
	);

	beforeEach(() => {
		fs.rmSync(integrationRoot, { force: true, recursive: true });
		fs.mkdirSync(integrationRoot, { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(integrationRoot, { force: true, recursive: true });
	});

	it("normalizes cwd", () => {
		const host = createDiskBackedLinterHost(integrationRoot + "/dir/..");

		expect(host.getCurrentDirectory()).toEqual(
			normalizePath(integrationRoot, host.isCaseSensitiveFS()),
		);
	});

	it("stats files and directories", () => {
		const host = createDiskBackedLinterHost(integrationRoot);
		const filePath = path.join(integrationRoot, "file.txt");
		const dirPath = path.join(integrationRoot, "dir");
		const missingPath = path.join(integrationRoot, "missing.txt");

		fs.writeFileSync(filePath, "hello");
		fs.mkdirSync(dirPath, { recursive: true });

		expect(host.stat(filePath)).toEqual("file");
		expect(host.stat(dirPath)).toEqual("directory");
		expect(host.stat(missingPath)).toEqual(undefined);
	});

	it("reads file contents", () => {
		const host = createDiskBackedLinterHost(integrationRoot);
		const filePath = path.join(integrationRoot, "file.txt");

		fs.writeFileSync(filePath, "hello");

		expect(host.readFile(filePath)).toEqual("hello");
	});

	it("lists directory entries and resolves symlinks", () => {
		const host = createDiskBackedLinterHost(integrationRoot);
		const filePath = path.join(integrationRoot, "file.txt");
		const dirPath = path.join(integrationRoot, "dir");
		const fileLink = path.join(integrationRoot, "file-link.txt");
		const dirLink = path.join(integrationRoot, "dir-link");
		const brokenLink = path.join(integrationRoot, "broken-link");
		const missingPath = path.join(integrationRoot, "missing.txt");

		fs.writeFileSync(filePath, "hello");
		fs.mkdirSync(dirPath, { recursive: true });
		fs.symlinkSync(filePath, fileLink);
		fs.symlinkSync(dirPath, dirLink, "junction");
		fs.symlinkSync(missingPath, brokenLink);

		const entries = host.readDirectory(integrationRoot);
		const sortedEntries = entries
			.map((entry) => ({ name: entry.name, type: entry.type }))
			.toSorted((a, b) => a.name.localeCompare(b.name));

		expect(sortedEntries).toStrictEqual([
			{ name: "dir", type: "directory" },
			{ name: "dir-link", type: "directory" },
			{ name: "file-link.txt", type: "file" },
			{ name: "file.txt", type: "file" },
		]);
	});

	describe("watchFile", () => {
		it("reports creation", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "watch.txt");
			const onEvent = vi.fn();
			using _ = host.watchFile(filePath, onEvent, 10);

			await sleep(50);

			fs.writeFileSync(filePath, "first");
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
		});

		it("reports editing", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "watch-change.txt");
			fs.writeFileSync(filePath, "first");
			const onEvent = vi.fn();
			using _ = host.watchFile(filePath, onEvent);

			await sleep(50);

			fs.writeFileSync(filePath, "second");
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("changed");
			});
		});

		it("reports deletion", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "watch-delete.txt");
			fs.writeFileSync(filePath, "first");
			const onEvent = vi.fn();
			using _ = host.watchFile(filePath, onEvent);

			await sleep(50);

			fs.rmSync(filePath);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("deleted");
			});
		});

		it("watches missing files through create-delete-create", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "watch-recreate.txt");
			const onEvent = vi.fn();
			using _ = host.watchFile(filePath, onEvent, 10);

			await sleep(50);

			fs.writeFileSync(filePath, "first");
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
			onEvent.mockClear();

			fs.rmSync(filePath);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("deleted");
			});
			onEvent.mockClear();

			fs.writeFileSync(filePath, "second");
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
		});

		it("watches deeply nested files across directory removal and recreation", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const firstDir = path.join(integrationRoot, "first");
			const secondDir = path.join(firstDir, "second");
			const filePath = path.join(secondDir, "deep.txt");
			const onEvent = vi.fn();
			using _ = host.watchFile(filePath, onEvent, 10);

			await sleep(50);

			fs.mkdirSync(firstDir, { recursive: true });
			fs.mkdirSync(secondDir, { recursive: true });
			fs.writeFileSync(filePath, "content");

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
			onEvent.mockClear();

			fs.rmSync(secondDir, { force: true, recursive: true });

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("deleted");
			});
			onEvent.mockClear();

			fs.mkdirSync(secondDir, { recursive: true });
			fs.writeFileSync(filePath, "content");

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
			onEvent.mockClear();

			fs.rmSync(firstDir, { force: true, recursive: true });

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("deleted");
			});
			onEvent.mockClear();

			fs.mkdirSync(secondDir, { recursive: true });
			fs.writeFileSync(filePath, "content");

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
		});

		it("disposes file watchers", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "disposed.txt");
			const onEvent = vi.fn();
			{
				using _ = host.watchFile(filePath, onEvent);
			}

			fs.writeFileSync(filePath, "content");

			await sleep(50);
			expect(onEvent).not.toHaveBeenCalled();
		});

		it("disposes file watchers after created", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "disposed.txt");
			const onEvent = vi.fn();
			{
				using _ = host.watchFile(filePath, onEvent, 10);
				await sleep(50);
				fs.writeFileSync(filePath, "first");
				await vi.waitFor(() => {
					expect(onEvent).toHaveBeenCalledWith("created");
				});
			}
			onEvent.mockClear();

			fs.writeFileSync(filePath, "second");
			await sleep(50);
			expect(onEvent).not.toHaveBeenCalled();
		});

		it("disposes file watchers after deleted", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const filePath = path.join(integrationRoot, "disposed.txt");
			const onEvent = vi.fn();
			fs.writeFileSync(filePath, "first");
			{
				using _ = host.watchFile(filePath, onEvent, 10);
				await sleep(50);
				fs.rmSync(filePath);
				await vi.waitFor(() => {
					expect(onEvent).toHaveBeenCalledWith("deleted");
				});
			}
			onEvent.mockClear();

			fs.writeFileSync(filePath, "second");
			await sleep(50);
			expect(onEvent).not.toHaveBeenCalled();
		});

		it("ignores other files", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const targetPath = path.join(integrationRoot, "target.txt");
			const otherPath = path.join(integrationRoot, "other.txt");
			const onEvent = vi.fn();
			using _ = host.watchFile(targetPath, onEvent, 10);

			await sleep(50);

			fs.writeFileSync(otherPath, "content");

			await sleep(50);
			expect(onEvent).not.toHaveBeenCalledWith();
		});

		it("watches directory", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const dirPath = path.join(integrationRoot, "directory");
			const onEvent = vi.fn();
			fs.mkdirSync(dirPath, { recursive: true });
			using _ = host.watchFile(dirPath, onEvent, 10);

			await sleep(50);

			fs.rmSync(dirPath, { force: true, recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("deleted");
			});
			onEvent.mockClear();

			fs.mkdirSync(dirPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith("created");
			});
		});

		it("does not report child file changes when watches directory", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const dirPath = path.join(integrationRoot, "directory");
			const filePath = path.join(dirPath, "file.txt");
			const onEvent = vi.fn();
			fs.mkdirSync(dirPath, { recursive: true });
			using _ = host.watchFile(dirPath, onEvent, 10);

			await sleep(50);

			fs.writeFileSync(filePath, "content");
			await sleep(50);
			expect(onEvent).not.toHaveBeenCalled();
		});
	});

	describe("watchDirectory", () => {
		it("watches directories non-recursively", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "dir");
			const nestedPath = path.join(directoryPath, "nested");
			fs.mkdirSync(nestedPath, { recursive: true });

			const onEvent = vi.fn();
			using _ = host.watchDirectory(directoryPath, false, onEvent);

			await sleep(50);

			const nestedFile = path.join(nestedPath, "nested.txt");
			const directFile = path.join(directoryPath, "direct.txt");
			fs.writeFileSync(nestedFile, "nested");
			fs.writeFileSync(directFile, "direct");

			const normalizedDirect = normalizePath(
				directFile,
				host.isCaseSensitiveFS(),
			);

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedDirect);
			});
		});

		it("watches directories recursively", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "dir");
			const nestedPath = path.join(directoryPath, "nested");
			fs.mkdirSync(nestedPath, { recursive: true });
			fs.writeFileSync(path.join(directoryPath, "existing.txt"), "content");
			const onEvent = vi.fn();
			using _ = host.watchDirectory(directoryPath, true, onEvent);

			await sleep(50);

			const nestedFile = path.join(nestedPath, "nested.txt");
			fs.writeFileSync(nestedFile, "nested");

			const normalizedNested = normalizePath(
				nestedFile,
				host.isCaseSensitiveFS(),
			);

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedNested);
			});
		});

		it("ignores .git directories within watched paths", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const baseDir = path.join(integrationRoot, "base-git");
			fs.mkdirSync(baseDir, { recursive: true });
			const onEvent = vi.fn();
			using _ = host.watchDirectory(baseDir, true, onEvent);

			await sleep(50);

			fs.mkdirSync(path.join(baseDir, ".git"), { recursive: true });
			fs.writeFileSync(path.join(baseDir, ".git", "config"), "content");
			fs.writeFileSync(path.join(baseDir, "src.txt"), "content");

			const normalizedFile = normalizePath(
				path.join(baseDir, "src.txt"),
				host.isCaseSensitiveFS(),
			);
			await sleep(50);
			expect(onEvent).toHaveBeenCalledWith(normalizedFile);
		});

		it("ignores node_modules directories within watched paths", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const baseDir = path.join(integrationRoot, "base-node-modules");
			fs.mkdirSync(baseDir, { recursive: true });
			const onEvent = vi.fn();
			using _ = host.watchDirectory(baseDir, true, onEvent);

			await sleep(50);

			fs.mkdirSync(path.join(baseDir, "node_modules", "pkg"), {
				recursive: true,
			});
			fs.writeFileSync(
				path.join(baseDir, "node_modules", "pkg", "index.js"),
				"content",
			);
			fs.writeFileSync(path.join(baseDir, "src.txt"), "content");

			const normalizedFile = normalizePath(
				path.join(baseDir, "src.txt"),
				host.isCaseSensitiveFS(),
			);
			await sleep(50);
			expect(onEvent).toHaveBeenCalledWith(normalizedFile);
		});

		it("does not ignore lookalike names such as .gitignore", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const baseDir = path.join(integrationRoot, "lookalike");
			fs.mkdirSync(baseDir, { recursive: true });
			const onEvent = vi.fn();
			using _ = host.watchDirectory(baseDir, true, onEvent);

			await sleep(50);

			const filePath = path.join(baseDir, ".gitignore");
			fs.writeFileSync(filePath, "content");

			const normalizedFile = normalizePath(filePath, host.isCaseSensitiveFS());
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedFile);
			});
		});

		it("emits when watching directory is created", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "recreate-dir");
			const normalizedDirectory = normalizePath(
				directoryPath,
				host.isCaseSensitiveFS(),
			);
			const onEvent = vi.fn();
			using _ = host.watchDirectory(directoryPath, false, onEvent, 10);

			await sleep(50);

			fs.mkdirSync(directoryPath, { recursive: true });

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedDirectory);
			});
		});

		it("emits when watching directory is deleted", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "recreate-dir");
			const normalizedDirectory = normalizePath(
				directoryPath,
				host.isCaseSensitiveFS(),
			);
			const onEvent = vi.fn();
			fs.mkdirSync(directoryPath, { recursive: true });

			using _ = host.watchDirectory(directoryPath, false, onEvent, 10);

			await sleep(50);

			fs.rmSync(directoryPath, { force: true, recursive: true });

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedDirectory);
			});
		});

		it("don't reattach watchers on child deletion", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "recreate-dir");
			const onEvent = vi.fn();
			fs.mkdirSync(directoryPath, { recursive: true });

			const firstFile = path.join(directoryPath, "first.txt");
			fs.writeFileSync(firstFile, "first");
			const normalizedFirst = normalizePath(
				firstFile,
				host.isCaseSensitiveFS(),
			);
			const secondFile = path.join(directoryPath, "second.txt");
			fs.writeFileSync(secondFile, "second");
			const normalizedSecond = normalizePath(
				secondFile,
				host.isCaseSensitiveFS(),
			);

			using _ = host.watchDirectory(directoryPath, false, onEvent, 10);

			await sleep(50);

			fs.rmSync(firstFile);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedFirst);
			});
			onEvent.mockClear();

			fs.rmSync(secondFile);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedSecond);
			});
			onEvent.mockClear();
		});

		it("reattaches watchers after deletion and recreation", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = path.join(integrationRoot, "recreate-dir");
			const onEvent = vi.fn();
			fs.mkdirSync(directoryPath, { recursive: true });
			using _ = host.watchDirectory(directoryPath, false, onEvent, 10);

			await sleep(50);

			const firstFile = path.join(directoryPath, "first.txt");
			fs.writeFileSync(firstFile, "first");

			const normalizedFirst = normalizePath(
				firstFile,
				host.isCaseSensitiveFS(),
			);

			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedFirst);
			});
			onEvent.mockClear();

			fs.rmSync(directoryPath, { force: true, recursive: true });

			const normalizedDirectory = normalizePath(
				directoryPath,
				host.isCaseSensitiveFS(),
			);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedDirectory);
			});
			onEvent.mockClear();

			fs.mkdirSync(directoryPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedDirectory);
			});
			onEvent.mockClear();

			const secondFile = path.join(directoryPath, "second.txt");
			fs.writeFileSync(secondFile, "second");

			const normalizedSecond = normalizePath(
				secondFile,
				host.isCaseSensitiveFS(),
			);
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(normalizedSecond);
			});
		});

		it("correctly reports when dir and its child have the same name", async () => {
			const host = createDiskBackedLinterHost(integrationRoot);
			const directoryPath = normalizePath(
				path.join(integrationRoot, "dir"),
				host.isCaseSensitiveFS(),
			);
			const subDirectoryPath = normalizePath(
				path.join(directoryPath, "dir"),
				host.isCaseSensitiveFS(),
			);
			const onEvent = vi.fn();
			using _ = host.watchDirectory(directoryPath, false, onEvent, 10);

			await sleep(50);

			fs.mkdirSync(directoryPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(directoryPath);
			});
			onEvent.mockClear();

			fs.mkdirSync(subDirectoryPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(subDirectoryPath);
			});
			onEvent.mockClear();

			fs.rmSync(subDirectoryPath, { force: true, recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(subDirectoryPath);
			});
			onEvent.mockClear();

			fs.rmSync(directoryPath, { force: true, recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(directoryPath);
			});
			onEvent.mockClear();

			fs.mkdirSync(subDirectoryPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(directoryPath);
			});
			onEvent.mockClear();

			fs.rmSync(directoryPath, { recursive: true });
			await vi.waitFor(() => {
				expect(onEvent).toHaveBeenCalledWith(directoryPath);
			});
			onEvent.mockClear();
		});
	});
});
