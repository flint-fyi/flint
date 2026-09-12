import { expect, it } from "vitest";

import { nullThrows } from "@flint.fyi/utils";

import { getTSNodeRange } from "./getTSNodeRange.ts";
import { createNativeSourceFile } from "./test/createNativeSourceFile.testUtils.ts";
import type * as AST from "./types/ast.ts";

it("excludes leading comments and whitespace from native node ranges", () => {
	const sourceFile = createNativeSourceFile(
		"/* leading */\n   const value = 1;",
	);
	const statement = nullThrows(
		sourceFile.statements[0],
		"Expected a variable statement.",
	) as AST.AnyNode;

	expect(getTSNodeRange(statement, sourceFile)).toEqual({
		begin: sourceFile.text.indexOf("const"),
		end: sourceFile.text.length,
	});
});
