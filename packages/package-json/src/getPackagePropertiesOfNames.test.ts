import { parse, type StringNode } from "@humanwhocodes/momoa";
import { describe, expect, it } from "vitest";

import { getPackagePropertiesOfNames } from "./getPackagePropertiesOfNames.ts";

describe(getPackagePropertiesOfNames, () => {
	it("returns the matching root property node", () => {
		const sourceText = `{
			"name": "flint",
			"version": "1.0.0",
			"type": "module"
		}`;
		const document = parse(sourceText);

		const properties = getPackagePropertiesOfNames(document, [
			"name",
			"version",
		]);

		expect(properties.name?.type).toBe("Member");
		expect(properties.name?.name.type).toBe("String");
		expect((properties.name?.name as StringNode).value).toBe("name");
		expect(properties.version?.type).toBe("Member");
		expect((properties.version?.name as StringNode).value).toBe("version");
	});

	it("returns empty object when the requested property does not exist", () => {
		const sourceText = `{
			"name": "flint",
			"version": "1.0.0"
		}`;
		const document = parse(sourceText);

		const properties = getPackagePropertiesOfNames(document, ["nonExistent"]);

		expect(properties).toEqual({});
	});

	it("returns empty object when the root node is not an object", () => {
		const document = parse("[1, 2, 3]");

		const properties = getPackagePropertiesOfNames(document, ["name"]);

		expect(properties).toEqual({});
	});

	it("returns the last matching property when duplicate keys exist", () => {
		const sourceText = `{
			"name": "first",
			"name": "second"
		}`;
		const document = parse(sourceText);

		const properties = getPackagePropertiesOfNames(document, ["name"]);

		expect(properties).toBeDefined();
		expect(properties.name?.value.type).toBe("String");
		expect((properties.name?.value as StringNode).value).toBe("second");
	});
});
