import { getTypeProperty, type Checker } from "@flint.fyi/typescript-language";
import {
	TypeFlags,
	type Type,
	type TypeReference,
} from "@flint.fyi/typescript-language/native/sync";
import { nullThrows } from "@flint.fyi/utils";

import { getTypeConstituents } from "./typeConstituents.ts";

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
export function discriminateAnyType(type: Type, typeChecker: Checker): AnyType {
	return discriminateAnyTypeWorker(type, typeChecker, new Set());
}

function discriminateAnyTypeWorker(
	type: Type,
	typeChecker: Checker,
	visited: Set<number>,
): AnyType {
	if (visited.has(type.id)) {
		return AnyType.Safe;
	}
	visited.add(type.id);
	if (type.flags & TypeFlags.Any) {
		return type.isErrorType() ? AnyType.Error : AnyType.Any;
	}
	if (typeChecker.isArrayType(type)) {
		const elementType = nullThrows(
			typeChecker.getTypeArguments(type as TypeReference)[0],
			"Array type should have at least one type argument",
		);
		if (elementType.flags & TypeFlags.Any && !elementType.isErrorType()) {
			return AnyType.AnyArray;
		}
	}
	for (const part of getTypeConstituents(type)) {
		if (!getTypeProperty(typeChecker.getApparentType(part), "then")) {
			continue;
		}

		const awaitedType = typeChecker.getAwaitedType(part);
		if (
			awaitedType &&
			discriminateAnyTypeWorker(awaitedType, typeChecker, visited) ===
				AnyType.Any &&
			!awaitedType.isErrorType()
		) {
			return AnyType.PromiseAny;
		}
	}

	return AnyType.Safe;
}
