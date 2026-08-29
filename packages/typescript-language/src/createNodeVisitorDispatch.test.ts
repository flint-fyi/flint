import ts from "typescript";
import { expect, it, vi } from "vitest";

import { createNodeVisitorDispatch } from "./createNodeVisitorDispatch.ts";
import type { TypeScriptFileServices } from "./language.ts";

it("omits enter subscriptions when no enter visitors are provided", () => {
	const exit = vi.fn();
	const services = {} as TypeScriptFileServices;

	const dispatch = createNodeVisitorDispatch([
		{
			services,
			visitors: { "Identifier:exit": exit },
		},
	]);

	expect(dispatch?.enter).toBeUndefined();
	dispatch?.visit(ts.factory.createIdentifier("value"));
	expect(exit).toHaveBeenCalledWith(expect.anything(), services);
});
