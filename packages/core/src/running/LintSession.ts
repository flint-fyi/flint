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
import { collectRulesFilesAndOptions } from "./collectRulesFilesAndOptions.ts";
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
	readonly #dependentsByDependencyKey = new Map<string, Set<string>>();
	#disposed = false;
	readonly #filePathByKey = new Map<string, string>();
	readonly #host: LinterHost;
	readonly #languageFileFactories: CachedFactory<
		AnyLanguage,
		AnyLanguageFileFactory
	>;
	readonly #rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>;

	private constructor(
		allFilePaths: Set<string>,
		rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
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

	dispose(): void {
		if (this.#disposed) {
			return;
		}

		this.#disposed = true;

		for (const [, fileFactory] of this.#languageFileFactories.entries()) {
			fileFactory[Symbol.dispose]?.();
		}
	}

	getTransitiveDependentsOf(filePaths: Iterable<string>): Set<string> {
		this.#assertNotDisposed();

		const dependents = new Set<string>();
		const inputKeys = new Set(
			Array.from(filePaths, (filePath) => this.#toPathKey(filePath)),
		);
		const queuedKeys = Array.from(inputKeys);
		const visitedKeys = new Set(inputKeys);

		for (const currentKey of queuedKeys) {
			const directDependents = this.#dependentsByDependencyKey.get(currentKey);
			if (directDependents == null) {
				continue;
			}

			for (const filePath of directDependents) {
				const fileKey = this.#toPathKey(filePath);
				if (visitedKeys.has(fileKey)) {
					continue;
				}

				visitedKeys.add(fileKey);
				dependents.add(filePath);
				queuedKeys.push(fileKey);
			}
		}

		return dependents;
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
		this.#assertNotDisposed();

		const lintedFilePaths = this.#resolveLintedFilePaths(filePaths);
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
			const rulesFilesAndOptionsByRule = collectRulesFilesAndOptions(
				this.#rulesOptionsByFile,
				languageFilesByFilePath,
			);

			const reportsByFilePath = await runRules(
				rulesFilesAndOptionsByRule,
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
		this.dispose();
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

	#assertNotDisposed(): void {
		if (this.#disposed) {
			throw new Error("LintSession has already been disposed.");
		}
	}

	#resolveLintedFilePaths(filePaths: Iterable<string>): Set<string> {
		const lintedFilePaths = new Set<string>();

		for (const filePath of filePaths) {
			const lintedFilePath = this.#filePathByKey.get(this.#toPathKey(filePath));
			if (lintedFilePath != null) {
				lintedFilePaths.add(lintedFilePath);
			}
		}

		return lintedFilePaths;
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
