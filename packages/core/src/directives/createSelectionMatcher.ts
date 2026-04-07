// TODO: Replace this minimal *-only glob matcher with a dedicated library
// such as minimatch if directive selection syntax expands.
// https://github.com/flint-fyi/flint/issues/245
export function createSelectionMatcher(selection: string) {
	return new RegExp(`^${escapeForRegExp(selection).replaceAll("\\*", ".*")}$`);
}

function escapeForRegExp(value: string) {
	return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");
}
