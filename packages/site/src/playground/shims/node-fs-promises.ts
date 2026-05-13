/**
 * Browser shim for `node:fs/promises`. Flint uses this for two things in the
 * lint pipeline:
 *
 *   - `fs.glob(...)` in `computeUseDefinitions` to enumerate workspace files.
 *   - `fs.mkdir` / `fs.writeFile` in `writeToCache` to persist a cache file.
 *
 * The worker drives Flint over an in-memory VFS, so we route `glob` through a
 * registered file lister and no-op the cache writer.
 */

type FileLister = () => ReadonlyMap<string, string>;

let vfsListFiles: FileLister | undefined;

interface DirentLike {
	isDirectory(): boolean;
	isFile(): boolean;
	name: string;
	parentPath: string;
}

interface GlobOptions {
	cwd?: string;
	exclude?: ((path: string) => boolean) | string[];
	withFileTypes?: boolean;
}

export async function* glob(
	patterns: string | string[],
	options: GlobOptions = {},
): AsyncGenerator<DirentLike, void, void> {
	const files = vfsListFiles?.() ?? new Map<string, string>();
	const cwd = options.cwd ?? "/";
	const cwdSlash = cwd.endsWith("/") ? cwd : `${cwd}/`;
	const patternList = Array.isArray(patterns) ? patterns : [patterns];
	const matchers = patternList.map(toMatcher);

	const exclude = options.exclude;
	const excludeFn =
		typeof exclude === "function"
			? exclude
			: Array.isArray(exclude)
				? (relPath: string) => exclude.some((pat) => toMatcher(pat)(relPath))
				: () => false;

	for (const absolutePath of files.keys()) {
		if (!absolutePath.startsWith(cwdSlash)) {
			continue;
		}
		const relativePath = absolutePath.slice(cwdSlash.length);
		if (!matchers.some((m) => m(relativePath))) {
			continue;
		}
		if (excludeFn(relativePath)) {
			continue;
		}

		const lastSlash = absolutePath.lastIndexOf("/");
		yield {
			isDirectory: () => false,
			isFile: () => true,
			name: absolutePath.slice(lastSlash + 1),
			parentPath: absolutePath.slice(0, lastSlash),
		};
	}
}

export async function mkdir(): Promise<void> {
	// No-op: cache writes to a non-existent virtual filesystem.
}

export async function readFile(): Promise<string> {
	throw unimplemented("readFile");
}

export function registerVFSFiles(lister: FileLister): void {
	vfsListFiles = lister;
}

export async function writeFile(): Promise<void> {
	// No-op: same reason as mkdir.
}

function unimplemented(name: string): Error {
	return new Error(
		`node:fs/promises.${name} is not implemented in the playground worker.`,
	);
}

// Throwing stubs for the rest. These exist purely to satisfy Rollup's static
// export checks when Astro/cspell internals get bundled into the same chunk
// graph as the worker entry — they're not expected to be called at runtime.
export const access = (): Promise<void> => {
	throw unimplemented("access");
};
export const appendFile = writeFile;
export const chmod = (): Promise<void> => {
	throw unimplemented("chmod");
};
export const chown = (): Promise<void> => {
	throw unimplemented("chown");
};
export const copyFile = (): Promise<void> => {
	throw unimplemented("copyFile");
};
export const cp = (): Promise<void> => {
	throw unimplemented("cp");
};
export const lchmod = (): Promise<void> => {
	throw unimplemented("lchmod");
};
export const lchown = (): Promise<void> => {
	throw unimplemented("lchown");
};
export const link = (): Promise<void> => {
	throw unimplemented("link");
};
export const lstat = (): Promise<void> => {
	throw unimplemented("lstat");
};
export const opendir = (): Promise<void> => {
	throw unimplemented("opendir");
};
export const readdir = async (): Promise<string[]> => [];
export const readlink = (): Promise<void> => {
	throw unimplemented("readlink");
};
export const realpath = async (path: string): Promise<string> => path;
export const rename = (): Promise<void> => {
	throw unimplemented("rename");
};
export const rm = (): Promise<void> => {
	throw unimplemented("rm");
};
export const rmdir = (): Promise<void> => {
	throw unimplemented("rmdir");
};
export const stat = (): Promise<void> => {
	throw unimplemented("stat");
};
export const symlink = (): Promise<void> => {
	throw unimplemented("symlink");
};
export const truncate = (): Promise<void> => {
	throw unimplemented("truncate");
};
export const unlink = (): Promise<void> => {
	throw unimplemented("unlink");
};
export const utimes = (): Promise<void> => {
	throw unimplemented("utimes");
};
export const watch = (): AsyncIterable<unknown> => {
	throw unimplemented("watch");
};

const fsPromises = {
	access,
	appendFile,
	chmod,
	chown,
	copyFile,
	cp,
	glob,
	lchmod,
	lchown,
	link,
	lstat,
	mkdir,
	opendir,
	readdir,
	readFile,
	readlink,
	realpath,
	registerVFSFiles,
	rename,
	rm,
	rmdir,
	stat,
	symlink,
	truncate,
	unlink,
	utimes,
	watch,
	writeFile,
};

export default fsPromises;

/**
 * Tiny glob → regex compiler covering the patterns Flint plugins emit:
 *   `**` (any path), `*` (segment), `{a,b,c}` brace alternation, `?` (single
 *   char), and literal extensions like `.{ts,tsx}`.
 */
function toMatcher(pattern: string): (path: string) => boolean {
	let regex = "";
	let i = 0;
	while (i < pattern.length) {
		const c = pattern[i];
		if (c === "*" && pattern[i + 1] === "*") {
			// `**/` matches any number of directories (including zero); `**`
			// alone matches anything.
			if (pattern[i + 2] === "/") {
				regex += "(?:.*/)?";
				i += 3;
			} else {
				regex += ".*";
				i += 2;
			}
			continue;
		}
		if (c === "*") {
			regex += "[^/]*";
			i++;
			continue;
		}
		if (c === "?") {
			regex += "[^/]";
			i++;
			continue;
		}
		if (c === "{") {
			const close = pattern.indexOf("}", i);
			if (close > 0) {
				const opts = pattern
					.slice(i + 1, close)
					.split(",")
					.map((o) => o.replace(/[.+^$()|[\]\\]/g, "\\$&"))
					.join("|");
				regex += `(?:${opts})`;
				i = close + 1;
				continue;
			}
		}
		if (/[.+^$()|[\]\\]/.test(c)) {
			regex += `\\${c}`;
			i++;
			continue;
		}
		regex += c;
		i++;
	}
	const re = new RegExp(`^${regex}$`);
	return (path) => re.test(path);
}
