import type { AST } from "@flint.fyi/typescript-language";
import { isTruthy } from "@flint.fyi/utils";

import { getRuleTesterCaseArrays } from "./getRuleTesterCaseArrays.ts";
import { parseTestCase, parseTestCaseInvalid } from "./parseTestCases.ts";

export function getRuleTesterDescribedCases(node: AST.CallExpression) {
	const arrays = getRuleTesterCaseArrays(node);
	if (!arrays) {
		return undefined;
	}

	return {
		invalid: arrays.invalid.elements.map(parseTestCaseInvalid).filter(isTruthy),
		valid: arrays.valid.elements.map(parseTestCase).filter(isTruthy),
	};
}
