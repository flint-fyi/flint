import type { AST, Checker } from "@flint.fyi/typescript-language";
import type { Type } from "@flint.fyi/typescript-language/native/sync";

export function isTypeFromTS(
	node: AST.Expression,
	typeChecker: Checker,
	typeName: string,
): boolean {
	const type = typeChecker.getTypeAtLocation(node);
	const visited = new Set<Type>();

	function check(type: Type): boolean {
		if (visited.has(type)) {
			return false;
		}

		visited.add(type);

		// `xx | ts[typeName]` or `xx & ts[typeName]`
		if (type.isUnionType() || type.isIntersectionType()) {
			return type.getTypes().some((subtype) => check(subtype));
		}

		const symbol = type.getSymbol();

		if (symbol?.name === typeName || symbol?.name === `${typeName}Base`) {
			const isFlintBase = symbol.name !== typeName;

			return symbol.declarations.some(({ path }) =>
				isFlintBase ? isDeclaredByFlintAST(path) : isDeclaredByTypeScript(path),
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

function isDeclaredByFlintAST(fileName: string): boolean {
	return (
		/[/\\]typescript-language[/\\]src[/\\]types[/\\]ast\.ts$/i.test(fileName) ||
		/[/\\]@flint\.fyi[/\\]typescript-language[/\\]dist[/\\].+\.d\.mts$/i.test(
			fileName,
		)
	);
}

function isDeclaredByTypeScript(fileName: string): boolean {
	return /[/\\]node_modules[/\\]typescript[/\\].+\.d\.ts$/i.test(fileName);
}
