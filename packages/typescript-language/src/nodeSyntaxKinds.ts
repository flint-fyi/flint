import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { SyntaxKind } from "./native/ast.ts";

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);
