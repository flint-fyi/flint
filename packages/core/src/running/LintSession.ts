import path from "node:path";

import { CachedFactory } from "cached-factory";

import { makeAbsolute, nullThrows, pathKey } from "@flint.fyi/utils";

import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFile,
	AnyLanguageFileFactory,
} from "../types/languages.ts";
import type { FileResults } from "../types/linting.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";
import { runRules } from "./runRules.ts";
import type { LanguageAndFile, LanguageFilesWithOptions } from "./types.ts";

export interface LintSessionLintOptions {
	skipLanguageReports?: boolean;
}

export class LintSession implements Disposable {
	readonly allFilePaths: Set<string>;
	readonly storedResults = new Map<string, FileResults>();

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
	): Promise<Map<string, FileResults>> {
		return await this.lintFiles(this.allFilePaths, options);
	}

	async lintFiles(
		filePaths: Iterable<string>,
		options?: LintSessionLintOptions,
	): Promise<Map<string, FileResults>> {
		this.#assertNotDisposed();

		const lintedFilePaths = this.#resolveLintedFilePaths(filePaths);
		if (!lintedFilePaths.size) {
			return new Map();
		}

		const languageFilesByFilePath =
			this.#collectLanguageFilesByFilePath(lintedFilePaths);

		try {
			const rulesFilesAndOptionsByRule = this.#collectRulesFilesAndOptions(
				lintedFilePaths,
				languageFilesByFilePath,
			);

			const reportsByFilePath = await runRules(
				rulesFilesAndOptionsByRule,
				this.#host,
			);
			const filesResults = new Map<string, FileResults>();

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

	#assertNotDisposed(): void {
		if (this.#disposed) {
			throw new Error("LintSession has already been disposed.");
		}
	}

	#collectLanguageFilesByFilePath(
		filePaths: Set<string>,
	): Map<string, LanguageAndFile[]> {
		const filePathsByLanguage = new CachedFactory<AnyLanguage, Set<string>>(
			() => new Set(),
		);
		const languageFilesByFilePath = new CachedFactory<
			string,
			Map<AnyLanguage, AnyLanguageFile | undefined>
		>(() => new Map());

		for (const [rule, optionsByFile] of this.#rulesOptionsByFile) {
			for (const filePath of filePaths) {
				if (!optionsByFile.has(filePath)) {
					continue;
				}

				const filesByLanguage = languageFilesByFilePath.get(filePath);
				if (filesByLanguage.has(rule.language)) {
					continue;
				}

				filePathsByLanguage.get(rule.language).add(filePath);
				filesByLanguage.set(rule.language, undefined);
			}
		}

		for (const [language, languageFilePaths] of filePathsByLanguage.entries()) {
			const fileFactory = this.#languageFileFactories.get(language);
			const orderedFilePaths = language.orderFilePaths
				? language.orderFilePaths([...languageFilePaths], this.#host)
				: languageFilePaths;

			for (const filePath of orderedFilePaths) {
				const file = fileFactory.createFile({
					filePath,
					filePathAbsolute: makeAbsolute(filePath),
					sourceText: nullThrows(
						this.#host.readFileSync(filePath),
						`Expected ${filePath} to exist`,
					),
				});

				languageFilesByFilePath.get(filePath).set(language, file);
			}
		}

		return new Map(
			Array.from(languageFilesByFilePath.entries()).map(
				([filePath, filesByLanguage]) => [
					filePath,
					Array.from(filesByLanguage.entries()).map(([language, file]) => ({
						file: nullThrows(
							file,
							"Language file is expected to be present by the map",
						),
						language,
					})),
				],
			),
		);
	}

	#collectRulesFilesAndOptions(
		filePaths: Set<string>,
		languageFilesByFilePath: Map<string, LanguageAndFile[]>,
	): Map<AnyRule, LanguageFilesWithOptions[]> {
		const rulesFilesAndOptionsByRule = new Map<
			AnyRule,
			LanguageFilesWithOptions[]
		>();

		for (const [rule, optionsByFile] of this.#rulesOptionsByFile) {
			const filesAndOptions: LanguageFilesWithOptions[] = [];

			for (const filePath of filePaths) {
				const options = optionsByFile.get(filePath);
				if (options == null) {
					continue;
				}

				filesAndOptions.push({
					languageFiles: Array.from(
						nullThrows(
							languageFilesByFilePath.get(filePath),
							"Language file is expected to be present by the map",
						).values(),
					),
					options,
				});
			}

			if (filesAndOptions.length) {
				rulesFilesAndOptionsByRule.set(rule, filesAndOptions);
			}
		}

		return rulesFilesAndOptionsByRule;
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

	#storeResults(filePath: string, fileResults: FileResults): void {
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
