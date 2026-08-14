import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./typeofComparisons.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (typeof value === "") {
    process();
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
if (typeof value === "") {
                     ~~
                     This string literal is not one that the typeof operator will ever produce.
    process();
}
`,
		},
	],
	valid: [
		`
declare const value: unknown;
declare function process(): void;

if (typeof value === "string") {
    process();
}
`,
		`
declare const variable: unknown;
declare function handle(): void;

if (typeof variable == "undefined") {
    handle();
}
`,
		`
declare const data: unknown;
declare function reject(): void;

if (typeof data != "number") {
    reject();
}
`,
		`
declare const callback: unknown;

if (typeof callback !== "function") {
    throw new Error("Invalid callback");
}
`,
		`
declare const flag: unknown;
declare function toggle(): void;

if (typeof flag === "boolean") {
    toggle();
}
`,
		`
declare const value: unknown;
declare function parse(): void;

if (typeof value === "object") {
    parse();
}
`,
		`
declare const value: unknown;
declare function handle(): void;

if (typeof value === "symbol") {
    handle();
}
`,
		`
declare const value: unknown;
declare function compute(): void;

if (typeof value === "bigint") {
    compute();
}
`,
		`
declare const other: string;
declare const value: unknown;
declare function process(): void;

if (typeof value === other) {
    process();
}
`,
		`
declare const other: unknown;
declare const value: unknown;
declare function compare(): void;

if (typeof value === typeof other) {
    compare();
}
`,
		`
declare const value: unknown;

const type = typeof value;
void type;
`,
	],
});
