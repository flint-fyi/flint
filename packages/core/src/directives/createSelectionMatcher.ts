import { CachedFactory } from "cached-factory";

const matchers = new CachedFactory(
	(selection: string) => new RegExp(`^${selection.replaceAll("*", ".*")}$`),
);

// TODO: There's got to be a better way.
// Maybe an existing common one like minimatch?
// https://github.com/flint-fyi/flint/issues/245
export function createSelectionMatcher(selection: string): RegExp {
	return matchers.get(selection);
}
