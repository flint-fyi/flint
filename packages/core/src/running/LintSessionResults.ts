import { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import { pathKey } from "@flint.fyi/utils";

import { collectTransitiveDependents } from "../cache/collectTransitiveDependents.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { LintResults } from "../types/linting.ts";
import { DependencyPool } from "./DependencyPool.ts";
import type { FinalizedFileResults } from "./finalizeFileResults.ts";

/** Result/checkpoint state, independent of language factories and filesystem I/O. */
export class LintSessionResults {
	readonly files: Map<string, FinalizedFileResults> = new Map<
		string,
		FinalizedFileResults
	>();
	readonly #allFilePaths: Set<string>;
	#cached: Map<string, FileCacheStorage> | undefined;
	readonly #caseSensitiveFS: boolean;
	readonly #cwd: string;
	readonly #dependencies: DependencyPool;
	readonly #dependents = new Map<string, Set<string>>();
	#dependentsChanged = false;
	readonly #filePathsByKey = new Map<string, string>();
	readonly #globalDependencies = new Set<string>();
	readonly #sharedDependents = new WeakSet<ReadonlySet<string>>();

	constructor(
		allFilePaths: Set<string>,
		cwd: string,
		caseSensitiveFS: boolean,
	) {
		this.#allFilePaths = allFilePaths;
		this.#cwd = cwd;
		this.#caseSensitiveFS = caseSensitiveFS;
		this.#dependencies = new DependencyPool((filePath) => this.#key(filePath));
		for (const filePath of allFilePaths) {
			this.#filePathsByKey.set(this.#key(filePath), filePath);
		}
	}

	getAffectedFilePaths(filePaths: Iterable<string>): Set<string> {
		const changed = Array.from(filePaths);
		if (
			changed.some(
				(filePath) =>
					this.hasStructuralDependency(filePath) ||
					this.#globalDependencies.has(this.#key(filePath)),
			)
		) {
			return new Set(this.#allFilePaths);
		}
		const affected = this.resolveFilePaths(changed).union(
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
			return new Set(this.#allFilePaths);
		}
		return affected;
	}

	hasDependents(filePath: string): boolean {
		return this.#dependents.has(this.#key(filePath));
	}

	hasFilePath(filePath: string): boolean {
		return this.#filePathsByKey.has(this.#key(filePath));
	}

	hasStructuralDependency(filePath: string): boolean {
		const key = this.#key(filePath);
		return this.files
			.values()
			.some((result) => result.structuralDependencies?.has(key));
	}

	resolveFilePaths(filePaths: Iterable<string>): Set<string> {
		const resolved = new Set<string>();
		for (const filePath of filePaths) {
			const recognized = this.#filePathsByKey.get(this.#key(filePath));
			if (recognized !== undefined) {
				resolved.add(recognized);
			}
		}
		return resolved;
	}

	restoreCheckpoint(checkpoint: Map<string, FileCacheStorage>): void {
		this.#cached = new Map();
		const dependencies = new CachedFactory(
			(paths: readonly string[] | undefined) => new Set(paths),
		);
		for (const [filePath, result] of checkpoint) {
			if (result.isGlobalDependency) {
				this.#globalDependencies.add(this.#key(filePath));
			}
			if (!this.hasFilePath(filePath)) {
				continue;
			}
			this.set(filePath, {
				dependencies: dependencies.get(result.dependencies),
				isGlobalDependency: result.isGlobalDependency ?? false,
				languageReports: result.languageReports ?? [],
				reports: result.reports ?? [],
				timestamp: result.timestamp,
				...(result.structuralDependencies && {
					structuralDependencies: dependencies.get(
						result.structuralDependencies,
					),
				}),
			});
			this.#cached.set(filePath, result);
		}
		this.#shareDependents();
	}

	set(filePath: string, result: FinalizedFileResults): void {
		const previous = this.files.get(filePath);
		result.dependencies = this.#dependencies.retain(result.dependencies);
		if (result.structuralDependencies) {
			Object.assign(result, {
				structuralDependencies: this.#dependencies.retain(
					result.structuralDependencies,
				),
			});
		}
		for (const dependency of previous?.dependencies ?? []) {
			if (result.dependencies.has(dependency)) {
				continue;
			}
			const dependents = this.#writableDependents(dependency);
			if (dependents.delete(filePath) && !dependents.size) {
				this.#dependents.delete(dependency);
			}
		}
		this.#dependencies.release(previous?.dependencies);
		this.#dependencies.release(previous?.structuralDependencies);
		this.files.set(filePath, result);
		this.#cached?.delete(filePath);
		if (result.isGlobalDependency) {
			this.#globalDependencies.add(this.#key(filePath));
		} else {
			this.#globalDependencies.delete(this.#key(filePath));
		}
		for (const dependency of result.dependencies) {
			if (previous?.dependencies.has(dependency)) {
				continue;
			}
			this.#writableDependents(dependency).add(filePath);
		}
	}

	snapshot(ruleCount: number): LintResults {
		this.#shareDependents();
		return {
			allFilePaths: new Set(this.#allFilePaths),
			allFileResults: new Map(this.files),
			cached: this.#cached && new Map(this.#cached),
			ruleCount,
		};
	}

	#key(filePath: string): string {
		return pathKey(resolve(this.#cwd, filePath), this.#caseSensitiveFS);
	}

	#shareDependents(): void {
		if (!this.#dependentsChanged) {
			return;
		}
		const groups = new DependencyPool((filePath) => filePath);
		for (const [dependency, dependents] of this.#dependents) {
			const shared = groups.retain(dependents);
			this.#sharedDependents.add(shared);
			this.#dependents.set(dependency, shared as Set<string>);
		}
		this.#dependentsChanged = false;
	}

	#writableDependents(dependency: string): Set<string> {
		let dependents = this.#dependents.get(dependency);
		if (!dependents || this.#sharedDependents.has(dependents)) {
			dependents = new Set(dependents);
			this.#dependents.set(dependency, dependents);
		}
		this.#dependentsChanged = true;
		return dependents;
	}
}
