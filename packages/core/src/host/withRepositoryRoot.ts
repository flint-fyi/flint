import { normalizePath } from "@flint.fyi/utils";

import type { LinterHost } from "../types/host.ts";

export function withRepositoryRoot(
	host: LinterHost,
	repositoryRoot: string,
): LinterHost {
	const normalizedRepositoryRoot = normalizePath(repositoryRoot);

	return {
		...host,
		getRepositoryRoot: () => normalizedRepositoryRoot,
	};
}
