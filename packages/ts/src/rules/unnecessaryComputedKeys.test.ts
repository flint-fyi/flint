/* eslint-disable no-useless-escape */
import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryComputedKeys.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const text = {
    ["name"]: 1,
    [("parenthesized")]: 2,
    [\`template\`]: 3,
    [\`\`]: 4,
    [12]: 5,
    [-1]: 6,
    [-0]: 7,
    [1e999]: 8,
};
`,
			output: `
const text = {
    "name": 1,
    "parenthesized": 2,
    "template": 3,
    "": 4,
    12: 5,
    "-1": 6,
    0: 7,
    "Infinity": 8,
};
`,
			snapshot: `
const text = {
    ["name"]: 1,
    ~~~~~~~~
    This computed key has the single literal value "name".
    [("parenthesized")]: 2,
    ~~~~~~~~~~~~~~~~~~~
    This computed key has the single literal value "parenthesized".
    [\`template\`]: 3,
    ~~~~~~~~~~~~
    This computed key has the single literal value "template".
    [\`\`]: 4,
    ~~~~
    This computed key has the single literal value "".
    [12]: 5,
    ~~~~
    This computed key has the single literal value 12.
    [-1]: 6,
    ~~~~
    This computed key has the single literal value "-1".
    [-0]: 7,
    ~~~~
    This computed key has the single literal value 0.
    [1e999]: 8,
    ~~~~~~~
    This computed key has the single literal value "Infinity".
};
`,
		},
		{
			code: `
const stringKey = "quoted\\\"\\\\\\n\\u2028\\u2029" as const;
const numberKey = 42 as const;
const values = {
    [stringKey]: 1,
    [numberKey!]: 2,
    [("asserted" as const) satisfies string]: 3,
    [<"angled">"angled"]: 4,
};
`,
			output: `
const stringKey = "quoted\\\"\\\\\\n\\u2028\\u2029" as const;
const numberKey = 42 as const;
const values = {
    "quoted\\\"\\\\\\n\\u2028\\u2029": 1,
    42: 2,
    "asserted": 3,
    "angled": 4,
};
`,
			snapshot: `
const stringKey = "quoted\\\"\\\\\\n\\u2028\\u2029" as const;
const numberKey = 42 as const;
const values = {
    [stringKey]: 1,
    ~~~~~~~~~~~
    This computed key has the single literal value "quoted\\\"\\\\\\n\\u2028\\u2029".
    [numberKey!]: 2,
    ~~~~~~~~~~~~
    This computed key has the single literal value 42.
    [("asserted" as const) satisfies string]: 3,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This computed key has the single literal value "asserted".
    [<"angled">"angled"]: 4,
    ~~~~~~~~~~~~~~~~~~~~
    This computed key has the single literal value "angled".
};
`,
		},
		{
			code: `
const object = {
    ["method"]() {},
    async ["async"]() {},
    *["generator"]() {},
    get ["getter"]() { return 1; },
    set ["setter"](value: number) {},
};
const { ["binding"]: binding } = object;
({ ["__proto__"]: binding } = object);
({ nested: [{ ["__proto__"]: binding }] } = object);
for ({ ["iterated"]: binding } of objects) {}
for ({ ["enumerated"]: binding } in object) {}
`,
			output: `
const object = {
    "method"() {},
    async "async"() {},
    *"generator"() {},
    get "getter"() { return 1; },
    set "setter"(value: number) {},
};
const { "binding": binding } = object;
({ "__proto__": binding } = object);
({ nested: [{ "__proto__": binding }] } = object);
for ({ "iterated": binding } of objects) {}
for ({ "enumerated": binding } in object) {}
`,
			snapshot: `
const object = {
    ["method"]() {},
    ~~~~~~~~~~
    This computed key has the single literal value "method".
    async ["async"]() {},
          ~~~~~~~~~
          This computed key has the single literal value "async".
    *["generator"]() {},
     ~~~~~~~~~~~~~
     This computed key has the single literal value "generator".
    get ["getter"]() { return 1; },
        ~~~~~~~~~~
        This computed key has the single literal value "getter".
    set ["setter"](value: number) {},
        ~~~~~~~~~~
        This computed key has the single literal value "setter".
};
const { ["binding"]: binding } = object;
        ~~~~~~~~~~~
        This computed key has the single literal value "binding".
({ ["__proto__"]: binding } = object);
   ~~~~~~~~~~~~~
   This computed key has the single literal value "__proto__".
({ nested: [{ ["__proto__"]: binding }] } = object);
              ~~~~~~~~~~~~~
              This computed key has the single literal value "__proto__".
for ({ ["iterated"]: binding } of objects) {}
       ~~~~~~~~~~~~
       This computed key has the single literal value "iterated".
for ({ ["enumerated"]: binding } in object) {}
       ~~~~~~~~~~~~~~
       This computed key has the single literal value "enumerated".
`,
		},
		{
			code: `
class Container {
    static ["constructor"]() {}
    ["prototype"]() {}
    get ["constructor"]() { return 1; }
    set ["prototype"](value: number) {}
    static get ["constructor"]() { return 1; }
    static set ["constructor"](value: number) {}
    ["prototype"] = 1;
}
interface Shape {
    ["property"]: string;
    ["method"](): void;
}
`,
			output: `
class Container {
    static "constructor"() {}
    "prototype"() {}
    get "constructor"() { return 1; }
    set "prototype"(value: number) {}
    static get "constructor"() { return 1; }
    static set "constructor"(value: number) {}
    "prototype" = 1;
}
interface Shape {
    "property": string;
    "method"(): void;
}
`,
			snapshot: `
class Container {
    static ["constructor"]() {}
           ~~~~~~~~~~~~~~~
           This computed key has the single literal value "constructor".
    ["prototype"]() {}
    ~~~~~~~~~~~~~
    This computed key has the single literal value "prototype".
    get ["constructor"]() { return 1; }
        ~~~~~~~~~~~~~~~
        This computed key has the single literal value "constructor".
    set ["prototype"](value: number) {}
        ~~~~~~~~~~~~~
        This computed key has the single literal value "prototype".
    static get ["constructor"]() { return 1; }
               ~~~~~~~~~~~~~~~
               This computed key has the single literal value "constructor".
    static set ["constructor"](value: number) {}
               ~~~~~~~~~~~~~~~
               This computed key has the single literal value "constructor".
    ["prototype"] = 1;
    ~~~~~~~~~~~~~
    This computed key has the single literal value "prototype".
}
interface Shape {
    ["property"]: string;
    ~~~~~~~~~~~~
    This computed key has the single literal value "property".
    ["method"](): void;
    ~~~~~~~~~~
    This computed key has the single literal value "method".
}
`,
		},
		{
			code: `
const comments = { [/* keep */ "block"]: 1, [// keep
"line"]: 2 };
`,
			snapshot: `
const comments = { [/* keep */ "block"]: 1, [// keep
                   ~~~~~~~~~~~~~~~~~~~~
                   This computed key has the single literal value "block".
                                            ~~~~~~~~
                                            This computed key has the single literal value "line".
"line"]: 2 };
~~~~~~~
`,
		},
	],
	valid: [
		`const key: string = "wide"; const value = { [key]: 1 };`,
		`const key: "first" | "second" = condition ? "first" : "second"; const value = { [key]: 1 };`,
		`const values = { [true]: 1, [null]: 2, [1n]: 3 };`,
		`declare const key: symbol; const value = { [key]: 1 };`,
		`declare function key(): "called"; const value = { [key()]: 1 };`,
		`declare const source: { key: "accessed" }; const value = { [source.key]: 1 };`,
		`const value = { [(sideEffect(), "result")]: 1, [condition ? "a" : "a"]: 2 };`,
		`const value = { [!0]: 1, [await key]: 2 };`,
		`const value = { ["__proto__"]: prototype };`,
		`class Value { ["constructor"]() {} ["constructor"] = 1; static ["constructor"] = 1; static ["prototype"]() {} static ["prototype"] = 1; static get ["prototype"]() { return 1; } static set ["prototype"](value: number) {} }`,
		`const value = ({ ["__proto__"]: 1 }) + other;`,
		`for (const key in { ["__proto__"]: 1 }) { consume(key); }`,
		`enum Values { ["member"] = 1 }`,
	],
});
