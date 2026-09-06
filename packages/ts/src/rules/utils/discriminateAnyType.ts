import type { Node } from "typescript-native/unstable/ast";
import {
	TypeFlags,
	type Type,
	type TypeReference,
} from "typescript-native/unstable/sync";

import type { Checker } from "@flint.fyi/typescript-language";
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
	type: Type,
	typeChecker: Checker,
	tsNode: Node,
): AnyType {
	return discriminateAnyTypeWorker(type, typeChecker, tsNode, new Set());
}

export function getAwaitedTypes(
	type: Type,
	typeChecker: Checker,
	tsNode: Node,
): readonly Type[] {
	return getAwaitedTypesWorker(type, typeChecker, tsNode, new Set());
}

function discriminateAnyTypeWorker(
	type: Type,
	typeChecker: Checker,
	tsNode: Node,
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
	for (const awaitedType of getAwaitedTypes(type, typeChecker, tsNode)) {
		if (
			awaitedType.id !== type.id &&
			discriminateAnyTypeWorker(awaitedType, typeChecker, tsNode, visited) ===
				AnyType.Any &&
			!awaitedType.isErrorType()
		) {
			return AnyType.PromiseAny;
		}
	}
	return AnyType.Safe;
}

function getAwaitedTypesWorker(
	type: Type,
	typeChecker: Checker,
	tsNode: Node,
	visited: Set<number>,
): readonly Type[] {
	if (visited.has(type.id)) {
		return [type];
	}
	visited.add(type.id);

	const awaitedTypes: Type[] = [];
	let hasThenableConstituent = false;
	for (const constituent of getTypeConstituents(type)) {
		const apparentConstituent = typeChecker.getApparentType(constituent);
		const thenSymbol = apparentConstituent.getProperty("then");
		if (!thenSymbol) {
			awaitedTypes.push(constituent);
			continue;
		}

		const thenType = typeChecker.getTypeOfSymbolAtLocation(thenSymbol, tsNode);
		const fulfilledTypes: Type[] = [];
		for (const thenConstituent of getTypeConstituents(thenType)) {
			for (const thenSignature of thenConstituent.getCallSignatures()) {
				const callbackSymbol = thenSignature.getParameters()[0];
				if (!callbackSymbol) {
					continue;
				}

				const callbackType = typeChecker.getTypeOfSymbolAtLocation(
					callbackSymbol,
					tsNode,
				);
				for (const callbackConstituent of getTypeConstituents(callbackType)) {
					for (const callbackSignature of callbackConstituent.getCallSignatures()) {
						const valueSymbol = callbackSignature.getParameters()[0];
						if (valueSymbol) {
							fulfilledTypes.push(
								typeChecker.getTypeOfSymbolAtLocation(valueSymbol, tsNode),
							);
						}
					}
				}
			}
		}

		if (!fulfilledTypes.length) {
			awaitedTypes.push(constituent);
			continue;
		}

		hasThenableConstituent = true;
		awaitedTypes.push(
			...fulfilledTypes.flatMap((fulfilledType) =>
				getAwaitedTypesWorker(
					fulfilledType,
					typeChecker,
					tsNode,
					new Set(visited),
				),
			),
		);
	}

	return hasThenableConstituent ? awaitedTypes : [type];
}

function getTypeConstituents(type: Type): readonly Type[] {
	if (type.isUnionType() || type.isIntersectionType()) {
		return type.getTypes();
	}

	return [type];
}
