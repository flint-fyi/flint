import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

export function isBuiltinSymbolLike(
	program: ts.Program,
	type: ts.Type,
	symbolName: string,
) {
	return isBuiltinSymbolLikeRecurser(program, type, (subType) => {
		const symbol = subType.getSymbol();
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
			tsutils.isObjectType(subType) &&
			tsutils.isObjectFlagSet(subType, ts.ObjectFlags.Anonymous)
		) {
			return false;
		}

		return null;
	});
}

function isBuiltinSymbolLikeRecurser(
	program: ts.Program,
	type: ts.Type,
	predicate: (subType: ts.Type) => boolean | null,
): boolean {
	if (type.isUnionOrIntersection()) {
		return type.types.some((subType) =>
			isBuiltinSymbolLikeRecurser(program, subType, predicate),
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
		return (
			sourceFile.hasNoDefaultLib ||
			program.isSourceFileDefaultLibrary(sourceFile)
		);
	});
}
