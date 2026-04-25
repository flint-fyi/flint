declare global {
	// TODO[typescript>=6.0]: Remove this declaration.
	// https://github.com/microsoft/TypeScript/pull/63046
	export interface RegExpConstructor {
		/**
		 * Escapes any RegExp syntax characters in the input string, returning a
		 * new string that can be safely interpolated into a RegExp as a literal
		 * string to match.
		 * @example
		 * ```ts
		 * const regExp = new RegExp(RegExp.escape("foo.bar"));
		 * regExp.test("foo.bar"); // true
		 * regExp.test("foo!bar"); // false
		 * ```
		 */
		escape(string: string): string;
	}
}

export function createSelectionMatcher(selection: string) {
	return new RegExp(`^${RegExp.escape(selection).replaceAll("\\*", ".*")}$`);
}
