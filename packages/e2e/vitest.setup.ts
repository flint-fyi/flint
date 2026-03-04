import { expect, type SnapshotSerializer } from "vitest";
import ansiSerializer from "vitest-ansi-serializer";

// Map ANSI color codes to readable names
const colorCodes: Record<string, string> = {
	// Reset
	"0": "/",
	// Styles
	"1": "bold",
	"2": "dim",
	"3": "italic",
	"4": "underline",
	"22": "/bold",
	"23": "/italic",
	"24": "/underline",
	// Foreground colors
	"30": "black",
	"31": "red",
	"32": "green",
	"33": "yellow",
	"34": "blue",
	"35": "magenta",
	"36": "cyan",
	"37": "white",
	"39": "/fg",
	"90": "dim",
	// Background colors
	"40": "bg:black",
	"41": "bg:red",
	"42": "bg:green",
	"43": "bg:yellow",
	"44": "bg:blue",
	"45": "bg:magenta",
	"46": "bg:cyan",
	"47": "bg:white",
	"49": "/bg",
};

// flint-disable-lines-begin ts/regexControlCharacters
// eslint-disable-next-line no-control-regex -- ANSI escape sequences start with ESC (\x1b)
const colorPattern = /\x1b\[(\d+)m/g;
// flint-disable-lines-end ts/regexControlCharacters

function replaceColorCodes(str: string): string {
	return str.replace(colorPattern, (_match, code: string) => {
		const name = colorCodes[code];
		if (name) {
			return `<${name}>`;
		}
		return `<ansi:${code}>`;
	});
}

const colorSerializer: SnapshotSerializer = {
	serialize(val, config, indentation, depth, refs, printer) {
		const newValue = replaceColorCodes(val as string);
		const newConfig = {
			...config,
			plugins: config.plugins.filter((plugin) => plugin !== colorSerializer),
		};
		return printer(newValue, newConfig, indentation, depth, refs);
	},
	test(val) {
		return typeof val === "string";
	},
};

// Add color serializer first, then cursor/erase serializer
expect.addSnapshotSerializer(colorSerializer);
expect.addSnapshotSerializer(ansiSerializer);
