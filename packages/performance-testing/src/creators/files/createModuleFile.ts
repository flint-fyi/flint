export type ModuleCreator = (
	index: number,
	dependencies?: readonly ModuleDependency[],
) => string;

export interface ModuleDependency {
	index: number;
	path: string;
}

type ModuleKindCreator = (
	index: number,
	dependencies: readonly ModuleDependency[],
) => string;

// Every module exports `example${index}` resolving to a `Summary${index}` with a `total`,
// so modules can call their dependencies regardless of either one's complexity.
const moduleKindCreators: readonly ModuleKindCreator[] = [
	createSuperSimpleModule,
	createSimpleModule,
	createGenericModule,
	createResultModule,
	createComplexModule,
];

export function createModuleCycle(): ModuleCreator {
	const creators = cycleModuleKindCreators();

	return (index, dependencies = []) =>
		creators.next().value(index, dependencies);
}

function createComplexModule(
	index: number,
	dependencies: readonly ModuleDependency[],
): string {
	return `
		${createImports(dependencies)}

		export type Status${index} = "active" | "archived" | "pending";

		export interface Item${index} {
			readonly createdAt: Date;
			readonly id: string;
			metadata?: Record<string, number | string>;
			name: string;
			status: Status${index};
			tags: readonly string[];
		}

		export type ItemPatch${index} = Partial<Omit<Item${index}, "createdAt" | "id">>;

		export type Getters${index}<T> = {
			[Key in keyof T & string as \`get\${Capitalize<Key>}\`]: () => T[Key];
		};

		export type Unwrapped${index}<T> = T extends Promise<infer Value> ? Value : T;

		export type Result${index}<T> =
			| { error: Error; ok: false }
			| { ok: true; value: T };

		export interface Summary${index} {
			byStatus: Record<Status${index}, number>;
			dependencies: number;
			names: string[];
			tags: string[];
			total: number;
		}

		const statuses${index} = ["active", "archived", "pending"] as const satisfies readonly Status${index}[];

		export class Repository${index}<T extends { readonly id: string }> {
			readonly #items = new Map<string, T>();
			readonly #label: string;

			constructor(label: string) {
				this.#label = label;
			}

			get size(): number {
				return this.#items.size;
			}

			async findById(id: string): Promise<T | undefined> {
				await Promise.resolve();
				return this.#items.get(id);
			}

			list(predicate?: (item: T) => boolean): T[] {
				const items = [...this.#items.values()];
				return predicate ? items.filter(predicate) : items;
			}

			async save(item: T): Promise<Result${index}<T>> {
				try {
					await Promise.resolve();
					if (!item.id) {
						return { error: new Error(\`\${this.#label} items need an id\`), ok: false };
					}

					this.#items.set(item.id, item);
					return { ok: true, value: item };
				} catch (error) {
					return {
						error: error instanceof Error ? error : new Error("Unknown failure"),
						ok: false,
					};
				}
			}

			async update(id: string, patch: ItemPatch${index} & Partial<T>): Promise<Result${index}<T>> {
				const existing = await this.findById(id);
				if (existing === undefined) {
					return { error: new Error(\`\${this.#label} has no item \${id}\`), ok: false };
				}

				return this.save({ ...existing, ...patch });
			}
		}

		export function describe${index}(value: Date): string;
		export function describe${index}(value: number): string;
		export function describe${index}(value: Date | number): string {
			return typeof value === "number" ? value.toFixed(2) : value.toISOString();
		}

		export function createItem${index}(prefix: string, offset: number): Item${index} {
			return {
				createdAt: new Date(offset * 1000),
				id: \`\${prefix}-${index}-\${offset.toString()}\`,
				metadata: offset % 3 === 0 ? { priority: offset, source: prefix } : undefined,
				name: \`Item \${describe${index}(offset)}\`,
				status: statuses${index}[offset % statuses${index}.length],
				tags: offset % 2 === 0 ? ["even", prefix] : ["odd"],
			};
		}

		export function summarize${index}(items: readonly Item${index}[], dependencies: number): Summary${index} {
			const byStatus: Record<Status${index}, number> = { active: 0, archived: 0, pending: 0 };
			for (const item of items) {
				byStatus[item.status] += 1;
			}

			return {
				byStatus,
				dependencies,
				names: items.map((item) => item.name.toUpperCase()).toSorted((first, second) => first.localeCompare(second)),
				tags: [...new Set(items.flatMap((item) => item.tags))].toSorted(),
				total: items.length,
			};
		}

		export async function example${index}(prefix: string): Promise<Summary${index}> {
			const repository = new Repository${index}<Item${index}>(\`\${prefix}repository${index}\`);
			const results = await Promise.all(
				Array.from({ length: 4 }, (_, offset) => repository.save(createItem${index}(prefix, offset))),
			);

			const failures = results.filter((result) => !result.ok);
			if (failures.length > 0) {
				throw new Error(\`Failed to save \${failures.length.toString()} items\`);
			}

			const archived = await repository.update(\`\${prefix}-${index}-0\`, { status: "archived" });
			if (!archived.ok) {
				throw archived.error;
			}

			${createDependencyTotal(dependencies)}

			const summary: Unwrapped${index}<ReturnType<typeof example${index}>> = summarize${index}(
				repository.list((item) => item.status !== "pending"),
				dependencyTotal,
			);
			const getters: Pick<Getters${index}<Summary${index}>, "getTotal"> = {
				getTotal: () => summary.total,
			};

			return { ...summary, total: getters.getTotal() };
		}
	`;
}

function createDependencyTotal(
	dependencies: readonly ModuleDependency[],
): string {
	if (dependencies.length === 0) {
		return "const dependencyTotal = 0;";
	}

	return `
		const dependencySummaries: [${dependencies
			.map((dependency) => `Summary${dependency.index}`)
			.join(", ")}] = await Promise.all([${dependencies
			.map((dependency) => `example${dependency.index}(prefix)`)
			.join(", ")}]);
		const dependencyTotal = dependencySummaries.reduce((total, summary) => total + summary.total, 0);
	`;
}

function createGenericModule(
	index: number,
	dependencies: readonly ModuleDependency[],
): string {
	return `
		${createImports(dependencies)}

		export interface Summary${index} {
			groups: number;
			total: number;
		}

		export interface Keyed${index} {
			readonly key: string;
		}

		export class Cache${index}<Key, Value> {
			readonly #entries = new Map<Key, Value>();

			get(key: Key, create: (key: Key) => Value): Value {
				const existing = this.#entries.get(key);
				if (existing !== undefined) {
					return existing;
				}

				const created = create(key);
				this.#entries.set(key, created);
				return created;
			}
		}

		export function groupBy${index}<T, Key extends PropertyKey>(
			items: readonly T[],
			getKey: (item: T) => Key,
		): Map<Key, T[]> {
			const groups = new Map<Key, T[]>();
			for (const item of items) {
				const key = getKey(item);
				const group = groups.get(key);
				if (group) {
					group.push(item);
				} else {
					groups.set(key, [item]);
				}
			}

			return groups;
		}

		export function pluck${index}<T, Key extends keyof T>(items: readonly T[], key: Key): T[Key][] {
			return items.map((item) => item[key]);
		}

		export async function example${index}(prefix: string): Promise<Summary${index}> {
			${createDependencyTotal(dependencies)}
			await Promise.resolve();

			const cache = new Cache${index}<string, Keyed${index}[]>();
			const items = cache.get(prefix, (key) => [
				{ key: \`\${key}a\` },
				{ key: \`\${key}bb\` },
				{ key: \`\${key}a\` },
			]);
			const groups = groupBy${index}(pluck${index}(items, "key"), (key) => key.length);

			return { groups: groups.size, total: items.length + dependencyTotal };
		}
	`;
}

function createImports(dependencies: readonly ModuleDependency[]): string {
	return dependencies
		.map(
			(dependency) =>
				`import { example${dependency.index}, type Summary${dependency.index} } from "${dependency.path}";`,
		)
		.join("\n");
}

function createResultModule(
	index: number,
	dependencies: readonly ModuleDependency[],
): string {
	return `
		${createImports(dependencies)}

		export interface Summary${index} {
			failures: string[];
			total: number;
		}

		export type Result${index}<T> =
			| { error: string; ok: false }
			| { ok: true; value: T };

		export type Event${index} =
			| { amount: number; kind: "deposit" }
			| { amount: number; kind: "withdrawal" }
			| { kind: "close"; reason: string };

		export function parseAmount${index}(input: string): Result${index}<number> {
			const amount = Number(input);
			return Number.isFinite(amount) && amount >= 0
				? { ok: true, value: amount }
				: { error: \`Invalid amount: \${input}\`, ok: false };
		}

		export function applyEvent${index}(balance: number, event: Event${index}): Result${index}<number> {
			switch (event.kind) {
				case "close":
					return balance === 0
						? { ok: true, value: 0 }
						: { error: \`Cannot close: \${event.reason}\`, ok: false };
				case "deposit":
					return { ok: true, value: balance + event.amount };
				case "withdrawal":
					return event.amount > balance
						? { error: "Insufficient funds", ok: false }
						: { ok: true, value: balance - event.amount };
			}
		}

		export async function example${index}(prefix: string): Promise<Summary${index}> {
			${createDependencyTotal(dependencies)}
			await Promise.resolve();

			const failures: string[] = [];
			let balance = 0;
			for (const input of [prefix.length.toString(), "12", "-3"]) {
				const amount = parseAmount${index}(input);
				if (!amount.ok) {
					failures.push(amount.error);
					continue;
				}

				const applied = applyEvent${index}(balance, { amount: amount.value, kind: "deposit" });
				if (applied.ok) {
					balance = applied.value;
				} else {
					failures.push(applied.error);
				}
			}

			return { failures, total: balance + dependencyTotal };
		}
	`;
}

function createSimpleModule(
	index: number,
	dependencies: readonly ModuleDependency[],
): string {
	return `
		${createImports(dependencies)}

		export interface Summary${index} {
			labels: string[];
			total: number;
		}

		interface Entry${index} {
			count: number;
			label: string;
		}

		const entries${index}: Entry${index}[] = [
			{ count: 1, label: "alpha" },
			{ count: 2, label: "beta" },
			{ count: 3, label: "gamma" },
		];

		export function formatEntry${index}(entry: Entry${index}): string {
			return \`\${entry.label} (\${entry.count.toString()})\`;
		}

		export async function example${index}(prefix: string): Promise<Summary${index}> {
			${createDependencyTotal(dependencies)}
			await Promise.resolve();

			const labels = entries${index}
				.filter((entry) => entry.count > 1)
				.map((entry) => prefix + formatEntry${index}(entry));

			return { labels, total: labels.length + dependencyTotal };
		}
	`;
}

function createSuperSimpleModule(index: number): string {
	return `
		export interface Summary${index} {
			total: number;
		}

		export async function example${index}(prefix: string): Promise<Summary${index}> {
			await Promise.resolve();
			return { total: prefix.length + ${index} };
		}
	`;
}

function* cycleModuleKindCreators(): Generator<ModuleKindCreator, never> {
	while (true) {
		for (const creator of moduleKindCreators) {
			yield creator;
			yield creator;
		}
	}
}
