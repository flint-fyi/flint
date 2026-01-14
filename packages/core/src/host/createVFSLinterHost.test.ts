// flint-disable-file unnecessaryBlocks
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "./createVFSLinterHost.ts";

/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_$" }] */
/* eslint-disable @typescript-eslint/no-empty-function */

describe(createVFSLinterHost, () => {
	it("normalizes cwd", () => {
		const host = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/root/../root2/",
		});

		expect(host.getCurrentDirectory()).toEqual("/root2");
		expect(host.isCaseSensitiveFS()).toEqual(true);
	});

	it("normalizes cwd case-insensitively", () => {
		const host = createVFSLinterHost({
			caseSensitive: false,
			cwd: "C:\\HELLO\\world\\",
		});

		expect(host.getCurrentDirectory()).toEqual("c:/hello/world");
		expect(host.isCaseSensitiveFS()).toEqual(false);
	});

	it("inherits cwd and case sensitivity from base host", () => {
		const baseHost = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/root",
		});
		const host = createVFSLinterHost({ baseHost });

		expect(host.getCurrentDirectory()).toEqual("/root");
		expect(host.isCaseSensitiveFS()).toEqual(true);
	});

	describe("stat", () => {
		it("existing file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			host.vfsUpsertFile("/root/file.ts", "content");
			host.vfsUpsertFile("/root/nested/file.ts", "content");

			expect(host.stat("/root/file.ts")).toEqual("file");
			expect(host.stat("/root/nested/file.ts")).toEqual("file");
		});

		it("existing directory", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			host.vfsUpsertFile("/root/nested/file.ts", "content");

			expect(host.stat("/root/nested")).toEqual("directory");
		});

		it("non-existent file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.stat("/root/missing")).toBeUndefined();
		});

		it("propagates to base host", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			const host = createVFSLinterHost({ baseHost });

			baseHost.vfsUpsertFile("/root/file.ts", "content");

			expect(host.stat("/root/file.ts")).toEqual("file");
		});

		it("prefers overlay file over base dir", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			const host = createVFSLinterHost({ baseHost });

			baseHost.vfsUpsertFile("/root/file.ts/file.ts", "content");
			host.vfsUpsertFile("/root/file.ts", "content");

			expect(host.stat("/root/file.ts")).toEqual("file");
		});

		it("prefers overlay dir over base file", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			const host = createVFSLinterHost({ baseHost });

			baseHost.vfsUpsertFile("/root/file.ts", "content");
			host.vfsUpsertFile("/root/file.ts/file.ts", "content");

			expect(host.stat("/root/file.ts")).toEqual("directory");
		});
	});

	describe("readFile", () => {
		it("returns undefined when reading a missing file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.readFile("/root/missing.txt")).toBeUndefined();
		});

		it("reads existing file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/file.ts", "content");

			expect(host.readFile("/root/file.ts")).toEqual("content");
		});

		it("propagates to base host", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/base.txt", "base");

			const host = createVFSLinterHost({ baseHost });

			expect(host.readFile("/root/base.txt")).toEqual("base");
		});

		it("prefers overlay over base", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/file.txt", "base");

			const host = createVFSLinterHost({ baseHost });
			host.vfsUpsertFile("/root/file.txt", "vfs");

			expect(host.readFile("/root/file.txt")).toEqual("vfs");
		});

		it("returns undefined when reading directory", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/nested/file.txt", "vfs");

			expect(host.readFile("/root/nested")).toBeUndefined();
		});
	});

	describe("readDirectory", () => {
		it("skips non-matching files when reading a directory", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/other/file.txt", "content");

			expect(host.readDirectory("/root/dir")).toEqual([]);
		});

		it("returns nothing when reading file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/file.txt", "content");

			expect(host.readDirectory("/root/file.txt")).toEqual([]);
		});

		it("lists files", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/file.txt", "content");
			host.vfsUpsertFile("/root/sub/file.txt", "content");

			expect(host.readDirectory("/root")).toEqual([
				{
					name: "file.txt",
					type: "file",
				},
				{
					name: "sub",
					type: "directory",
				},
			]);
		});

		it("filters out duplicates", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/file.txt", "base");
			baseHost.vfsUpsertFile("/root/sub/file.txt", "base");

			const host = createVFSLinterHost({ baseHost });
			host.vfsUpsertFile("/root/file.txt", "vfs");
			host.vfsUpsertFile("/root/sub/file.txt", "vfs");

			const entries = host.readDirectory("/root");

			expect(entries).toEqual([
				{
					name: "file.txt",
					type: "file",
				},
				{
					name: "sub",
					type: "directory",
				},
			]);
		});

		it("propagates from base", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/base.txt", "base");
			baseHost.vfsUpsertFile("/root/base-sub/file.txt", "base");

			const host = createVFSLinterHost({ baseHost });
			host.vfsUpsertFile("/root/vfs.txt", "vfs");
			host.vfsUpsertFile("/root/vfs-sub/file.txt", "vfs");

			const entries = host.readDirectory("/root");

			expect(entries).toEqual([
				{
					name: "vfs.txt",
					type: "file",
				},
				{
					name: "vfs-sub",
					type: "directory",
				},
				{
					name: "base.txt",
					type: "file",
				},
				{
					name: "base-sub",
					type: "directory",
				},
			]);
		});

		it("prefers overlay file over base dir", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/file.txt/file.txt", "base");

			const host = createVFSLinterHost({ baseHost });
			host.vfsUpsertFile("/root/file.txt", "vfs");

			const entries = host.readDirectory("/root");

			expect(entries).toEqual([
				{
					name: "file.txt",
					type: "file",
				},
			]);
		});

		it("prefers overlay dir over base file", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			baseHost.vfsUpsertFile("/root/file.txt", "base");

			const host = createVFSLinterHost({ baseHost });
			host.vfsUpsertFile("/root/file.txt/file.txt", "host");

			const entries = host.readDirectory("/root");

			expect(entries).toEqual([
				{
					name: "file.txt",
					type: "directory",
				},
			]);
		});
	});

	describe("vfsUpsertFile", () => {
		it("creates file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.vfsListFiles()).toEqual(new Map());

			host.vfsUpsertFile("/root/file.txt", "content");

			expect(host.vfsListFiles()).toEqual(
				new Map([["/root/file.txt", "content"]]),
			);
		});

		it("updates file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.vfsListFiles()).toEqual(new Map());

			host.vfsUpsertFile("/root/file.txt", "content");
			host.vfsUpsertFile("/root/file.txt", "new content");

			expect(host.vfsListFiles()).toEqual(
				new Map([["/root/file.txt", "new content"]]),
			);
		});
	});

	describe("vfsDeleteFile", () => {
		it("deletes file", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.vfsListFiles()).toEqual(new Map());

			host.vfsUpsertFile("/root/file.txt", "content");
			host.vfsDeleteFile("/root/file.txt");

			expect(host.vfsListFiles()).toEqual(new Map());
		});

		it("does nothing when file does not exist", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

			expect(host.vfsListFiles()).toEqual(new Map());

			host.vfsUpsertFile("/root/file.txt", "content");
			host.vfsDeleteFile("/root/file2.txt");

			expect(host.vfsListFiles()).toEqual(
				new Map([["/root/file.txt", "content"]]),
			);
		});
	});

	describe("watchFile", () => {
		it("reports creation", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const onEvent = vi.fn();

			using _ = host.watchFile("/root/file.txt", onEvent);
			expect(onEvent).not.toHaveBeenCalled();
			host.vfsUpsertFile("/root/file.txt", "content");
			expect(onEvent).toHaveBeenCalledExactlyOnceWith("created");
		});

		it("reports editing", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const onEvent = vi.fn();

			host.vfsUpsertFile("/root/file.txt", "content");
			using _ = host.watchFile("/root/file.txt", onEvent);

			expect(onEvent).not.toHaveBeenCalled();

			host.vfsUpsertFile("/root/file.txt", "new content");

			expect(onEvent).toHaveBeenCalledExactlyOnceWith("changed");
		});

		it("reports deletion", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const onEvent = vi.fn();

			host.vfsUpsertFile("/root/file.txt", "content");
			using _ = host.watchFile("/root/file.txt", onEvent);

			expect(onEvent).not.toHaveBeenCalled();

			host.vfsDeleteFile("/root/file.txt");

			expect(onEvent).toHaveBeenCalledExactlyOnceWith("deleted");
		});

		it("disposes onEvent", () => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const onEvent = vi.fn();

			{
				using _ = host.watchFile("/root/file.txt", onEvent);
			}
			host.vfsUpsertFile("/root/file.txt", "content");

			expect(onEvent).not.toHaveBeenCalled();
		});

		it("propagates base host events", () => {
			const baseHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			const host = createVFSLinterHost({ baseHost });
			const onEvent = vi.fn();

			using _ = host.watchFile("/root/file.txt", onEvent);
			expect(onEvent).not.toHaveBeenCalled();

			baseHost.vfsUpsertFile("/root/file.txt", "content");

			expect(onEvent).toHaveBeenCalledExactlyOnceWith("created");
		});

		it("propagates correct params to base host watcher", () => {
			const baseHost = {
				...createVFSLinterHost({ caseSensitive: true, cwd: "/root" }),
				watchFile: vi.fn(() => ({ [Symbol.dispose]() {} })),
			};
			const host = createVFSLinterHost({ baseHost });

			using _ = host.watchFile("/root/file.txt", () => {}, 555);

			expect(baseHost.watchFile).toHaveBeenCalledExactlyOnceWith(
				"/root/file.txt",
				expect.any(Function),
				555,
			);
		});

		it("disposes base host watcher", () => {
			const dispose = vi.fn();
			const baseHost = {
				...createVFSLinterHost({ caseSensitive: true, cwd: "/root" }),
				watchFile: () => ({ [Symbol.dispose]: dispose }),
			};
			const host = createVFSLinterHost({ baseHost });

			{
				using _ = host.watchFile("/root/file.txt", () => {});
				expect(dispose).not.toHaveBeenCalled();
			}

			expect(dispose).toHaveBeenCalledExactlyOnceWith();
		});
	});

	describe("watchDirectory", () => {
		describe("non-recursive", () => {
			it("reports file creation", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				using _ = host.watchDirectory("/root", false, onEvent);
				host.vfsUpsertFile("/root/file.txt", "content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root/file.txt");
			});

			it("reports directory creation", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				using _ = host.watchDirectory("/root", false, onEvent);
				host.vfsUpsertFile("/root/dir/file.txt", "content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root/dir");
			});

			it("reports directory creation 2", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				using _ = host.watchDirectory("/", false, onEvent);
				host.vfsUpsertFile("/root/dir/file.txt", "content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root");
			});

			it("reports file creation win32", () => {
				const host = createVFSLinterHost({
					caseSensitive: false,
					cwd: "C:/",
				});
				const onEvent = vi.fn();

				using _ = host.watchDirectory("C:\\", false, onEvent);
				host.vfsUpsertFile("C:\\file.txt", "content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith("c:/file.txt");
			});

			it("reports file editing", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				host.vfsUpsertFile("/root/file.txt", "content");
				using _ = host.watchDirectory("/root", false, onEvent);
				expect(onEvent).not.toHaveBeenCalled();

				host.vfsUpsertFile("/root/file.txt", "new content");
				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root/file.txt");
			});

			it("reports file deletion", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				host.vfsUpsertFile("/root/file.txt", "content");
				using _ = host.watchDirectory("/root", false, onEvent);
				expect(onEvent).not.toHaveBeenCalled();

				host.vfsDeleteFile("/root/file.txt");
				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root/file.txt");
			});

			it("reports directory deletion", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				host.vfsUpsertFile("/root/nested/file.txt", "content");
				using _ = host.watchDirectory("/root", false, onEvent);
				expect(onEvent).not.toHaveBeenCalled();

				host.vfsDeleteFile("/root/nested/file.txt");
				expect(onEvent).toHaveBeenCalledExactlyOnceWith("/root/nested");
			});
		});

		describe("recursive", () => {
			it("reports file creation", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				using _ = host.watchDirectory("/root", true, onEvent);

				host.vfsUpsertFile("/root/nested/file.txt", "content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith(
					"/root/nested/file.txt",
				);
			});

			it("reports file editing", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				host.vfsUpsertFile("/root/nested/file.txt", "content");
				using _ = host.watchDirectory("/root", true, onEvent);
				expect(onEvent).not.toHaveBeenCalled();

				host.vfsUpsertFile("/root/nested/file.txt", "new content");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith(
					"/root/nested/file.txt",
				);
			});

			it("reports file deletion", () => {
				const host = createVFSLinterHost({
					caseSensitive: true,
					cwd: "/root",
				});
				const onEvent = vi.fn();

				host.vfsUpsertFile("/root/nested/file.txt", "content");
				using _ = host.watchDirectory("/root", true, onEvent);
				expect(onEvent).not.toHaveBeenCalled();

				host.vfsDeleteFile("/root/nested/file.txt");

				expect(onEvent).toHaveBeenCalledExactlyOnceWith(
					"/root/nested/file.txt",
				);
			});
		});

		it("propagates correct params to base host watcher", () => {
			const baseHost = {
				...createVFSLinterHost({ caseSensitive: true, cwd: "/root" }),
				watchDirectory: vi.fn(() => ({ [Symbol.dispose]() {} })),
			};
			const host = createVFSLinterHost({ baseHost });

			using _ = host.watchDirectory("/root/file.txt", false, () => {}, 555);

			expect(baseHost.watchDirectory).toHaveBeenCalledExactlyOnceWith(
				"/root/file.txt",
				false,
				expect.any(Function),
				555,
			);
		});

		it("disposes base host watcher", () => {
			const dispose = vi.fn();
			const baseHost = {
				...createVFSLinterHost({ caseSensitive: true, cwd: "/root" }),
				watchDirectory: () => ({ [Symbol.dispose]: dispose }),
			};
			const host = createVFSLinterHost({ baseHost });

			{
				using _ = host.watchDirectory("/root/file.txt", false, () => {});
				expect(dispose).not.toHaveBeenCalled();
			}

			expect(dispose).toHaveBeenCalledExactlyOnceWith();
		});
	});
});

/* eslint-enable @typescript-eslint/no-empty-function */
