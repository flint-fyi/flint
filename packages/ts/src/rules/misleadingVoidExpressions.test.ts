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
		{
			code: `const x = console?.log('foo');`,
			snapshot:
				"const x = console?.log('foo');\n" +
				"          ~~~~~~~~~~~~~~~~~~~\n" +
				"          Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `const x = void console?.log('foo');`,
				},
			],
		},
		{
			code: `console.error(console.log('foo'));`,
			snapshot:
				"console.error(console.log('foo'));\n" +
				"              ~~~~~~~~~~~~~~~~~~\n" +
				"              Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `console.error(void console.log('foo'));`,
				},
			],
		},
		{
			code: `[console.log('foo')];`,
			snapshot:
				"[console.log('foo')];\n" +
				" ~~~~~~~~~~~~~~~~~~\n" +
				" Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `[void console.log('foo')];`,
				},
			],
		},
		{
			code: `({ x: console.log('foo') });`,
			snapshot:
				"({ x: console.log('foo') });\n" +
				"      ~~~~~~~~~~~~~~~~~~\n" +
				"      Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `({ x: void console.log('foo') });`,
				},
			],
		},
		{
			code: `console.log('foo') ? true : false;`,
			snapshot:
				"console.log('foo') ? true : false;\n" +
				"~~~~~~~~~~~~~~~~~~\n" +
				"Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `void console.log('foo') ? true : false;`,
				},
			],
		},
		{
			code: `(console.log('foo') && true) || false;`,
			snapshot:
				"(console.log('foo') && true) || false;\n" +
				" ~~~~~~~~~~~~~~~~~~\n" +
				" Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `(void console.log('foo') && true) || false;`,
				},
			],
		},
		{
			code: `!console.log('foo');`,
			snapshot:
				"!console.log('foo');\n" +
				" ~~~~~~~~~~~~~~~~~~\n" +
				" Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `!void console.log('foo');`,
				},
			],
		},
		{
			code: `!!console.log('foo');`,
			snapshot:
				"!!console.log('foo');\n" +
				"  ~~~~~~~~~~~~~~~~~~\n" +
				"  Void expressions should not be used as values.",
			suggestions: [
				{
					id: "wrapWithVoid",
					updated: `!!void console.log('foo');`,
				},
			],
		},
		{
			code: `
function example(input: string) {
	return (input, console.log(input));
}
`,
			snapshot: `
function example(input: string) {
	return (input, console.log(input));
	               ~~~~~~~~~~~~~~~~~~
	               Returning a void expression from a function is misleading.
}
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
function example(input: string) {
	(input, console.log(input));
}
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
function example(input: string) {
	return (input, void console.log(input));
}
`,
				},
			],
		},
		{
			code: `foo => (foo ? console.log(true) : console.log(false));`,
			snapshot:
				"foo => (foo ? console.log(true) : console.log(false));\n" +
				"              ~~~~~~~~~~~~~~~~~\n" +
				"              Returning a void expression from an arrow function shorthand is misleading.\n" +
				"                                  ~~~~~~~~~~~~~~~~~~\n" +
				"                                  Returning a void expression from an arrow function shorthand is misleading.",
			suggestions: [
				{
					id: "addBraces",
					updated: `foo => { (foo ? console.log(true) : console.log(false)); };`,
				},
				{
					id: "wrapWithVoid",
					updated: `foo => (foo ? void console.log(true) : console.log(false));`,
				},
				{
					id: "addBraces",
					updated: `foo => { (foo ? console.log(true) : console.log(false)); };`,
				},
				{
					id: "wrapWithVoid",
					updated: `foo => (foo ? console.log(true) : void console.log(false));`,
				},
			],
		},
		{
			code: `
const f = function () {
	if (cond) {
		return console.error('foo');
	}
	console.log('bar');
};
`,
			snapshot: `
const f = function () {
	if (cond) {
		return console.error('foo');
		       ~~~~~~~~~~~~~~~~~~~~
		       Returning a void expression from a function is misleading.
	}
	console.log('bar');
};
`,
			suggestions: [
				{
					id: "moveBeforeReturn",
					updated: `
const f = function () {
	if (cond) {
		console.error('foo'); return;
	}
	console.log('bar');
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	if (cond) {
		return void console.error('foo');
	}
	console.log('bar');
};
`,
				},
			],
		},
		{
			code: `
const f = function () {
	if (cond) return console.error('foo');
	console.log('bar');
};
`,
			snapshot: `
const f = function () {
	if (cond) return console.error('foo');
	                 ~~~~~~~~~~~~~~~~~~~~
	                 Returning a void expression from a function is misleading.
	console.log('bar');
};
`,
			suggestions: [
				{
					id: "moveBeforeReturn",
					updated: `
const f = function () {
	if (cond) console.error('foo'); return;
	console.log('bar');
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	if (cond) return void console.error('foo');
	console.log('bar');
};
`,
				},
			],
		},
		{
			code: `
const f = function () {
	let num = 1;
	return num ? console.log('foo') : num;
};
`,
			snapshot: `
const f = function () {
	let num = 1;
	return num ? console.log('foo') : num;
	             ~~~~~~~~~~~~~~~~~~
	             Returning a void expression from a function is misleading.
};
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
const f = function () {
	let num = 1;
	num ? console.log('foo') : num;
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	let num = 1;
	return num ? void console.log('foo') : num;
};
`,
				},
			],
		},
		{
			code: `
const f = function () {
	let undef = undefined;
	return undef ? console.log('foo') : undef;
};
`,
			snapshot: `
const f = function () {
	let undef = undefined;
	return undef ? console.log('foo') : undef;
	               ~~~~~~~~~~~~~~~~~~
	               Returning a void expression from a function is misleading.
};
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
const f = function () {
	let undef = undefined;
	undef ? console.log('foo') : undef;
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	let undef = undefined;
	return undef ? void console.log('foo') : undef;
};
`,
				},
			],
		},
		{
			code: `
const f = function () {
	let num = 1;
	return num || console.log('foo');
};
`,
			snapshot: `
const f = function () {
	let num = 1;
	return num || console.log('foo');
	              ~~~~~~~~~~~~~~~~~~
	              Returning a void expression from a function is misleading.
};
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
const f = function () {
	let num = 1;
	num || console.log('foo');
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	let num = 1;
	return num || void console.log('foo');
};
`,
				},
			],
		},
		{
			code: `
const f = function () {
	let bar = void 0;
	return bar || console.log('foo');
};
`,
			snapshot: `
const f = function () {
	let bar = void 0;
	return bar || console.log('foo');
	              ~~~~~~~~~~~~~~~~~~
	              Returning a void expression from a function is misleading.
};
`,
			suggestions: [
				{
					id: "removeReturn",
					updated: `
const f = function () {
	let bar = void 0;
	bar || console.log('foo');
};
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
const f = function () {
	let bar = void 0;
	return bar || void console.log('foo');
};
`,
				},
			],
		},
		{
			code: `
let num = 1;
const foo = () => (num ? console.log('foo') : num);
`,
			snapshot: `
let num = 1;
const foo = () => (num ? console.log('foo') : num);
                         ~~~~~~~~~~~~~~~~~~
                         Returning a void expression from an arrow function shorthand is misleading.
`,
			suggestions: [
				{
					id: "addBraces",
					updated: `
let num = 1;
const foo = () => { (num ? console.log('foo') : num); };
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
let num = 1;
const foo = () => (num ? void console.log('foo') : num);
`,
				},
			],
		},
		{
			code: `
let bar = void 0;
const foo = () => (bar ? console.log('foo') : bar);
`,
			snapshot: `
let bar = void 0;
const foo = () => (bar ? console.log('foo') : bar);
                         ~~~~~~~~~~~~~~~~~~
                         Returning a void expression from an arrow function shorthand is misleading.
`,
			suggestions: [
				{
					id: "addBraces",
					updated: `
let bar = void 0;
const foo = () => { (bar ? console.log('foo') : bar); };
`,
				},
				{
					id: "wrapWithVoid",
					updated: `
let bar = void 0;
const foo = () => (bar ? void console.log('foo') : bar);
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
		`() => Math.random();`,
		`declare function log(message: string): void; log?.("hello");`,
		`
function cool(input: string) {
	return (console.log(input), input);
}
`,
		`
function cool(input: string) {
	return (input, console.log(input), input);
}
`,
	],
});
