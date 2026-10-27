import ignore from "ignore";
import { dirname, join, relative } from "pathe";

import type { LinterHost } from "../types/host.ts";

export type GitignoreFilter = (filePathAbsolute: string) => boolean;

export function createGitignoreFilter(host: LinterHost): GitignoreFilter {
	const cwd = host.getCurrentDirectory();
	const matchers = new Map<string, ignore.Ignore | undefined>();
	const includedPaths = new Map<string, boolean>();

	function matcherForDirectory(directory: string) {
		if (matchers.has(directory)) {
			return matchers.get(directory);
		}

		let matcher: ignore.Ignore | undefined;
		const gitignorePath = join(directory, ".gitignore");
		if (host.fileTypeSync(gitignorePath) === "file") {
			const content = host.readFileSync(gitignorePath);
			if (content !== undefined) {
				matcher = ignore().add(content);
			}
		}

		matchers.set(directory, matcher);
		return matcher;
	}

	function isPathIgnored(pathAbsolute: string, isDirectory: boolean) {
		let directory = dirname(pathAbsolute);
		while (directory.startsWith(cwd)) {
			const matcher = matcherForDirectory(directory);
			if (matcher) {
				const relativePath =
					relative(directory, pathAbsolute) + (isDirectory ? "/" : "");
				const result = matcher.test(relativePath);
				if (result.ignored || result.unignored) {
					return result.ignored;
				}
			}
			if (directory === cwd) {
				break;
			}
			directory = dirname(directory);
		}
		return false;
	}

	return (filePathAbsolute: string) => {
		let current = filePathAbsolute;
		let isDirectory = false;
		let included = true;
		const uncheckedPaths: string[] = [];
		while (current.startsWith(cwd) && current !== cwd) {
			const key = current + (isDirectory ? "/" : "");
			const cached = includedPaths.get(key);
			if (cached !== undefined) {
				included = cached;
				break;
			}
			uncheckedPaths.push(key);
			if (isPathIgnored(current, isDirectory)) {
				included = false;
				break;
			}
			current = dirname(current);
			isDirectory = true;
		}
		for (const key of uncheckedPaths) {
			includedPaths.set(key, included);
		}
		return included;
	};
}
