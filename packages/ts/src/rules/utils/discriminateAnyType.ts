import type ts from "typescript";

import type { Checker } from "@flint.fyi/typescript-language";
import tsutils from "@flint.fyi/typescript-language/ts-api-utils";
import typescript from "@flint.fyi/typescript-language/typescript";
import { nullThrows } from "@flint.fyi/utils";

export const AnyType = {
	Any: "any",
	AnyArray: "any[]",
	Error: "error",
	PromiseAny: "Promise<any>",
	Safe: "safe",
} as const;
export type AnyType = (typeof AnyType)[keyof typeof AnyType];

/**
 * @returns `AnyType.Any` if the type is `any`, `AnyType.AnyArray` if the type is `any[]` or `readonly any[]`, `AnyType.PromiseAny` if the type is `Promise&lt;any>`,
 * `AnyType.Error` if the type is an intrinsic error type, otherwise it returns `AnyType.Safe`.
 */
export function discriminateAnyType(
	type: ts.Type,
	checker: Checker,
	tsNode: ts.Node,
): AnyType {
	return discriminateAnyTypeWorker(type, checker, tsNode, new Set());
}

function discriminateAnyTypeWorker(
	type: ts.Type,
	checker: Checker,
	tsNode: ts.Node,
	visited: Set<ts.Type>,
) {
	if (visited.has(type)) {
		return AnyType.Safe;
	}
	visited.add(type);
	if (tsutils.isTypeFlagSet(type, typescript.TypeFlags.Any)) {
		return tsutils.isIntrinsicErrorType(type) ? AnyType.Error : AnyType.Any;
	}
	if (checker.isArrayType(type)) {
		const elementType = nullThrows(
			checker.getTypeArguments(type)[0],
			"Array type should have at least one type argument",
		);
		if (
			tsutils.isTypeFlagSet(elementType, typescript.TypeFlags.Any) &&
			!tsutils.isIntrinsicErrorType(elementType)
		) {
			return AnyType.AnyArray;
		}
	}
	for (const part of tsutils.typeConstituents(type)) {
		if (tsutils.isThenableType(checker, tsNode, part)) {
			const awaitedType = checker.getAwaitedType(part);
			if (awaitedType) {
				const awaitedAnyType = discriminateAnyTypeWorker(
					awaitedType,
					checker,
					tsNode,
					visited,
				);
				if (
					awaitedAnyType === AnyType.Any &&
					!tsutils.isIntrinsicErrorType(awaitedType)
				) {
					return AnyType.PromiseAny;
				}
			}
		}
	}

	return AnyType.Safe;
}
