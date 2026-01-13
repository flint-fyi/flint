import { describe, expectTypeOf, it } from "vitest";

import { assert, nullThrows } from "./assert.ts";

describe("assert", () => {
	it("narrows type", () => {
		const val = Math.random() > 0.5 ? "foo" : null;

		assert(val, "MSG");

		expectTypeOf(val).toEqualTypeOf<string>();
	});
});

describe("nullThrows", () => {
	it("narrows type", () => {
		const val = Math.random() > 0.5 ? "foo" : null;

		const res = nullThrows(val, "MSG");

		expectTypeOf(res).toEqualTypeOf<"foo">();
	});
});
