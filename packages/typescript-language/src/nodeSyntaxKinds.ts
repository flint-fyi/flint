import { SyntaxKind } from "typescript";

import { getFirstEnumValues } from "./getFirstEnumValues.ts";

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);
