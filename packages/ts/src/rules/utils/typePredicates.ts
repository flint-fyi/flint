import {
	TypeFlags,
	type Type,
	type TypeReference,
} from "typescript-native/unstable/sync";

import type { Checker } from "@flint.fyi/typescript-language";

export function isIntrinsicErrorType(type: Type): boolean {
	return type.isIntrinsicType() && type.intrinsicName === "error";
}

export function isTypeAny(type: Type): boolean {
	return isTypeFlagSet(type, TypeFlags.Any) && !isIntrinsicErrorType(type);
}

export function isTypeAnyArray(type: Type, typeChecker: Checker): boolean {
	if (!typeChecker.isArrayType(type)) {
		return false;
	}

	const elementType = typeChecker.getTypeArguments(type as TypeReference)[0];
	return elementType !== undefined && isTypeAny(elementType);
}

export function isTypeAnyOrUnknown(type: Type): boolean {
	return isTypeFlagSet(type, TypeFlags.Any | TypeFlags.Unknown);
}

export function isTypeFlagSet(type: Type, flags: TypeFlags): boolean {
	return (type.flags & flags) !== 0;
}
