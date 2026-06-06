import type { AnyNode } from "@humanwhocodes/momoa";

import type { CharacterReportRange } from "@flint.fyi/core";

export function getJsonNodeRange(node: AnyNode): CharacterReportRange {
	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we're opting into ranges
		begin: node.range![0],
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we're opting into ranges
		end: node.range![1],
	};
}
