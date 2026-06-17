/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { parse, type ArrayNode } from "@humanwhocodes/momoa";
import { describe, expect, it } from "vitest";

import { removeArrayElement } from "./removeArrayElement.ts";

describe(removeArrayElement, () => {
	it("removes a single element from a one-element array", () => {
		const sourceText = '["value"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const elementNode = arrayNode.elements[0]!;

		const result = removeArrayElement(elementNode, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("[]");
		expect(result.range).toHaveProperty("begin");
		expect(result.range).toHaveProperty("end");
	});

	it("removes the first element from a multi-element array with next sibling", () => {
		const sourceText = '["first", "second", "third"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const firstElement = arrayNode.elements[0]!;
		const secondElement = arrayNode.elements[1]!;

		const result = removeArrayElement(firstElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstElement.value.range![0]);
		expect(result.range.end).toEqual(secondElement.value.range![0]);
	});

	it("removes a middle element from a multi-element array", () => {
		const sourceText = '["first", "second", "third"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const middleElement = arrayNode.elements[1]!;
		const nextElement = arrayNode.elements[2]!;

		const result = removeArrayElement(middleElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(middleElement.value.range![0]);
		expect(result.range.end).toEqual(nextElement.value.range![0]);
	});

	it("removes the last element from a multi-element array using previous sibling", () => {
		const sourceText = '["first", "second", "third"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const lastElement = arrayNode.elements[2]!;
		const previousElement = arrayNode.elements[1]!;

		const result = removeArrayElement(lastElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(previousElement.value.range![1]);
		expect(result.range.end).toEqual(lastElement.value.range![1]);
	});

	it("removes the last element from a two-element array", () => {
		const sourceText = '["first", "second"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const lastElement = arrayNode.elements[1]!;
		const previousElement = arrayNode.elements[0]!;

		const result = removeArrayElement(lastElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(previousElement.value.range![1]);
		expect(result.range.end).toEqual(lastElement.value.range![1]);
	});

	it("removes an element with from single element array", () => {
		const sourceText = '["only"]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const elementNode = arrayNode.elements[0]!;

		// Calling with the single element should return [] replacement
		const result = removeArrayElement(elementNode, arrayNode);
		expect(result.text).toBe("[]");
		expect(result.range.begin).toEqual(arrayNode.range![0]);
		expect(result.range.end).toEqual(arrayNode.range![1]);
	});

	it("throws an error when element is not in the array", () => {
		const sourceText1 = '["first", "second"]';
		const sourceText2 = '["third", "fourth"]';
		const document1 = parse(sourceText1, { mode: "json", ranges: true });
		const document2 = parse(sourceText2, { mode: "json", ranges: true });
		const array1 = document1.body as ArrayNode;
		const array2 = document2.body as ArrayNode;
		const elementFromArray1 = array1.elements[0]!;

		expect(() => {
			removeArrayElement(elementFromArray1, array2);
		}).toThrow("Node is not a child of the parent array.");
	});

	it("handles arrays with whitespace and formatting", () => {
		const sourceText = `[
  "first",
  "second",
  "third"
]`;
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const firstElement = arrayNode.elements[0]!;

		const result = removeArrayElement(firstElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		// Range should span from first element to start of second (including comma/whitespace)
		expect(result.range.begin).toEqual(firstElement.value.range![0]);
		expect(result.range.end).toEqual(arrayNode.elements[1]!.value.range![0]);
	});

	it("handles numeric array elements", () => {
		const sourceText = "[1, 2, 3, 4, 5]";
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const secondElement = arrayNode.elements[1]!;

		const result = removeArrayElement(secondElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(secondElement.value.range![0]);
		expect(result.range.end).toEqual(arrayNode.elements[2]!.value.range![0]);
	});

	it("handles object elements in an array", () => {
		const sourceText = '[{"a": 1}, {"b": 2}, {"c": 3}]';
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const firstElement = arrayNode.elements[0]!;

		const result = removeArrayElement(firstElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(firstElement.value.range![0]);
		expect(result.range.end).toEqual(arrayNode.elements[1]!.value.range![0]);
	});

	it("handles array elements in an array", () => {
		const sourceText = "[[1, 2], [3, 4], [5, 6]]";
		const document = parse(sourceText, { mode: "json", ranges: true });
		const arrayNode = document.body as ArrayNode;
		const lastElement = arrayNode.elements[2]!;

		const result = removeArrayElement(lastElement, arrayNode);

		expect(result).toBeDefined();
		expect(result.text).toBe("");
		expect(result.range.begin).toEqual(arrayNode.elements[1]!.value.range![1]);
		expect(result.range.end).toEqual(lastElement.value.range![1]);
	});
});
