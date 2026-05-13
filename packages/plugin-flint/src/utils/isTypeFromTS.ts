import type { AST, Checker } from "@flint.fyi/typescript-language";
import type { Type } from "typescript";

export function isTypeFromTS(
	node: AST.Expression,
	typeChecker: Checker,
	typeName: string,
) {
	const type = typeChecker.getTypeAtLocation(node);
	const visited = new Set<Type>();

	function check(type: Type): boolean {
		if (visited.has(type)) {
			return false;
		}

		visited.add(type);

		// `xx | ts[typeName]` or `xx & ts[typeName]`
		if (type.isUnionOrIntersection()) {
			return type.types.some((subType) => check(subType));
		}

		const symbol = type.getSymbol();

		if (symbol?.getName() === typeName) {
			const declarations = symbol.getDeclarations();

			return (
				declarations?.some((declaration) => {
					const sourceFile = declaration.getSourceFile().fileName;
					return (
						sourceFile.includes("node_modules/typescript") &&
						sourceFile.endsWith(".d.ts")
					);
				}) ?? false
			);
		}

		// CustomNode extends ts[typeName]
		const bases = type.getBaseTypes();
		if (bases?.length) {
			return bases.some((baseType) => check(baseType));
		}

		return false;
	}

	return check(type);
}
