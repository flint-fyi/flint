import chalk from "chalk";

export const indenter = chalk.gray("│ ");

export const ColorCodes = {
	codeLineNumbers: "#bbb",
	codeWarningUnderline: "#fcc",
	defaultSuggestionColor: "#bbccdd",
	filePath: "#ff4949",
	filePathPrefix: "#ff7777",
	primaryMessage: "#eeaa77",
	reportAboutId: "#ff9999",
	ruleBracket: "#ccaaaa",
	ruleUrl: "#aaccaa",
	secondaryMessage: "#ccbbaa",
	suggestionMessage: "#99aacc",
	suggestionTextHighlight: "#bbeeff",
} as const;
