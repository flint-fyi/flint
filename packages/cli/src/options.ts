import type { ParseArgsOptionsConfig } from "node:util";

export interface OptionsValues {
	"cache-ignore"?: boolean;
	"cache-location"?: string;
	fix?: boolean;
	"fix-suggestions"?: string[];
	help?: boolean;
	interactive?: boolean;
	presenter?: string;
	"skip-formatting"?: boolean;
	"skip-language-reports"?: boolean;
	version?: boolean;
	watch?: boolean;
}

export const options: ParseArgsOptionsConfig = {
	"cache-ignore": {
		type: "boolean",
	},
	"cache-location": {
		type: "string",
	},
	fix: {
		type: "boolean",
	},
	"fix-suggestions": {
		multiple: true,
		type: "string",
	},
	help: {
		type: "boolean",
	},
	interactive: {
		type: "boolean",
	},
	presenter: {
		type: "string",
	},
	"skip-formatting": {
		type: "boolean",
	},
	"skip-language-reports": {
		type: "boolean",
	},
	version: {
		type: "boolean",
	},
	watch: {
		type: "boolean",
	},
};
