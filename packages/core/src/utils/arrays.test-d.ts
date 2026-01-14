import { describe, expectTypeOf, it } from "vitest";

import { binarySearch } from "./arrays.ts";

describe("binarySearch", () => {
	it("returns nullish without explicit no-fallback", () => {
		const foo = { bar: "" };
		const res = binarySearch([foo], () => 0);

		expectTypeOf(res).toEqualTypeOf<
			undefined | { element: typeof foo; index: number }
		>();
	});

	it("returns nullish with explicit no-fallback", () => {
		const foo = { bar: "" };
		const res = binarySearch([foo], () => 0, "no-fallback");

		expectTypeOf(res).toEqualTypeOf<
			undefined | { element: typeof foo; index: number }
		>();
	});

	it("returns non-nullish with fallback-next", () => {
		const foo = { bar: "" };
		const res = binarySearch([foo], () => 0, "fallback-next");

		expectTypeOf(res).toEqualTypeOf<{
			element: typeof foo | undefined;
			index: number;
		}>();
	});

	it("returns non-nullish with fallback-prev", () => {
		const foo = { bar: "" };
		const res = binarySearch([foo], () => 0, "fallback-prev");

		expectTypeOf(res).toEqualTypeOf<{
			element: typeof foo | undefined;
			index: number;
		}>();
	});
});
