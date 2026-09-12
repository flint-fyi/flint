import { SyntaxKind } from "typescript-native/unstable/ast";

import { getFirstEnumValues } from "./getFirstEnumValues.ts";

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);
