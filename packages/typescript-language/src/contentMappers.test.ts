import { describe, expect, it } from "vitest";

import {
	getTypeScriptContentMapperRegistrations,
	registerTypeScriptContentMapper,
} from "./contentMappers.ts";

describe(registerTypeScriptContentMapper, () => {
	it("registers and unregisters isolated mapper registrations", () => {
		const registration = {
			extensions: [".vue"],
			options: { optionsApi: false },
			packageName: "vize",
		};
		const unregister = registerTypeScriptContentMapper(registration);
		registration.extensions.push(".other");
		registration.options.optionsApi = true;

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

	it("returns fresh registration clones", () => {
		const unregister = registerTypeScriptContentMapper({
			extensions: [".vue"],
			options: { mode: "strict" },
			packageName: "vize",
		});
		const [registration] = getTypeScriptContentMapperRegistrations();
		registration?.extensions.push(".changed");
		if (registration?.options) {
			registration.options.mode = "changed";
		}

		expect(getTypeScriptContentMapperRegistrations()).toEqual([
			{
				extensions: [".vue"],
				options: { mode: "strict" },
				packageName: "vize",
			},
		]);
		expect(unregister()).toBe(true);
	});
});
