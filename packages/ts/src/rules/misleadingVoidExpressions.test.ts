import rule from "./misleadingVoidExpressions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function log(message: string): void;
const result = log("hello");
`,
			snapshot: `
declare function log(message: string): void;
const result = log("hello");
               ~~~~~~~~~~~~
               Void expressions should not be used as values.
`,
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
const result = void log("hello");
`,
				},
			],
		},
		{
			code: `
declare function log(message: string): void;
[1, 2, 3].forEach(n => log(String(n)));
`,
			snapshot: `
declare function log(message: string): void;
[1, 2, 3].forEach(n => log(String(n)));
                       ~~~~~~~~~~~~~~
                       Returning a void expression from an arrow function shorthand is misleading.
`,
			suggestions: [
				{
					id: "addBraces",
					updated: `
declare function log(message: string): void;
[1, 2, 3].forEach(n => { log(String(n)); });
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
[1, 2, 3].forEach(n => void log(String(n)));
`,
				},
			],
		},
		{
			code: `
declare function log(message: string): void;
function run() {
    return log("done");
}
`,
			snapshot: `
declare function log(message: string): void;
function run() {
    return log("done");
           ~~~~~~~~~~~
           Returning a void expression from a function is misleading.
}
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
declare function log(message: string): void;
function run() {
    log("done");
}
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
function run() {
    return void log("done");
}
`,
				},
			],
		},
		{
			code: `
declare function log(message: string): void;
const callback = () => log("test");
`,
			snapshot: `
declare function log(message: string): void;
const callback = () => log("test");
                       ~~~~~~~~~~~
                       Returning a void expression from an arrow function shorthand is misleading.
`,
			suggestions: [
				{
					id: "addBraces",
					updated: `
declare function log(message: string): void;
const callback = () => { log("test"); };
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
const callback = () => void log("test");
`,
				},
			],
		},
		{
			code: `
declare function save(): void;
const promise = Promise.resolve().then(() => save());
`,
			snapshot: `
declare function save(): void;
const promise = Promise.resolve().then(() => save());
                                             ~~~~~~
                                             Returning a void expression from an arrow function shorthand is misleading.
`,
			suggestions: [
				{
					id: "addBraces",
					updated: `
declare function save(): void;
const promise = Promise.resolve().then(() => { save(); });
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function save(): void;
const promise = Promise.resolve().then(() => void save());
`,
				},
			],
		},
		{
			code: `
declare function log(message: string): void;
true && log("message") && false;
`,
			snapshot: `
declare function log(message: string): void;
true && log("message") && false;
        ~~~~~~~~~~~~~~
        Void expressions should not be used as values.
`,
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
true && void log("message") && false;
`,
				},
			],
		},
		{
			code: `
declare function log(message: string): void;
function run() {
    if (true) {
        return log("early");
    }
    return log("late");
}
`,
			snapshot: `
declare function log(message: string): void;
function run() {
    if (true) {
        return log("early");
               ~~~~~~~~~~~~
               Returning a void expression from a function is misleading.
    }
    return log("late");
           ~~~~~~~~~~~
           Returning a void expression from a function is misleading.
}
`,
			suggestions: [
				{
					id: "moveBeforeReturn",
					updated: `
declare function log(message: string): void;
function run() {
    if (true) {
        log("early"); return;
    }
    return log("late");
}
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
function run() {
    if (true) {
        return void log("early");
    }
    return log("late");
}
`,
				},
				{
					id: "removeReturn",
					updated: `
declare function log(message: string): void;
function run() {
    if (true) {
        return log("early");
    }
    log("late");
}
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
declare function log(message: string): void;
function run() {
    if (true) {
        return log("early");
    }
    return void log("late");
}
`,
				},
			],
		},
	],
	valid: [
		`declare function log(message: string): void; log("hello");`,
		`declare function log(message: string): void; const run = () => { log("test"); };`,
		`declare function log(message: string): void; function run() { log("done"); }`,
		`declare function log(message: string): void; true && log("message");`,
		`declare function log(message: string): void; condition ? log("a") : log("b");`,
		`declare function log(message: string): void; void log("ignored");`,
		`declare function getValue(): number; const x = getValue();`,
		`declare function getValue(): string | undefined; const x = getValue();`,
		`declare function log(message: string): void; const items = [1, 2, 3]; items.forEach(n => { log(String(n)); });`,
		`declare function log(message: string): void; (log("first"), log("second"));`,
	],
});
