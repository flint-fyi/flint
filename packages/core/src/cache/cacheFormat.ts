// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: Use Zod Mini in core package
import z from "zod/v4";

import { nullThrows } from "@flint.fyi/utils";

import type { CacheStorage } from "../types/cache.ts";

interface StoredCache {
	configs: [number, number][];
	files: [number, number, number, number, Record<string, unknown>?][];
	groups: [number, number[]][];
	paths: [number, string][];
	version?: 3;
}

const referenceSchema = z.int().nonnegative();
const storedCacheSchema: z.ZodType<StoredCache> = z.object({
	configs: z.array(z.tuple([referenceSchema, z.number()])),
	files: z.array(
		z.tuple([
			referenceSchema,
			z.number(),
			z.int().min(-1),
			z.int().min(-1),
			z.record(z.string(), z.unknown()).exactOptional(),
		]),
	),
	groups: z.array(z.tuple([referenceSchema, z.array(referenceSchema)])),
	paths: z.array(z.tuple([referenceSchema, z.string()])),
	version: z.literal(3).exactOptional(),
});

/** Paths and dependency groups share prefixes with the preceding table entry. */
export function decodeCacheStorage(input: unknown): CacheStorage {
	const stored = storedCacheSchema.parse(input);
	const paths: string[] = [];
	let previousPath = "";
	for (const [prefix, suffix] of stored.paths) {
		if (prefix > previousPath.length) {
			throw new RangeError("Invalid cached path prefix.");
		}
		previousPath = previousPath.slice(0, prefix) + suffix;
		paths.push(previousPath);
	}
	const groups: string[][] = [];
	let previousGroup: string[] = [];
	for (const [prefix, suffix] of stored.groups) {
		if (prefix > previousGroup.length) {
			throw new RangeError("Invalid cached dependency prefix.");
		}
		const group = previousGroup
			.slice(0, prefix)
			.concat(
				suffix.map((reference) =>
					nullThrows(paths[reference], "Cached path exists"),
				),
			);
		groups.push(group);
		previousGroup = group;
	}
	return {
		configs: Object.fromEntries(
			stored.configs.map(([path, timestamp]) => [
				nullThrows(paths[path], "Cached config path exists"),
				timestamp,
			]),
		),
		files: Object.fromEntries(
			stored.files.map(
				([path, timestamp, dependencies, structural, metadata]) => [
					nullThrows(paths[path], "Cached file path exists"),
					{
						...metadata,
						...(dependencies !== -1 && {
							dependencies: nullThrows(
								groups[dependencies],
								"Cached dependencies exist",
							),
						}),
						...(structural !== -1 && {
							structuralDependencies: nullThrows(
								groups[structural],
								"Cached structural dependencies exist",
							),
						}),
						timestamp,
					},
				],
			),
		),
		...(stored.version && { version: stored.version }),
	};
}

export function encodeCacheStorage(storage: CacheStorage): StoredCache {
	const paths: string[] = [];
	const pathIds = new Map<string, number>();
	const groups: number[][] = [[]];
	const groupIds = new Map<string, number>([["", 0]]);

	function getPathId(path: string): number {
		let id = pathIds.get(path);
		if (id === undefined) {
			id = paths.length;
			paths.push(path);
			pathIds.set(path, id);
		}
		return id;
	}

	function getGroupId(dependencies: readonly string[] | undefined): number {
		if (!dependencies) {
			return -1;
		}
		const references = dependencies.map(getPathId);
		const key = references.join(",");
		let id = groupIds.get(key);
		if (id === undefined) {
			id = groups.length;
			groups.push(references);
			groupIds.set(key, id);
		}
		return id;
	}

	const files = Object.entries(storage.files).map(
		([
			path,
			{ dependencies, structuralDependencies, timestamp, ...metadata },
		]) => {
			const entry: StoredCache["files"][number] = [
				getPathId(path),
				timestamp,
				getGroupId(dependencies),
				getGroupId(structuralDependencies),
			];
			if (Object.keys(metadata).length) {
				entry.push(metadata);
			}
			return entry;
		},
	);
	const configs = Object.entries(storage.configs).map(
		([path, timestamp]): [number, number] => [getPathId(path), timestamp],
	);
	const ordered = groups
		.map((values, id) => ({ id, values }))
		.toSorted((first, second) => {
			for (
				let index = 0;
				index < Math.min(first.values.length, second.values.length);
				index++
			) {
				const difference =
					nullThrows(first.values[index], "Group path exists") -
					nullThrows(second.values[index], "Group path exists");
				if (difference) {
					return difference;
				}
			}
			return first.values.length - second.values.length;
		});
	const orderedIds = new Map(ordered.map(({ id }, index) => [id, index]));
	for (const file of files) {
		file[2] =
			file[2] === -1
				? -1
				: nullThrows(orderedIds.get(file[2]), "Dependency group exists");
		file[3] =
			file[3] === -1
				? -1
				: nullThrows(orderedIds.get(file[3]), "Structural group exists");
	}
	let previousGroup: number[] = [];
	const storedGroups = ordered.map(({ values }): [number, number[]] => {
		let prefix = 0;
		while (
			prefix < Math.min(previousGroup.length, values.length) &&
			previousGroup[prefix] === values[prefix]
		) {
			prefix++;
		}
		previousGroup = values;
		return [prefix, values.slice(prefix)];
	});
	let previousPath = "";
	const storedPaths = paths.map((path): [number, string] => {
		let prefix = 0;
		while (
			prefix < Math.min(previousPath.length, path.length) &&
			previousPath[prefix] === path[prefix]
		) {
			prefix++;
		}
		const entry: [number, string] = [prefix, path.slice(prefix)];
		previousPath = path;
		return entry;
	});
	return {
		configs,
		files,
		groups: storedGroups,
		paths: storedPaths,
		...(storage.version && { version: storage.version }),
	};
}
