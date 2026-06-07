import type { CssNode } from "css-tree";

import type { CharacterReportRange } from "@flint.fyi/core";

export function getCssNodeRange(node: CssNode): CharacterReportRange {
	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		begin: node.loc!.start.offset,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		end: node.loc!.end.offset,
	};
}
