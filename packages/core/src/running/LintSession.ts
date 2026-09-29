import { CachedFactory } from "cached-factory";
import { isAbsolute, resolve } from "pathe";

import { pathKey } from "@flint.fyi/utils";

import { collectTransitiveDependents } from "../cache/collectTransitiveDependents.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFileFactory,
} from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageFilesByFilePath } from "./collectLanguageFilesByFilePath.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import {
	finalizeFileResults,
	type FinalizedFileResults,
} from "./finalizeFileResults.ts";
import { runRules } from "./runRules.ts";

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

	readonly #caseSensitiveFS: boolean;

	/**
	 * Reverse index: dependency key -> file paths that depend on it.
	 * Maintained as results are stored so collecting files to lint avoids
	 * rescanning every stored result on each call.
	 */
	readonly #dependentsByDependencyKey = new Map<string, Set<string>>();
	readonly #filePathByKey = new Map<string, string>();
	readonly #host: LinterHost;
	readonly #languageFileFactories: CachedFactory<
		AnyLanguage,
		AnyLanguageFileFactory
	>;
	readonly #rulesOptionsByFile: Map<AnyRule, Map<string, object>>;

	private constructor(
		allFilePaths: Set<string>,
		rulesOptionsByFile: Map<AnyRule, Map<string, object>>,
		host: LinterHost,
	) {
		this.allFilePaths = allFilePaths;
		this.#caseSensitiveFS = host.isCaseSensitiveFS();
		this.#host = host;
		this.#rulesOptionsByFile = rulesOptionsByFile;
		this.#languageFileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(host),
		);

		for (const filePath of allFilePaths) {
			this.#filePathByKey.set(this.#toPathKey(filePath), filePath);
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

	hasDependents(filePath: string): boolean {
		return this.#dependentsByDependencyKey.has(this.#toPathKey(filePath));
	}

	hasFilePath(filePath: string): boolean {
		return this.#filePathByKey.has(this.#toPathKey(filePath));
	}

	async lintChangedFiles(
		filePaths: Iterable<string>,
		options?: LintSessionLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		const changedPaths = Array.from(filePaths);
		const changedKeys = new Set(
			changedPaths.map((filePath) => this.#toPathKey(filePath)),
		);
		const changedFilePaths = this.#resolveFilePaths(changedPaths);
		const allResults = new Map<string, FinalizedFileResults>();
		let invalidatesCache = Array.from(changedFilePaths).some(
			(filePath) => this.storedResults.get(filePath)?.invalidatesCache,
		);

		const lintPass = async (passFilePaths: Set<string>) => {
			for (const [filePath, fileResults] of await this.lintFiles(
				passFilePaths,
				options,
			)) {
				allResults.set(filePath, fileResults);
				if (fileResults.invalidatesCache) {
					invalidatesCache = true;
				}
			}
		};

		await lintPass(changedFilePaths);

		if (!invalidatesCache) {
			await lintPass(
				collectTransitiveDependents(
					changedKeys,
					(dependencyKey) => this.#dependentsByDependencyKey.get(dependencyKey),
					(filePath) => this.#toPathKey(filePath),
				).difference(new Set(allResults.keys())),
			);
		}

		if (invalidatesCache) {
			await lintPass(this.allFilePaths.difference(new Set(allResults.keys())));
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

			filesResults.set(filePath, fileResults);
			this.#storeResults(filePath, fileResults);
		}

		return filesResults;
	}

	restoreCachedResults(cached: Map<string, FileCacheStorage>): void {
		for (const [filePath, cachedStorage] of cached) {
			this.#storeResults(filePath, {
				dependencies: new Set(cachedStorage.dependencies),
				invalidatesCache: cachedStorage.invalidatesCache ?? false,
				languageReports: cachedStorage.languageReports ?? [],
				reports: cachedStorage.reports ?? [],
			});
		}
	}

	[Symbol.dispose](): void {
		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
	}

	#resolveFilePaths(filePaths: Iterable<string>): Set<string> {
		const resolvedFilePaths = new Set<string>();

		for (const filePath of filePaths) {
			const lintedFilePath = this.#filePathByKey.get(this.#toPathKey(filePath));
			if (lintedFilePath != null) {
				resolvedFilePaths.add(lintedFilePath);
			}
		}

		return resolvedFilePaths;
	}

	#storeResults(filePath: string, fileResults: FinalizedFileResults): void {
		const previous = this.storedResults.get(filePath);
		if (previous) {
			for (const dependencyKey of previous.dependencies) {
				const dependents = this.#dependentsByDependencyKey.get(dependencyKey);
				if (dependents?.delete(filePath) && !dependents.size) {
					this.#dependentsByDependencyKey.delete(dependencyKey);
				}
			}
		}

		this.storedResults.set(filePath, fileResults);

		for (const dependencyKey of fileResults.dependencies) {
			let dependents = this.#dependentsByDependencyKey.get(dependencyKey);
			if (dependents == null) {
				dependents = new Set();
				this.#dependentsByDependencyKey.set(dependencyKey, dependents);
			}
			dependents.add(filePath);
		}
	}

	#toPathKey(filePath: string): string {
		return pathKey(
			isAbsolute(filePath)
				? filePath
				: resolve(this.#host.getCurrentDirectory(), filePath),
			this.#caseSensitiveFS,
		);
	}
}
