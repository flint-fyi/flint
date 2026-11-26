import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";
import { resolve } from "pathe";

import { pathKey, type PromiseOrSync } from "@flint.fyi/utils";

import { collectTransitiveDependents } from "../cache/collectTransitiveDependents.ts";
import { readFromCache } from "../cache/readFromCache.ts";
import { writeToCache } from "../cache/writeToCache.ts";
import { applyChangesToFiles } from "../changing/applyChangesToFiles.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFileFactory,
} from "../types/languages.ts";
import type { LintResults } from "../types/linting.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageFilesByFilePath } from "./collectLanguageFilesByFilePath.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import {
	finalizeFileResults,
	type FinalizedFileResults,
} from "./finalizeFileResults.ts";
import { runRules } from "./runRules.ts";

const log = debugForFile(import.meta.url);

export const maximumFixIterations = 10;

export interface LintSessionChangedLintOptions extends LintSessionLintOptions {
	onResults?: (
		results: Map<string, FinalizedFileResults>,
	) => PromiseOrSync<void>;
}

export interface LintSessionFixOptions extends LintSessionLintOptions {
	requestedSuggestions: Set<string>;
}

export interface LintSessionFixResults {
	/**
	 * Files written by fixes.
	 */
	changed: Set<string>;

	/**
	 * Files linted initially or re-linted after fixes.
	 */
	lintedFilePaths: Set<string>;
}

export interface LintSessionLintOptions {
	skipLanguageReports?: boolean;
}

export interface LintSessionOptions {
	/**
	 * Overrides the config's cache location.
	 */
	cacheLocation?: string | undefined;

	/**
	 * Skips reading the cache checkpoint; {@link LintSession.writeCache} still writes one.
	 */
	ignoreCache?: boolean | undefined;
}

export class LintSession implements Disposable {
	readonly allFilePaths: Set<string>;
	readonly storedResults: Map<string, FinalizedFileResults> = new Map<
		string,
		FinalizedFileResults
	>();

	get ruleCount(): number {
		return this.#rulesOptionsByFile.size;
	}

	#cached: Map<string, FileCacheStorage> | undefined;
	readonly #cacheLocation: string | undefined;
	#cacheUnread: boolean;
	readonly #caseSensitiveFS: boolean;
	readonly #configFilePath: string;
	readonly #cwd: string;
	readonly #dependents = new Map<string, Set<string>>();
	readonly #filePathsByKey = new Map<string, string>();
	readonly #globalDependencies = new Set<string>();
	readonly #host: LinterHost;
	readonly #languageFileFactories: CachedFactory<
		AnyLanguage,
		AnyLanguageFileFactory
	>;
	readonly #pendingFilePaths = new Set<string>();
	readonly #rulesOptionsByFile: Map<AnyRule, Map<string, object>>;

	private constructor(
		allFilePaths: Set<string>,
		rulesOptionsByFile: Map<AnyRule, Map<string, object>>,
		configDefinition: ProcessedConfigDefinition,
		host: LinterHost,
		{ cacheLocation, ignoreCache }: LintSessionOptions,
	) {
		this.allFilePaths = allFilePaths;
		this.#cacheLocation = cacheLocation || configDefinition.cacheLocation;
		this.#cacheUnread = !ignoreCache;
		this.#configFilePath = configDefinition.filePath;
		this.#caseSensitiveFS = host.isCaseSensitiveFS();
		this.#cwd = host.getCurrentDirectory();
		this.#host = host;
		this.#rulesOptionsByFile = rulesOptionsByFile;
		this.#languageFileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(host),
		);
		for (const filePath of allFilePaths) {
			this.#filePathsByKey.set(this.#key(filePath), filePath);
		}
	}

	static async create(
		configDefinition: ProcessedConfigDefinition,
		host: LinterHost,
		options: LintSessionOptions = {},
	): Promise<LintSession> {
		const { allFilePaths, useDefinitions } = await computeUseDefinitions(
			host,
			configDefinition,
		);

		return new LintSession(
			allFilePaths,
			collectRulesOptionsByFile(useDefinitions),
			configDefinition,
			host,
			options,
		);
	}

	/**
	 * Applies fixes from results and re-lints the changed files,
	 * for up to {@link maximumFixIterations} fixing rounds.
	 * The re-lint after the last round verifies the stored results.
	 */
	async fixFiles(
		initialResults: Map<string, FinalizedFileResults>,
		{ requestedSuggestions, ...lintOptions }: LintSessionFixOptions,
	): Promise<LintSessionFixResults> {
		const changed = new Set<string>();
		const lintedFilePaths = new Set(initialResults.keys());
		let results = initialResults;

		for (let iteration = 1; iteration <= maximumFixIterations; iteration += 1) {
			log(
				"Starting fix iteration %d of maximum %d",
				iteration,
				maximumFixIterations,
			);

			// flint-disable-next-line performance/loopAwaits
			const fixedFilePaths = await applyChangesToFiles(
				this.#host,
				results,
				requestedSuggestions,
			);
			if (!fixedFilePaths.length) {
				log("No file changes found, stopping.");
				break;
			}

			log("Applied changes to %d files.", fixedFilePaths.length);

			for (const filePath of fixedFilePaths) {
				changed.add(filePath);
			}

			// flint-disable-next-line performance/loopAwaits
			results = await this.lintChangedFiles(fixedFilePaths, lintOptions);

			for (const filePath of results.keys()) {
				lintedFilePaths.add(filePath);
			}
		}

		return { changed, lintedFilePaths };
	}

	getResults(): LintResults {
		return {
			allFilePaths: new Set(this.allFilePaths),
			allFileResults: new Map(this.storedResults),
			cached: this.#cached && new Map(this.#cached),
			ruleCount: this.ruleCount,
		};
	}

	hasDependents(filePath: string): boolean {
		return this.#dependents.has(this.#key(filePath));
	}

	hasFilePath(filePath: string): boolean {
		return this.#filePathsByKey.has(this.#key(filePath));
	}

	/**
	 * Lints every file.
	 * The first call, if nothing was linted before it, restores the cache checkpoint
	 * when it is valid and lints only the files it reports as changed.
	 */
	async lint(options?: LintSessionLintOptions): Promise<LintResults> {
		const checkpoint =
			this.#cacheUnread &&
			(await readFromCache(
				this.#host,
				this.allFilePaths,
				this.#configFilePath,
				this.#cacheLocation,
			));
		this.#cacheUnread = false;

		if (checkpoint) {
			this.#restoreCachedResults(checkpoint.files);
			await this.lintChangedFiles(checkpoint.changedFilePaths, options);
		} else {
			await this.lintFiles(this.allFilePaths, options);
		}

		return this.getResults();
	}

	async lintChangedFiles(
		filePaths: Iterable<string>,
		options?: LintSessionChangedLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		const changedPaths = [...filePaths, ...this.#pendingFilePaths];
		const affected = this.#getAffectedFilePaths(changedPaths);
		for (const filePath of affected) {
			this.#pendingFilePaths.add(filePath);
		}
		const allResults = new Map<string, FinalizedFileResults>();
		const attempted = new Set<string>();

		const lintPass = async (passFilePaths: Set<string>): Promise<void> => {
			for (const filePath of passFilePaths) {
				attempted.add(filePath);
			}
			const results = await this.lintFiles(passFilePaths, options);
			if (!results.size) {
				return;
			}
			for (const [filePath, fileResults] of results) {
				allResults.set(filePath, fileResults);
			}
			await options?.onResults?.(results);
		};

		await lintPass(this.#resolveFilePaths(changedPaths));
		while (true) {
			const remaining = affected
				.union(
					this.#getAffectedFilePaths([...changedPaths, ...allResults.keys()]),
				)
				.difference(attempted);
			if (!remaining.size) {
				break;
			}
			// Each pass can reveal additional global dependencies.
			// flint-disable-next-line performance/loopAwaits
			await lintPass(remaining);
		}

		return allResults;
	}

	async lintFiles(
		filePaths: Iterable<string>,
		options?: LintSessionLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		const filePathsToLint = this.#resolveFilePaths(filePaths);
		if (!filePathsToLint.size) {
			return new Map();
		}
		this.#cacheUnread = false;
		for (const filePath of filePathsToLint) {
			this.#pendingFilePaths.add(filePath);
		}
		const timestamp = Date.now();

		const languageFilesByFilePath = collectLanguageFilesByFilePath(
			this.#rulesOptionsByFile,
			this.#host,
			filePathsToLint,
			this.#languageFileFactories,
		);

		using files = new DisposableStack();

		for (const languageAndFiles of languageFilesByFilePath.values()) {
			for (const { file } of languageAndFiles) {
				files.use(file);
			}
		}

		const reportsByFilePath = await runRules(
			languageFilesByFilePath,
			this.#rulesOptionsByFile,
			this.#host,
		);
		const filesResults = new Map<string, FinalizedFileResults>();

		for (const [filePath, languageAndFiles] of languageFilesByFilePath) {
			const fileResults = finalizeFileResults(
				filePath,
				languageAndFiles,
				reportsByFilePath.get(filePath),
				this.#host,
				options?.skipLanguageReports,
			);
			fileResults.timestamp = timestamp;

			filesResults.set(filePath, fileResults);
			this.#storeResults(filePath, fileResults);
		}

		return filesResults;
	}

	/**
	 * Writes a cache checkpoint of the session's current results.
	 */
	[Symbol.dispose](): void {
		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
	}

	async writeCache(): Promise<void> {
		await writeToCache(
			this.#host,
			this.#configFilePath,
			this.getResults(),
			this.#cacheLocation,
		);
	}

	#getAffectedFilePaths(filePaths: Iterable<string>): Set<string> {
		const changed = Array.from(filePaths);
		if (
			changed.some((filePath) =>
				this.#globalDependencies.has(this.#key(filePath)),
			)
		) {
			return this.#resolveFilePaths(this.storedResults.keys());
		}
		const affected = this.#resolveFilePaths(changed).union(
			collectTransitiveDependents(
				changed.map((filePath) => this.#key(filePath)),
				(key) => this.#dependents.get(key),
				(filePath) => this.#key(filePath),
			),
		);
		if (
			affected
				.values()
				.some((filePath) => this.#globalDependencies.has(this.#key(filePath)))
		) {
			return this.#resolveFilePaths(this.storedResults.keys());
		}
		return affected;
	}

	#key(filePath: string): string {
		return pathKey(resolve(this.#cwd, filePath), this.#caseSensitiveFS);
	}

	#resolveFilePaths(filePaths: Iterable<string>): Set<string> {
		const resolved = new Set<string>();
		for (const filePath of filePaths) {
			const recognized = this.#filePathsByKey.get(this.#key(filePath));
			if (recognized !== undefined) {
				resolved.add(recognized);
			}
		}
		return resolved;
	}

	#restoreCachedResults(cached: Map<string, FileCacheStorage>): void {
		this.#cached = new Map();
		for (const [filePath, result] of cached) {
			if (result.isGlobalDependency) {
				this.#globalDependencies.add(this.#key(filePath));
			}
			if (!this.hasFilePath(filePath)) {
				continue;
			}
			this.#storeResults(filePath, {
				dependencies: new Set(
					result.dependencies?.map((dependency) => this.#key(dependency)),
				),
				isGlobalDependency: result.isGlobalDependency ?? false,
				languageReports: result.languageReports ?? [],
				missingDependencies: new Set(
					result.missingDependencies?.map((dependency) =>
						this.#key(dependency),
					),
				),
				reports: result.reports ?? [],
				timestamp: result.timestamp,
			});
			this.#cached.set(filePath, result);
		}
	}

	#storeResults(filePath: string, result: FinalizedFileResults): void {
		const previous = this.storedResults.get(filePath);
		for (const dependency of [
			...(previous?.dependencies ?? []),
			...(previous?.missingDependencies ?? []),
		]) {
			const dependents = this.#dependents.get(dependency);
			if (dependents?.delete(filePath) && !dependents.size) {
				this.#dependents.delete(dependency);
			}
		}
		this.storedResults.set(filePath, result);
		this.#pendingFilePaths.delete(filePath);
		this.#cached?.delete(filePath);
		if (result.isGlobalDependency) {
			this.#globalDependencies.add(this.#key(filePath));
		} else {
			this.#globalDependencies.delete(this.#key(filePath));
		}
		for (const dependency of [
			...result.dependencies,
			...result.missingDependencies,
		]) {
			let dependents = this.#dependents.get(dependency);
			if (!dependents) {
				dependents = new Set();
				this.#dependents.set(dependency, dependents);
			}
			dependents.add(filePath);
		}
	}
}
