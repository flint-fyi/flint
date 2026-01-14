import { assertType, describe, expectTypeOf, it } from "vitest";

import type { FilesValue } from "../types/files.ts";
import { createPlugin } from "./createPlugin.ts";

describe("createPlugin", () => {
	it("should type files as undefined w/o files property", () => {
		const plugin = createPlugin({
			name: "test",
			rules: [],
		});

		expectTypeOf(plugin.files).toBeUndefined();
	});

	it("should error when files obj is empty", () => {
		// @ts-expect-error is not assignable to never
		createPlugin({
			files: {},
			name: "test",
			rules: [],
		});
	});

	it("should correctly type keyed single files", () => {
		const plugin = createPlugin({
			files: {
				first: [],
			},
			name: "test",
			rules: [],
		});

		expectTypeOf(plugin.files.first).toEqualTypeOf<FilesValue>();
		// @ts-expect-error property doesn't exist
		assertType(plugin.files.second);
	});

	it("should correctly type keyed files", () => {
		const plugin = createPlugin({
			files: {
				first: [],
				second: [],
			},
			name: "test",
			rules: [],
		});

		expectTypeOf(plugin.files.first).toEqualTypeOf<FilesValue>();
		expectTypeOf(plugin.files.second).toEqualTypeOf<FilesValue>();
		// @ts-expect-error property doesn't exist
		assertType(plugin.files.third);
	});

	it("should allow deeply nested files array", () => {
		const plugin = createPlugin({
			files: {
				first: [[[[[[""]]]]]],
			},
			name: "test",
			rules: [],
		});

		expectTypeOf(plugin.files.first).toEqualTypeOf<FilesValue>();
	});
});
