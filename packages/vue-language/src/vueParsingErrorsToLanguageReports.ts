import type { LanguageReports } from "@flint.fyi/core";
import type { CompilerError } from "@vue/compiler-dom";

export function vueParsingErrorsToLanguageReports(
	fileName: string,
	errors: (CompilerError | SyntaxError)[],
): LanguageReports {
	return errors.map((error) => {
		let code = "VUE";
		let loc = "";
		if ("code" in error) {
			code += error.code.toString();
			loc =
				error.loc != null
					? `:${error.loc.start.line}:${error.loc.start.column}`
					: "";
		}
		return {
			code,
			text: `${fileName}${loc} - ${code}: ${error.name} - ${error.message}`,
		};
	});
}
