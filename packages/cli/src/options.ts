import type { parseArgs, ParseArgsOptionsConfig } from "node:util";

export const options = {
	"cache-ignore": {
		type: "boolean",
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
	"skip-diagnostics": {
		multiple: true,
		type: "string",
	},
	version: {
		type: "boolean",
	},
	watch: {
		type: "boolean",
	},
} satisfies ParseArgsOptionsConfig;

export type OptionsValues = ReturnType<
	typeof parseArgs<{ options: typeof options }>
>["values"];
