// TODO: There's got to be a better way.
// Maybe an existing common one like minimatch?
// https://github.com/flint-fyi/flint/issues/245
const matchers = new Map<string, RegExp>();

export function createSelectionMatcher(selection: string): RegExp {
	let matcher = matchers.get(selection);

	if (!matcher) {
		matcher = new RegExp(`^${selection.replaceAll("*", ".*")}$`);
		matchers.set(selection, matcher);
	}

	return matcher;
}
