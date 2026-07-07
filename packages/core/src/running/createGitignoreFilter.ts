import path from "node:path";

import ignore from "ignore";

import type { LinterHost } from "../types/host.ts";

export function createGitignoreFilter(host: LinterHost) {
	const cwd = host.getCurrentDirectory();
	const matchers = new Map<string, ignore.Ignore | undefined>();

	function matcherForDirectory(directory: string) {
		if (matchers.has(directory)) {
			return matchers.get(directory);
		}

		let matcher: ignore.Ignore | undefined;
		const gitignorePath = path.posix.join(directory, ".gitignore");
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
		let directory = path.posix.dirname(pathAbsolute);
		while (directory.startsWith(cwd)) {
			const matcher = matcherForDirectory(directory);
			if (matcher) {
				const relative =
					path.posix.relative(directory, pathAbsolute) +
					(isDirectory ? "/" : "");
				const result = matcher.test(relative);
				if (result.ignored || result.unignored) {
					return result.ignored;
				}
			}
			if (directory === cwd) {
				break;
			}
			directory = path.posix.dirname(directory);
		}
		return false;
	}

	return (filePathAbsolute: string) => {
		let current = filePathAbsolute;
		let isDirectory = false;
		while (current.startsWith(cwd) && current !== cwd) {
			if (isPathIgnored(current, isDirectory)) {
				return false;
			}
			current = path.posix.dirname(current);
			isDirectory = true;
		}
		return true;
	};
}
