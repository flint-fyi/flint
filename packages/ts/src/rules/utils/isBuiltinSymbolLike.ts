import {
	ObjectFlags,
	type Program,
	type Symbol,
	type Type,
} from "typescript-native/unstable/sync";

export function isBuiltinSymbolLike(
	program: Program,
	type: Type,
	symbolName: string,
): boolean {
	return isBuiltinSymbolLikeRecurser(program, type, (subtype) => {
		const symbol = subtype.getSymbol();
		if (!symbol) {
			return false;
		}

		const actualSymbolName = symbol.name;

		if (
			actualSymbolName === symbolName &&
			isSymbolFromDefaultLibrary(program, symbol)
		) {
			return true;
		}

		if (
			actualSymbolName === "Function" &&
			subtype.isObjectType() &&
			subtype.objectFlags & ObjectFlags.Anonymous
		) {
			return false;
		}

		return undefined;
	});
}

function isBuiltinSymbolLikeRecurser(
	program: Program,
	type: Type,
	predicate: (subtype: Type) => boolean | undefined,
): boolean {
	if (type.isUnionType() || type.isIntersectionType()) {
		return type
			.getTypes()
			.some((subtype) =>
				isBuiltinSymbolLikeRecurser(program, subtype, predicate),
			);
	}

	const result = predicate(type);
	if (result !== undefined) {
		return result;
	}

	const bases = type.getBaseTypes();
	if (bases?.length) {
		return bases.some((baseType) =>
			isBuiltinSymbolLikeRecurser(program, baseType, predicate),
		);
	}

	return false;
}

function isSymbolFromDefaultLibrary(program: Program, symbol: Symbol): boolean {
	const declarations = symbol.declarations
		.map((declaration) => declaration.resolve())
		.filter((declaration) => declaration !== undefined);
	if (!declarations.length) {
		return false;
	}

	return declarations.some((declaration) => {
		const sourceFile = declaration.getSourceFile();
		return program.isSourceFileDefaultLibrary(sourceFile);
	});
}
