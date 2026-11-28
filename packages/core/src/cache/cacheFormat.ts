// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: Use Zod Mini in core package
import z from "zod/v4";

import { nullThrows } from "@flint.fyi/utils";

import type { CacheStorage } from "../types/cache.ts";
import { jsonCodec } from "../utils/codecs.ts";
import { cacheStorageSchemaObject } from "./cacheSchema.ts";

const cacheVersion = 1;

interface StoredCache {
	configs: StoredConfig[];
	files: StoredFile[];
	groups: StoredGroup[];
	paths: StoredPath[];
	version: typeof cacheVersion;
}

type StoredConfig = [path: number, timestamp: number];

type StoredFile = [
	path: number,
	timestamp: number,
	dependencyGroup: number,
	missingDependencyGroup: number,
	metadata?: Record<string, unknown>,
];

type StoredGroup = [prefix: number, suffix: number[]];

type StoredPath = [prefix: number, suffix: string];

function hasValidReferences(stored: StoredCache): boolean {
	const isPath = (reference: number): boolean =>
		reference < stored.paths.length;
	const isGroup = (reference: number): boolean =>
		reference < stored.groups.length;
	let previousLength = 0;
	for (const [prefix, suffix] of stored.paths) {
		if (prefix > previousLength) {
			return false;
		}
		previousLength = prefix + suffix.length;
	}
	previousLength = 0;
	for (const [prefix, references] of stored.groups) {
		if (prefix > previousLength || !references.every(isPath)) {
			return false;
		}
		previousLength = prefix + references.length;
	}
	return (
		stored.configs.every(([path]) => isPath(path)) &&
		stored.files.every(
			([path, , dependencies, missingDependencies]) =>
				isPath(path) && isGroup(dependencies) && isGroup(missingDependencies),
		)
	);
}

const referenceSchema = z.int().nonnegative();
const storedCacheSchema: z.ZodType<StoredCache> = z
	.object({
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
		version: z.literal(cacheVersion),
	})
	.refine(hasValidReferences, "Invalid cached table reference or prefix.");

/** Paths and dependency groups share prefixes with the preceding table entry. */
function decodeCacheStorage(stored: StoredCache): CacheStorage {
	const paths: string[] = [];
	let previousPath = "";
	for (const [prefix, suffix] of stored.paths) {
		previousPath = previousPath.slice(0, prefix) + suffix;
		paths.push(previousPath);
	}
	const groups: string[][] = [];
	let previousGroup: string[] = [];
	for (const [prefix, suffix] of stored.groups) {
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
				([path, timestamp, dependencies, missingDependencies, metadata]) => [
					nullThrows(paths[path], "Cached file path exists"),
					{
						...metadata,
						...(dependencies !== -1 && {
							dependencies: nullThrows(
								groups[dependencies],
								"Cached dependencies exist",
							),
						}),
						...(missingDependencies !== -1 && {
							missingDependencies: nullThrows(
								groups[missingDependencies],
								"Cached missing dependencies exist",
							),
						}),
						timestamp,
					},
				],
			),
		),
	};
}

function encodeCacheStorage(storage: CacheStorage): StoredCache {
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
		([path, { dependencies, missingDependencies, timestamp, ...metadata }]) => {
			const entry: StoredFile = [
				getPathId(path),
				timestamp,
				getGroupId(dependencies),
				getGroupId(missingDependencies),
			];
			if (Object.keys(metadata).length) {
				entry.push(metadata);
			}
			return entry;
		},
	);
	const configs = Object.entries(storage.configs).map(
		([path, timestamp]): StoredConfig => [getPathId(path), timestamp],
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
	const getOrderedId = (id: number): number =>
		id === -1 ? -1 : nullThrows(orderedIds.get(id), "Dependency group exists");
	for (const file of files) {
		file[2] = getOrderedId(file[2]);
		file[3] = getOrderedId(file[3]);
	}
	let previousGroup: number[] = [];
	const storedGroups = ordered.map(({ values }): StoredGroup => {
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
	const storedPaths = paths.map((path): StoredPath => {
		let prefix = 0;
		while (
			prefix < Math.min(previousPath.length, path.length) &&
			previousPath[prefix] === path[prefix]
		) {
			prefix++;
		}
		const entry: StoredPath = [prefix, path.slice(prefix)];
		previousPath = path;
		return entry;
	});
	return {
		configs,
		files,
		groups: storedGroups,
		paths: storedPaths,
		version: cacheVersion,
	};
}

const compactCacheStorageSchema: z.ZodCodec<
	z.ZodType<StoredCache>,
	z.ZodType<CacheStorage>
> = z.codec(storedCacheSchema, cacheStorageSchemaObject, {
	decode: decodeCacheStorage,
	encode: (storage) => encodeCacheStorage(storage as CacheStorage),
});

export const cacheStorageSchema: z.ZodCodec<
	z.ZodString,
	z.ZodType<CacheStorage>
> = jsonCodec(compactCacheStorageSchema);
