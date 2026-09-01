import type { Type } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isTypeFromTS(
	node: AST.Expression,
	checker: Checker,
	typeName: string,
): boolean {
	const type = checker.getTypeAtLocation(node);
	const visited = new Set<Type>();

	function check(type: Type): boolean {
		if (visited.has(type)) {
			return false;
		}

		visited.add(type);

		// `xx | ts[typeName]` or `xx & ts[typeName]`
		if (type.isUnionType() || type.isIntersectionType()) {
			return type.getTypes().some((subType) => check(subType));
		}

		const symbol = type.getSymbol();

		if (symbol?.name === typeName) {
			const declarations = [];
			for (const declarationHandle of symbol.declarations) {
				const declaration = declarationHandle.resolve();
				if (!declaration) {
					return false;
				}
				declarations.push(declaration);
			}

			return declarations.some((declaration) => {
				const fileName = declaration.getSourceFile().fileName;
				return (
					fileName.includes("node_modules/typescript") &&
					fileName.endsWith(".d.ts")
				);
			});
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
