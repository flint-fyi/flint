import { SyntaxKind } from "typescript-native/ast";

import { getFirstEnumValues } from "./getFirstEnumValues.ts";

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);
