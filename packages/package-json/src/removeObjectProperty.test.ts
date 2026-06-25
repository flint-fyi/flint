/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { parse, type ObjectNode } from "@humanwhocodes/momoa";
import { describe, expect, it } from "vitest";

import { removeObjectProperty } from "./removeObjectProperty.ts";

describe(removeObjectProperty, () => {
	it("removes a single property from a one-property object", () => {
		const sourceText = '{"key": "value"}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const propertyNode = objectNode.members[0]!;

		const result = removeObjectProperty(propertyNode, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("{}");
		expect(result.range).toHaveProperty("begin");
		expect(result.range).toHaveProperty("end");
	});

	it("removes the first property from a multi-property object with next sibling", () => {
		const sourceText = '{"first": 1, "second": 2, "third": 3}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;
		const secondProperty = objectNode.members[1]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstProperty.range![0]);
		expect(result.range.end).toEqual(secondProperty.range![0]);
	});

	it("removes a middle property from a multi-property object", () => {
		const sourceText = '{"first": 1, "second": 2, "third": 3}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const middleProperty = objectNode.members[1]!;
		const nextProperty = objectNode.members[2]!;

		const result = removeObjectProperty(middleProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(middleProperty.range![0]);
		expect(result.range.end).toEqual(nextProperty.range![0]);
	});

	it("removes the last property from a multi-property object", () => {
		const sourceText = '{"first": 1, "second": 2, "third": 3}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const lastProperty = objectNode.members[2]!;
		const previousProperty = objectNode.members[1]!;

		const result = removeObjectProperty(lastProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(previousProperty.range![1]);
		expect(result.range.end).toEqual(lastProperty.range![1]);
	});

	it("removes the last property from a two-property object", () => {
		const sourceText = '{"first": 1, "second": 2}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const lastProperty = objectNode.members[1]!;
		const previousProperty = objectNode.members[0]!;

		const result = removeObjectProperty(lastProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(previousProperty.range![1]);
		expect(result.range.end).toEqual(lastProperty.range![1]);
	});

	it("throws an error when property is not in the object", () => {
		const sourceText1 = '{"first": 1, "second": 2}';
		const sourceText2 = '{"third": 3, "fourth": 4}';
		const document1 = parse(sourceText1, { mode: "json", ranges: true });
		const document2 = parse(sourceText2, { mode: "json", ranges: true });
		const object1 = document1.body as ObjectNode;
		const object2 = document2.body as ObjectNode;
		const propertyFromObject1 = object1.members[0]!;

		expect(() => {
			removeObjectProperty(propertyFromObject1, object2);
		}).toThrow("Node is not a child of the parent object.");
	});

	it("handles objects with whitespace and formatting", () => {
		const sourceText = `{
  "first": 1,
  "second": 2,
  "third": 3
}`;
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstProperty.range![0]);
		expect(result.range.end).toEqual(objectNode.members[1]!.range![0]);
	});

	it("handles string property values", () => {
		const sourceText = '{"name": "John", "city": "New York", "country": "USA"}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const secondProperty = objectNode.members[1]!;

		const result = removeObjectProperty(secondProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range).toHaveProperty("begin");
		expect(result.range).toHaveProperty("end");
	});

	it("handles numeric property values", () => {
		const sourceText = '{"a": 1, "b": 2, "c": 3}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});

	it("handles boolean property values", () => {
		const sourceText = '{"enabled": true, "disabled": false, "active": true}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const secondProperty = objectNode.members[1]!;

		const result = removeObjectProperty(secondProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});

	it("handles null property values", () => {
		const sourceText = '{"a": null, "b": null, "c": null}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const middleProperty = objectNode.members[1]!;

		const result = removeObjectProperty(middleProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});

	it("handles object property values", () => {
		const sourceText =
			'{"nested1": {"x": 1}, "nested2": {"y": 2}, "nested3": {"z": 3}}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstProperty.range![0]);
	});

	it("handles array property values", () => {
		const sourceText = '{"arr1": [1, 2], "arr2": [3, 4], "arr3": [5, 6]}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const lastProperty = objectNode.members[2]!;

		const result = removeObjectProperty(lastProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});

	it("removes the first property from a three-property object", () => {
		const sourceText = '{"a": 1, "b": 2, "c": 3}';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;
		const secondProperty = objectNode.members[1]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstProperty.range![0]);
		expect(result.range.end).toEqual(secondProperty.range![0]);
	});

	it("removes first property from object with multiline formatting", () => {
		const sourceText = `{
  "key1": "value1",
  "key2": "value2",
  "key3": "value3"
}`;
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const firstProperty = objectNode.members[0]!;

		const result = removeObjectProperty(firstProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});

	it("removes last property from object with multiline formatting", () => {
		const sourceText = `{
  "key1": "value1",
  "key2": "value2",
  "key3": "value3"
}`;
		const document = parse(sourceText, { mode: "json", ranges: true });
		const objectNode = document.body as ObjectNode;
		const lastProperty = objectNode.members[2]!;

		const result = removeObjectProperty(lastProperty, objectNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
	});
});
