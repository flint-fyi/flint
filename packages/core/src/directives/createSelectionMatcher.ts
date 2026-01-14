// TODO: There's got to be a better way.
// Maybe an existing common one like minimatch?
// https://github.com/flint-fyi/flint/issues/245
export function createSelectionMatcher(selection: string) {
	return new RegExp(`^${selection.replaceAll("*", ".*")}$`);
}
