import { parse, type StringNode } from "@humanwhocodes/momoa";
import { describe, expect, it } from "vitest";

import { getPackagePropertyOfName } from "./getPackagePropertyOfName.ts";

describe(getPackagePropertyOfName, () => {
	it("returns the matching root property node", () => {
		const sourceText = `{
			"name": "flint",
			"version": "1.0.0"
		}`;
		const document = parse(sourceText);

		const property = getPackagePropertyOfName(document, "name");

		expect(property).toBeDefined();
		expect(property?.name.type).toBe("String");
		expect((property?.name as StringNode).value).toBe("name");
		expect(property?.value.type).toBe("String");
		expect((property?.value as StringNode).value).toBe("flint");
	});

	it("returns undefined when the requested property does not exist", () => {
		const sourceText = `{
			"name": "flint"
		}`;
		const document = parse(sourceText);

		const property = getPackagePropertyOfName(document, "version");

		expect(property).toBeUndefined();
	});

	it("returns undefined when the root node is not an object", () => {
		const document = parse("[1, 2, 3]");

		const property = getPackagePropertyOfName(document, "name");

		expect(property).toBeUndefined();
	});

	it("returns the first matching property when duplicate keys exist", () => {
		const sourceText = `{
			"name": "first",
			"name": "second"
		}`;
		const document = parse(sourceText);

		const property = getPackagePropertyOfName(document, "name");

		expect(property).toBeDefined();
		expect(property?.value.type).toBe("String");
		expect((property?.value as StringNode).value).toBe("first");
	});
});
