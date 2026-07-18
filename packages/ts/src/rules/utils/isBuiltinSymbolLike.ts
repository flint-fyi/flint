import * as tsutils from "ts-api-utils";
import ts from "typescript";

export function isBuiltinSymbolLike(
	program: ts.Program,
	type: ts.Type,
	symbolName: string,
) {
	return isBuiltinSymbolLikeRecurser(program, type, (subtype) => {
		const symbol = subtype.getSymbol();
		if (!symbol) {
			return false;
		}

		const actualSymbolName = symbol.getName();

		if (
			actualSymbolName === symbolName &&
			isSymbolFromDefaultLibrary(program, symbol)
		) {
			return true;
		}

		if (
			actualSymbolName === "Function" &&
			tsutils.isObjectType(subtype) &&
			tsutils.isObjectFlagSet(subtype, ts.ObjectFlags.Anonymous)
		) {
			return false;
		}

		return null;
	});
}

function isBuiltinSymbolLikeRecurser(
	program: ts.Program,
	type: ts.Type,
	predicate: (subtype: ts.Type) => boolean | null,
): boolean {
	if (type.isUnionOrIntersection()) {
		return type.types.some((subtype) =>
			isBuiltinSymbolLikeRecurser(program, subtype, predicate),
		);
	}

	const result = predicate(type);
	if (result !== null) {
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

function isSymbolFromDefaultLibrary(program: ts.Program, symbol: ts.Symbol) {
	const declarations = symbol.getDeclarations();
	if (!declarations?.length) {
		return false;
	}

	return declarations.some((declaration) => {
		const sourceFile = declaration.getSourceFile();
		return program.isSourceFileDefaultLibrary(sourceFile);
	});
}
