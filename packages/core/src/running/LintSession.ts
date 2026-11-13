import { CachedFactory } from "cached-factory";

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
import { LintSessionResults } from "./LintSessionResults.ts";
import { runRules } from "./runRules.ts";

export interface LintSessionLintOptions {
	skipLanguageReports?: boolean;
}

export class LintSession implements Disposable {
	readonly allFilePaths: Set<string>;
	get ruleCount(): number {
		return this.#rulesOptionsByFile.size;
	}

	get storedResults(): Map<string, FinalizedFileResults> {
		return this.#results.files;
	}

	readonly #host: LinterHost;
	readonly #languageFileFactories: CachedFactory<
		AnyLanguage,
		AnyLanguageFileFactory
	>;
	readonly #results: LintSessionResults;
	readonly #rulesOptionsByFile: Map<AnyRule, Map<string, object>>;

	private constructor(
		allFilePaths: Set<string>,
		rulesOptionsByFile: Map<AnyRule, Map<string, object>>,
		host: LinterHost,
	) {
		this.allFilePaths = allFilePaths;
		this.#results = new LintSessionResults(
			allFilePaths,
			host.getCurrentDirectory(),
			host.isCaseSensitiveFS(),
		);
		this.#host = host;
		this.#rulesOptionsByFile = rulesOptionsByFile;
		this.#languageFileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(host),
		);
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
		return this.#results.snapshot(this.ruleCount);
	}

	hasDependents(filePath: string): boolean {
		return this.#results.hasDependents(filePath);
	}

	hasFilePath(filePath: string): boolean {
		return this.#results.hasFilePath(filePath);
	}

	hasStructuralDependency(filePath: string): boolean {
		return this.#results.hasStructuralDependency(filePath);
	}

	async lintChangedFiles(
		filePaths: Iterable<string>,
		options?: LintSessionLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		const changedPaths = Array.from(filePaths);
		const affected = this.#results.getAffectedFilePaths(changedPaths);
		if (
			changedPaths.some((filePath) => this.hasStructuralDependency(filePath))
		) {
			for (const [, factory] of this.#languageFileFactories.entries()) {
				factory[Symbol.dispose]?.();
			}
			this.#languageFileFactories.clear();
		}
		const allResults = new Map<string, FinalizedFileResults>();
		const attempted = new Set<string>();

		const lintPass = async (passFilePaths: Set<string>): Promise<void> => {
			for (const filePath of passFilePaths) {
				attempted.add(filePath);
			}
			for (const [filePath, fileResults] of await this.lintFiles(
				passFilePaths,
				options,
			)) {
				allResults.set(filePath, fileResults);
			}
		};

		await lintPass(this.#results.resolveFilePaths(changedPaths));
		while (true) {
			const remaining = affected
				.union(
					this.#results.getAffectedFilePaths([
						...changedPaths,
						...allResults.keys(),
					]),
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
		const filePathsToLint = this.#results.resolveFilePaths(filePaths);
		if (!filePathsToLint.size) {
			return new Map();
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
			this.#results.set(filePath, fileResults);
		}

		return filesResults;
	}

	restoreCachedResults(cached: Map<string, FileCacheStorage>): void {
		this.#results.restoreCheckpoint(cached);
	}

	[Symbol.dispose](): void {
		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
	}
}
