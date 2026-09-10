import path from "node:path";

import { CachedFactory } from "cached-factory";

import { pathKey } from "@flint.fyi/utils";

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

	async lintAll(
		options?: LintSessionLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		return await this.lintFiles(this.allFilePaths, options);
	}

	async lintFiles(
		filePaths: Iterable<string>,
		options?: LintSessionLintOptions,
	): Promise<Map<string, FinalizedFileResults>> {
		const lintedFilePaths = this.#collectFilePathsToLint(filePaths);
		if (!lintedFilePaths.size) {
			return new Map();
		}

		this.#addFilesRequiredByRules(lintedFilePaths);

		const languageFilesByFilePath = collectLanguageFilesByFilePath(
			this.#rulesOptionsByFile,
			this.#host,
			{
				filePaths: lintedFilePaths,
				languageFileFactories: this.#languageFileFactories,
			},
		);

		try {
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
		} finally {
			for (const languageAndFiles of languageFilesByFilePath.values()) {
				for (const { file } of languageAndFiles) {
					file[Symbol.dispose]();
				}
			}
		}
	}

	[Symbol.dispose](): void {
		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
	}

	#addFilesRequiredByRules(filePaths: Set<string>): void {
		for (const [rule, optionsByFile] of this.#rulesOptionsByFile) {
			if (
				!rule.requiresAllFiles ||
				!filePaths.intersection(optionsByFile).size
			) {
				continue;
			}

			for (const filePath of optionsByFile.keys()) {
				filePaths.add(filePath);
			}
		}
	}

	#collectFilePathsToLint(filePaths: Iterable<string>): Set<string> {
		const filePathsToLint = new Set<string>();
		const queuedKeys: string[] = [];
		const visitedKeys = new Set<string>();

		for (const filePath of filePaths) {
			const fileKey = this.#toPathKey(filePath);
			if (visitedKeys.has(fileKey)) {
				continue;
			}

			visitedKeys.add(fileKey);
			queuedKeys.push(fileKey);

			const lintedFilePath = this.#filePathByKey.get(fileKey);
			if (lintedFilePath == null) {
				continue;
			}

			if (this.storedResults.get(lintedFilePath)?.invalidatesCache) {
				return new Set(this.allFilePaths);
			}

			filePathsToLint.add(lintedFilePath);
		}

		for (const currentKey of queuedKeys) {
			const directDependents = this.#dependentsByDependencyKey.get(currentKey);
			if (directDependents == null) {
				continue;
			}

			for (const dependentFilePath of directDependents) {
				const dependentKey = this.#toPathKey(dependentFilePath);
				if (visitedKeys.has(dependentKey)) {
					continue;
				}

				visitedKeys.add(dependentKey);
				filePathsToLint.add(dependentFilePath);
				queuedKeys.push(dependentKey);
			}
		}

		return filePathsToLint;
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
			path.isAbsolute(filePath)
				? filePath
				: path.resolve(this.#host.getCurrentDirectory(), filePath),
			this.#caseSensitiveFS,
		);
	}
}
