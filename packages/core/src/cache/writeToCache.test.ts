import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { FileReport, ReportMessageData } from "../types/reports.ts";
import { readFromCache } from "./readFromCache.ts";
import { writeToCache } from "./writeToCache.ts";

describe(writeToCache, () => {
	it.each<ReportMessageData>([
		{ primary: "Report", secondary: [], suggestions: [] },
		{ primary: "Report", secondary: ["Details"], suggestions: [] },
		{ primary: "Report", secondary: [], suggestions: ["Recommendation"] },
		{
			primary: "Report",
			secondary: ["Details"],
			suggestions: ["Recommendation"],
		},
	])("round-trips report content with message %j", async (message) => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		const cacheLocation = "/root/cache.json";
		const configFilePath = "/root/flint.config.ts";
		const filePath = "/root/index.ts";
		const allFilePaths = new Set([filePath]);
		for (const path of [
			configFilePath,
			filePath,
			"package.json",
			"/root/dep.ts",
		]) {
			host.vfsUpsertFile(path, "content");
		}

		const reports: FileReport[] = [
			{
				about: { id: "test/report", url: "https://example.com/report" },
				data: { blank: "", count: 0, enabled: false, name: "example" },
				dependencies: [],
				fix: [{ range: { begin: 1, end: 3 }, text: "" }],
				message,
				range: {
					begin: { column: 1, line: 0, raw: 1 },
					end: { column: 3, line: 0, raw: 3 },
				},
				suggestions: [
					{ id: "replace", range: { begin: 1, end: 3 }, text: "replacement" },
					{ files: { "/root/dep.ts": [] }, id: "multiple" },
				],
			},
		];
		const languageReports = [
			{ code: "", source: "parser", text: "Diagnostic" },
		];

		await writeToCache(
			host,
			configFilePath,
			{
				allFilePaths,
				allFileResults: new Map([
					[
						filePath,
						{
							dependencies: new Set(["/root/dep.ts"]),
							languageReports,
							reports,
						},
					],
				]),
				cached: undefined,
				ruleCount: 1,
			},
			cacheLocation,
		);

		expect(await host.readFile(cacheLocation)).toEqual(expect.any(String));
		const cached = await readFromCache(
			host,
			allFilePaths,
			configFilePath,
			cacheLocation,
		);
		expect(cached).toEqual(
			new Map([
				[
					filePath,
					{
						dependencies: ["/root/dep.ts"],
						languageReports,
						reports,
						timestamp: expect.any(Number),
					},
				],
			]),
		);
	});
});
