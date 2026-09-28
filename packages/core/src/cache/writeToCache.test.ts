import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { LanguageReport } from "../types/languages.ts";
import type { FileReport, ReportMessageData } from "../types/reports.ts";
import { readFromCache } from "./readFromCache.ts";
import { writeToCache } from "./writeToCache.ts";

const cacheLocation = "/root/cache.json";
const configFilePath = "/root/flint.config.ts";
const filePath = "/root/index.ts";
const dependencyPath = "/root/dep.ts";
const about = { id: "test/report", url: "https://example.com/report" };
const range = {
	begin: { column: 1, line: 0, raw: 1 },
	end: { column: 3, line: 0, raw: 3 },
};

async function roundTrip(
	reports: FileReport[],
	languageReports: LanguageReport[] = [],
): Promise<FileCacheStorage | undefined> {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
	const allFilePaths = new Set([filePath]);
	for (const path of [
		configFilePath,
		filePath,
		"package.json",
		dependencyPath,
	]) {
		host.vfsUpsertFile(path, "content");
	}

	await writeToCache(
		host,
		configFilePath,
		{
			allFilePaths,
			allFileResults: new Map([
				[
					filePath,
					{
						dependencies: new Set([dependencyPath]),
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

	return cached?.get(filePath);
}

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
		const reports: FileReport[] = [
			{
				about,
				data: { blank: "", count: 0, enabled: false, name: "example" },
				dependencies: [],
				fix: [{ range: { begin: 1, end: 3 }, text: "" }],
				message,
				range,
				suggestions: [
					{ id: "replace", range: { begin: 1, end: 3 }, text: "replacement" },
					{ files: { [dependencyPath]: [] }, id: "multiple" },
				],
			},
		];
		const languageReports = [
			{ code: "", source: "parser", text: "Diagnostic" },
		];

		expect(await roundTrip(reports, languageReports)).toEqual({
			dependencies: [dependencyPath],
			languageReports,
			reports,
			timestamp: expect.any(Number),
		});
	});

	it("round-trips reports with explicitly undefined optional properties", async () => {
		const reports: FileReport[] = [
			{
				about,
				data: undefined,
				fix: undefined,
				message: { primary: "Report", secondary: [], suggestions: [] },
				range,
				suggestions: undefined,
			},
		];

		expect(await roundTrip(reports)).toEqual({
			dependencies: [dependencyPath],
			reports: [
				{
					about,
					message: { primary: "Report", secondary: [], suggestions: [] },
					range,
				},
			],
			timestamp: expect.any(Number),
		});
	});
});
