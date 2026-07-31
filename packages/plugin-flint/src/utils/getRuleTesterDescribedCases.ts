import type { AST } from "@flint.fyi/typescript-language";
import { isTruthy } from "@flint.fyi/utils";

import { getRuleTesterCaseArrays } from "./getRuleTesterCaseArrays.ts";
import { parseTestCase, parseTestCaseInvalid } from "./parseTestCases.ts";
import type { ParsedTestCase, ParsedTestCaseInvalid } from "./types.ts";

export interface RuleTesterDescribedCases {
	invalid: ParsedTestCaseInvalid[];
	valid: ParsedTestCase[];
}

export function getRuleTesterDescribedCases(
	node: AST.CallExpression,
): RuleTesterDescribedCases | undefined {
	const arrays = getRuleTesterCaseArrays(node);
	if (!arrays) {
		return;
	}

	return {
		invalid: arrays.invalid.elements.map(parseTestCaseInvalid).filter(isTruthy),
		valid: arrays.valid.elements.map(parseTestCase).filter(isTruthy),
	};
}
