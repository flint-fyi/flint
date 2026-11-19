export function collectTransitiveDependents(
	seedKeys: Iterable<string>,
	getDependents: (dependencyKey: string) => Iterable<string> | undefined,
	toPathKey: (filePath: string) => string,
): Set<string> {
	const dependents = new Set<string>();
	const visitedKeys = new Set(seedKeys);
	const queuedKeys = Array.from(visitedKeys);

	for (const currentKey of queuedKeys) {
		for (const dependent of getDependents(currentKey) ?? []) {
			const dependentKey = toPathKey(dependent);
			if (visitedKeys.has(dependentKey)) {
				continue;
			}

			visitedKeys.add(dependentKey);
			dependents.add(dependent);
			queuedKeys.push(dependentKey);
		}
	}

	return dependents;
}
