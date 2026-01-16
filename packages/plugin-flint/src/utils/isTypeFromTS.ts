import type { AST, Checker } from "@flint.fyi/typescript-language";
import ts from "typescript";

export function isTypeFromTS(
	node: AST.Expression,
	typeChecker: Checker,
	typeName: string,
) {
	const type = typeChecker.getTypeAtLocation(node);

	return isTypeFromTSRecursive(type, typeChecker, typeName);
}

function isTypeFromTSRecursive(
	type: ts.Type,
	typeChecker: Checker,
	typeName: string,
): boolean {
	// `xx | ts[typeName]` or `xx & ts[typeName]`
	if (type.isUnionOrIntersection()) {
		return type.types.some((subType) =>
			isTypeFromTSRecursive(subType, typeChecker, typeName),
		);
	}

	const symbol = type.getSymbol();

	if (symbol?.getName() === typeName) {
		const declarations = symbol.getDeclarations();

		const isFromTS = declarations?.some((declaration) => {
			const sourceFile = declaration.getSourceFile().fileName;
			return (
				sourceFile.includes("node_modules/typescript") &&
				sourceFile.endsWith(".d.ts")
			);
		});

		if (isFromTS) {
			return true;
		}
	}

	// CustomNode extends ts[typeName]
	const bases = type.getBaseTypes();
	if (bases?.length) {
		return bases.some((baseType) =>
			isTypeFromTSRecursive(baseType, typeChecker, typeName),
		);
	}

	return false;
}
