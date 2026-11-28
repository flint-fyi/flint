import { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import { pathKey, type PromiseOrSync } from "@flint.fyi/utils";

import { collectTransitiveDependents } from "../cache/collectTransitiveDependents.ts";
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

export interface LintSessionChangedLintOptions extends LintSessionLintOptions {
	onResults?: (
		results: Map<string, FinalizedFileResults>,
	) => PromiseOrSync<void>;
}

export interface LintSessionLintOptions {
	skipLanguageReports?: boolean;
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
	readonly #caseSensitiveFS: boolean;
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
		host: LinterHost,
	) {
		this.allFilePaths = allFilePaths;
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
	): Promise<LintSession> {
		const { allFilePaths, useDefinitions } = await computeUseDefinitions(
			host,
			configDefinition,
		);

		return new LintSession(
			allFilePaths,
			collectRulesOptionsByFile(useDefinitions),
			host,
		);
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

	restoreCachedResults(cached: Map<string, FileCacheStorage>): void {
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
				reports: result.reports ?? [],
				timestamp: result.timestamp,
			});
			this.#cached.set(filePath, result);
		}
	}

	[Symbol.dispose](): void {
		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
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

	#storeResults(filePath: string, result: FinalizedFileResults): void {
		const previous = this.storedResults.get(filePath);
		for (const dependency of previous?.dependencies ?? []) {
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
		for (const dependency of result.dependencies) {
			let dependents = this.#dependents.get(dependency);
			if (!dependents) {
				dependents = new Set();
				this.#dependents.set(dependency, dependents);
			}
			dependents.add(filePath);
		}
	}
}
