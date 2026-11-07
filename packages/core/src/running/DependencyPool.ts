import { nullThrows } from "@flint.fyi/utils";

interface DependencyGroup {
	key: string;
	references: number;
	values: ReadonlySet<string>;
}

interface DependencyPath {
	id: number;
	references: number;
	value: string;
}

/** Session-owned paths and immutable dependency sets, released when results are replaced. */
export class DependencyPool {
	readonly #groups = new Map<string, DependencyGroup>();
	readonly #groupsByValues = new WeakMap<Iterable<string>, DependencyGroup>();
	#nextPathId = 0;
	readonly #normalize: (filePath: string) => string;
	readonly #paths = new Map<string, DependencyPath>();

	constructor(normalize: (filePath: string) => string) {
		this.#normalize = normalize;
	}

	release(values: ReadonlySet<string> | undefined): void {
		if (!values) {
			return;
		}
		const group = nullThrows(
			this.#groupsByValues.get(values),
			"Dependencies are retained",
		);
		if (--group.references) {
			return;
		}
		this.#groups.delete(group.key);
		this.#groupsByValues.delete(values);
		for (const value of values) {
			const path = nullThrows(this.#paths.get(value), "Path is interned");
			if (!--path.references) {
				this.#paths.delete(value);
			}
		}
	}

	retain(filePaths: Iterable<string>): ReadonlySet<string> {
		const retained = this.#groupsByValues.get(filePaths);
		if (retained?.references) {
			retained.references++;
			return retained.values;
		}
		const paths = new Set<DependencyPath>();
		for (const filePath of filePaths) {
			let path = this.#paths.get(filePath);
			if (!path) {
				const value = this.#normalize(filePath);
				path = this.#paths.get(value);
				if (!path) {
					path = { id: this.#nextPathId++, references: 0, value };
					this.#paths.set(value, path);
				}
			}
			paths.add(path);
		}
		const key = Array.from(paths, (path) => path.id)
			.toSorted((a, b) => a - b)
			.join(",");
		const existing = this.#groups.get(key);
		if (existing) {
			existing.references++;
			this.#groupsByValues.set(filePaths, existing);
			return existing.values;
		}
		const values = new Set(
			Array.from(paths, (path) => {
				path.references++;
				return path.value;
			}),
		);
		const group = { key, references: 1, values };
		this.#groups.set(key, group);
		this.#groupsByValues.set(filePaths, group);
		this.#groupsByValues.set(values, group);
		return values;
	}
}
