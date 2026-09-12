// flint-disable-file flint/testCaseDuplicates
// flint-disable-file flint/testCaseNonStaticCode

import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryConditions.ts";

function invalid(
	line: string,
	highlight: string,
	message: string,
	occurrence = 0,
) {
	let begin = -1;
	for (let index = 0; index <= occurrence; index += 1) {
		begin = line.indexOf(highlight, begin + 1);
	}
	return {
		code: `
${line}
`,
		snapshot: `
${line}
${" ".repeat(begin)}${"~".repeat(highlight.length)}
${" ".repeat(begin)}${message}
`,
	};
}

const alwaysFalsy = "This condition is always falsy.";
const alwaysTruthy = "This condition is always truthy.";
const alwaysNullish = "This expression is always nullish.";
const neverNullish = "This expression is never nullish.";

ruleTester.describe(rule, {
	invalid: [
		invalid(`if (true) console.log("reachable");`, "true", alwaysTruthy),
		invalid(`if (false) console.log("unreachable");`, "false", alwaysFalsy),
		invalid(`const value = true ? 1 : 2;`, "true", alwaysTruthy),
		invalid(`while (true) break;`, "true", alwaysTruthy),
		invalid(`do {} while (false);`, "false", alwaysFalsy),
		invalid(`for (; true;) break;`, "true", alwaysTruthy),
		invalid(`if (!true) console.log("unreachable");`, "!true", alwaysFalsy),
		invalid(`if (!false) console.log("reachable");`, "!false", alwaysTruthy),
		invalid(`if (!!true) console.log("reachable");`, "!!true", alwaysTruthy),
		invalid(`if ((true)) console.log("reachable");`, "(true)", alwaysTruthy),
		invalid(
			`if ("present") console.log("reachable");`,
			`"present"`,
			alwaysTruthy,
		),
		invalid(`if (0) console.log("unreachable");`, "0", alwaysFalsy),
		invalid(`if (1n) console.log("reachable");`, "1n", alwaysTruthy),
		invalid(
			`declare function fail(): never; if (fail()) console.log("unreachable");`,
			"fail()",
			"This expression has type `never`.",
			1,
		),
		invalid(`true && console.log("reachable");`, "true", alwaysTruthy),
		invalid(`false || console.log("reachable");`, "false", alwaysFalsy),
		invalid(`let object = {}; object &&= {};`, "object", alwaysTruthy, 1),
		invalid(`let object = {}; object ||= {};`, "object", alwaysTruthy, 1),
		invalid(`const value = null ?? "fallback";`, "null", alwaysNullish),
		invalid(
			`const value = undefined ?? "fallback";`,
			"undefined",
			alwaysNullish,
		),
		invalid(`const value = void 0 ?? "fallback";`, "void 0", alwaysNullish),
		invalid(`const value = {} ?? "fallback";`, "{}", neverNullish),
		invalid(
			`declare function fail(): never; const value = fail() ?? "fallback";`,
			"fail()",
			"This expression has type `never`.",
			1,
		),
		invalid(`let value: object = {}; value ??= {};`, "value", neverNullish, 1),
		invalid(`let value: null = null; value ??= {};`, "value", alwaysNullish, 1),
		invalid(
			`const value = 1 === 2;`,
			"1 === 2",
			"This comparison is always false.",
		),
		invalid(
			`const value = 2 !== 1;`,
			"2 !== 1",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1 == "1";`,
			`1 == "1"`,
			"This comparison is always true.",
		),
		invalid(
			`const value = 1 != "1";`,
			`1 != "1"`,
			"This comparison is always false.",
		),
		invalid(
			`const value = null == undefined;`,
			"null == undefined",
			"This comparison is always true.",
		),
		invalid(
			`const value = null == 1;`,
			"null == 1",
			"This comparison is always false.",
		),
		invalid(
			`const value = 1 == null;`,
			"1 == null",
			"This comparison is always false.",
		),
		invalid(
			`const value = 1 == 1;`,
			"1 == 1",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1 == 2;`,
			"1 == 2",
			"This comparison is always false.",
		),
		invalid(
			`const value = true == 1;`,
			"true == 1",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1 == true;`,
			"1 == true",
			"This comparison is always true.",
		),
		invalid(
			`const value = "2" == 2;`,
			`"2" == 2`,
			"This comparison is always true.",
		),
		invalid(
			`const value = 2 == "3";`,
			`2 == "3"`,
			"This comparison is always false.",
		),
		invalid(
			`const value = 2n == "2";`,
			`2n == "2"`,
			"This comparison is always true.",
		),
		invalid(
			`const value = "2" == 2n;`,
			`"2" == 2n`,
			"This comparison is always true.",
		),
		invalid(
			`const value = "invalid" == 2n;`,
			`"invalid" == 2n`,
			"This comparison is always false.",
		),
		invalid(
			`const value = 2n == 2;`,
			"2n == 2",
			"This comparison is always true.",
		),
		invalid(
			`const value = 2n == 2.5;`,
			"2n == 2.5",
			"This comparison is always false.",
		),
		invalid(
			`const value = 2 == 2n;`,
			"2 == 2n",
			"This comparison is always true.",
		),
		invalid(
			`const value = 2.5 == 2n;`,
			"2.5 == 2n",
			"This comparison is always false.",
		),
		invalid(`const value = 2 > 1;`, "2 > 1", "This comparison is always true."),
		invalid(
			`const value = 2 >= 2;`,
			"2 >= 2",
			"This comparison is always true.",
		),
		invalid(
			`const value = -2 < -1;`,
			"-2 < -1",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1 <= 0;`,
			"1 <= 0",
			"This comparison is always false.",
		),
		invalid(
			`const value = 2n > 1n;`,
			"2n > 1n",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1n <= 1n;`,
			"1n <= 1n",
			"This comparison is always true.",
		),
		invalid(
			`const value = 1n < 2n;`,
			"1n < 2n",
			"This comparison is always true.",
		),
		invalid(
			`const value = "a" <= "a";`,
			`"a" <= "a"`,
			"This comparison is always true.",
		),
		invalid(
			`const value = "a" < "b";`,
			`"a" < "b"`,
			"This comparison is always true.",
		),
		invalid(
			`const value = "b" < "a";`,
			`"b" < "a"`,
			"This comparison is always false.",
		),
		invalid(
			`const value = null === null;`,
			"null === null",
			"This comparison is always true.",
		),
		invalid(
			`const value = undefined === undefined;`,
			"undefined === undefined",
			"This comparison is always true.",
		),
		invalid(
			`const value = true === false;`,
			"true === false",
			"This comparison is always false.",
		),
		invalid(
			`declare const value: string; const result = value === 1;`,
			"value === 1",
			"This comparison is always false.",
		),
		invalid(
			`declare const value: string; const result = value !== 1;`,
			"value !== 1",
			"This comparison is always true.",
		),
		invalid(
			`declare const value: "a" | "b"; const result = value === "c";`,
			`value === "c"`,
			"This comparison is always false.",
		),
		invalid(
			`declare const value: bigint; const result = value === "1";`,
			`value === "1"`,
			"This comparison is always false.",
		),
		invalid(
			`declare const value: boolean; const result = value === 1;`,
			"value === 1",
			"This comparison is always false.",
		),
		invalid(
			`declare const value: null; const result = value === undefined;`,
			"value === undefined",
			"This comparison is always false.",
		),
		invalid(
			`declare const value: (string | null); const result = value === 1;`,
			"value === 1",
			"This comparison is always false.",
		),
		invalid(
			`declare const value: (string | undefined); const result = value === 1;`,
			"value === 1",
			"This comparison is always false.",
		),
		invalid(
			`type BrandedBoolean = boolean & { readonly brand: unique symbol }; declare const value: BrandedBoolean; const result = value === 1;`,
			"value === 1",
			"This comparison is always false.",
		),
		invalid(
			`declare function run(): void; const result = run() === 1;`,
			"run() === 1",
			"This comparison is always false.",
		),
		invalid(
			`declare const values: "a"[]; declare const index: number; const result = values[index] === "b";`,
			`values[index] === "b"`,
			"This comparison is always false.",
		),
		invalid(
			`declare const tuple: [object]; if (tuple[0]) console.log("reachable");`,
			"tuple[0]",
			alwaysTruthy,
		),
		invalid(
			`declare const record: { value: object }; if (record.value) console.log("reachable");`,
			"record.value",
			alwaysTruthy,
		),
		invalid(
			`declare const record: { value: object }; if (record["value"]) console.log("reachable");`,
			`record["value"]`,
			alwaysTruthy,
		),
		invalid(
			`switch ("a" as "a" | "b") { case "c": break; }`,
			`"c"`,
			"This switch case can never match the switch expression.",
		),
		invalid(
			`[1].every(() => true);`,
			"true",
			"This array predicate callback always returns a truthy value.",
		),
		invalid(
			`[1].filter(() => false);`,
			"false",
			"This array predicate callback always returns a falsy value.",
		),
		invalid(
			`[1].find(() => ({}));`,
			"({})",
			"This array predicate callback always returns a truthy value.",
		),
		invalid(
			`[1].findIndex(function () { return 0; });`,
			"0",
			"This array predicate callback always returns a falsy value.",
		),
		invalid(
			`[1].findLast(() => "yes");`,
			`"yes"`,
			"This array predicate callback always returns a truthy value.",
		),
		invalid(
			`[1].findLastIndex(() => 0n);`,
			"0n",
			"This array predicate callback always returns a falsy value.",
		),
		invalid(
			`[1].some(() => Promise.resolve(false));`,
			"Promise.resolve(false)",
			"This array predicate callback always returns a truthy value.",
		),
		invalid(
			`[1]["some"](() => true);`,
			"true",
			"This array predicate callback always returns a truthy value.",
		),
		invalid(
			`const method = "some" as const; [1][method](() => false);`,
			"false",
			"This array predicate callback always returns a falsy value.",
		),
		invalid(
			`const callback = (): object => ({}); [1].some(callback);`,
			"callback",
			"This array predicate callback always returns a truthy value.",
			1,
		),
		invalid(
			`const callback = (): undefined => undefined; [1].some(callback);`,
			"callback",
			"This array predicate callback always returns a falsy value.",
			1,
		),
		{
			code: `
if (false || true) console.log("reachable");
`,
			snapshot: `
if (false || true) console.log("reachable");
    ~~~~~
    This condition is always falsy.
             ~~~~
             This condition is always truthy.
`,
		},
		{
			code: `
const record = { value: 1 };
record?.value;
`,
			snapshot: `
const record = { value: 1 };
record?.value;
      ~~
      This optional chain is unnecessary because the value is never nullish.
`,
			suggestions: [
				{
					id: "removeOptionalChain",
					updated: `
const record = { value: 1 };
record.value;
`,
				},
			],
		},
		{
			code: `
const record = { value: 1 };
record?.["value"];
`,
			snapshot: `
const record = { value: 1 };
record?.["value"];
      ~~
      This optional chain is unnecessary because the value is never nullish.
`,
			suggestions: [
				{
					id: "removeOptionalChain",
					updated: `
const record = { value: 1 };
record["value"];
`,
				},
			],
		},
		{
			code: `
const callback = () => 1;
callback?.();
`,
			snapshot: `
const callback = () => 1;
callback?.();
        ~~
        This optional chain is unnecessary because the value is never nullish.
`,
			suggestions: [
				{
					id: "removeOptionalChain",
					updated: `
const callback = () => 1;
callback();
`,
				},
			],
		},
		{
			code: `
declare const record: { value: { nested: number } } | undefined;
record?.value?.nested;
`,
			snapshot: `
declare const record: { value: { nested: number } } | undefined;
record?.value?.nested;
             ~~
             This optional chain is unnecessary because the value is never nullish.
`,
			suggestions: [
				{
					id: "removeOptionalChain",
					updated: `
declare const record: { value: { nested: number } } | undefined;
record?.value.nested;
`,
				},
			],
		},
		{
			code: `
declare const factory: (() => () => number) | undefined;
factory?.()?.();
`,
			snapshot: `
declare const factory: (() => () => number) | undefined;
factory?.()?.();
           ~~
           This optional chain is unnecessary because the value is never nullish.
`,
			suggestions: [
				{
					id: "removeOptionalChain",
					updated: `
declare const factory: (() => () => number) | undefined;
factory?.()();
`,
				},
			],
		},
		{
			code: `
if (true) console.log("reachable");
`,
			files: createRuleTesterTSConfig({ strictNullChecks: false }),
			snapshot: `
if (true) console.log("reachable");

This rule requires the \`strictNullChecks\` compiler option.
`,
		},
		{
			code: `
null ?? 1;
({})?.value;
[1].some(() => true);
switch ("a") { case "b": break; }
`,
			files: createRuleTesterTSConfig({ strictNullChecks: false }),
			snapshot: `
null ?? 1;

This rule requires the \`strictNullChecks\` compiler option.
({})?.value;
[1].some(() => true);
switch ("a") { case "b": break; }
`,
		},
	],
	valid: [
		`declare const value: string | undefined; if (value) console.log(value);`,
		`declare const value: boolean; if (value) console.log(value);`,
		`declare const value: any; if (value) console.log(value);`,
		`declare const value: unknown; if (value) console.log(value);`,
		`function check<T>(value: T) { if (value) console.log(value); }`,
		`function check<T extends string>(value: T) { if (value) console.log(value); }`,
		`for (;;) break;`,
		`declare const value: boolean | undefined; const result = value ?? true;`,
		`declare const value: any; const result = value ?? true;`,
		`declare function run(): void; const value = run() ?? 1;`,
		`declare const values: object[]; declare const index: number; if (values[index]) console.log(index);`,
		`declare const values: object[]; declare const index: number; values[index]?.toString();`,
		`declare const values: object[]; values[0]?.toString();`,
		`declare const tuple: [object, object]; declare const index: number; if (tuple[index]) console.log(index);`,
		`declare const record: Record<string, object>; declare const key: string; if (record[key]) console.log(key);`,
		`declare const optional: { value?: object }; optional.value ?? {};`,
		`declare const optional: { value?: object }; if (optional.value) console.log(optional.value);`,
		`declare const record: { [key: string]: object }; if (record.missing) console.log(record.missing);`,
		`declare const record: { [key: number]: object }; declare const index: number; if (record[index]) console.log(index);`,
		`declare const nullable: { value: number } | undefined; nullable?.value;`,
		`declare const callback: (() => number) | undefined; callback?.();`,
		`declare const factory: (() => (() => number) | undefined) | undefined; factory?.()?.();`,
		`declare const left: string; declare const right: string; left === right;`,
		`declare const left: string; declare const right: number; left == right;`,
		`declare const value: any; value === 1;`,
		`declare const value: unknown; value === 1;`,
		`function compare<T>(value: T) { return value === 1; }`,
		`declare const value: object; value === {};`,
		`declare const custom: { some(callback: () => object): void }; custom.some(() => ({}));`,
		`class CustomArray extends Array<number> { override some(predicate: (value: number) => unknown): boolean { return predicate(0) as boolean; } } new CustomArray().some(() => true);`,
		`export {}; declare global { interface Array<T> { some(predicate: (value: T) => unknown, marker?: "custom"): boolean; } } [1].some(() => true);`,
		`[1].some(() => Math.random() > 0.5);`,
		`[1].some(function () { if (Math.random()) return true; return false; });`,
		`declare const callback: () => any; [1].some(callback);`,
		`declare const callback: () => never; [1].some(callback);`,
		`[1].some();`,
		`const method = Math.random() ? "some" : "map"; [1][method](() => true);`,
		`const object = { value: true }; object.value;`,
		`switch (Math.random() ? "a" : "b") { case "a": break; default: break; }`,
		{
			code: `declare const values: object[]; declare const index: number; if (values[index]) console.log(index);`,
			files: createRuleTesterTSConfig({ noUncheckedIndexedAccess: true }),
		},
	],
});
