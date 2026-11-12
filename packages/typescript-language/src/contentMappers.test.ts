import { describe, expect, it } from "vitest";

import {
	getTypeScriptContentMapperRegistrations,
	registerTypeScriptContentMapper,
} from "./contentMappers.ts";

describe(registerTypeScriptContentMapper, () => {
	it("registers and unregisters mapper registrations", () => {
		const unregister = registerTypeScriptContentMapper({
			extensions: [".vue"],
			options: { optionsApi: false },
			packageName: "vize",
		});

		expect(getTypeScriptContentMapperRegistrations()).toEqual([
			{
				extensions: [".vue"],
				options: { optionsApi: false },
				packageName: "vize",
			},
		]);
		expect(unregister()).toBe(true);
		expect(unregister()).toBe(false);
		expect(getTypeScriptContentMapperRegistrations()).toEqual([]);
	});

	it("keeps registrations independent", () => {
		const unregisterVue = registerTypeScriptContentMapper({
			extensions: [".vue"],
			packageName: "vize",
		});
		const unregisterSvelte = registerTypeScriptContentMapper({
			extensions: [".svelte"],
			packageName: "svelte-mapper",
		});

		expect(unregisterVue()).toBe(true);
		expect(getTypeScriptContentMapperRegistrations()).toEqual([
			{ extensions: [".svelte"], packageName: "svelte-mapper" },
		]);
		expect(unregisterSvelte()).toBe(true);
	});
});
