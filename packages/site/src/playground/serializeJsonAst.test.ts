import { parse } from "@humanwhocodes/momoa";
import { describe, expect, it } from "vitest";

import { serializeJsonAst } from "./serializeJsonAst.ts";

describe(serializeJsonAst, () => {
	it("serializes child nodes, node arrays, and literal values", () => {
		const root = parse('{"a": [true]}', { mode: "json", ranges: true });

		expect(serializeJsonAst(root)).toEqual({
			end: 13,
			kind: "Document",
			properties: {
				body: {
					end: 13,
					kind: "Object",
					properties: {
						members: [
							{
								end: 12,
								kind: "Member",
								properties: {
									name: {
										end: 4,
										kind: "String",
										properties: {},
										start: 1,
										text: "a",
									},
									value: {
										end: 12,
										kind: "Array",
										properties: {
											elements: [
												{
													end: 11,
													kind: "Element",
													properties: {
														value: {
															end: 11,
															kind: "Boolean",
															properties: {},
															start: 7,
															text: "true",
														},
													},
													start: 7,
												},
											],
										},
										start: 6,
									},
								},
								start: 1,
							},
						],
					},
					start: 0,
				},
			},
			start: 0,
		});
	});
});
