import rule from "./restrictedGlobals.ts";
import { domLibRuleTester, ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Array();
const values = new Array();
const nested = { Array };
const property = { values: Array };
Array = values;
Array += values;
++Array;
Array++;
typeof Array;
class Collection extends Array {}
export default Array;
`,
			options: { deny: ["Array"] },
			snapshot: `
Array();
~~~~~
Global variable 'Array' is restricted.
const values = new Array();
                   ~~~~~
                   Global variable 'Array' is restricted.
const nested = { Array };
                 ~~~~~
                 Global variable 'Array' is restricted.
const property = { values: Array };
                           ~~~~~
                           Global variable 'Array' is restricted.
Array = values;
~~~~~
Global variable 'Array' is restricted.
Array += values;
~~~~~
Global variable 'Array' is restricted.
++Array;
  ~~~~~
  Global variable 'Array' is restricted.
Array++;
~~~~~
Global variable 'Array' is restricted.
typeof Array;
       ~~~~~
       Global variable 'Array' is restricted.
class Collection extends Array {}
                         ~~~~~
                         Global variable 'Array' is restricted.
export default Array;
               ~~~~~
               Global variable 'Array' is restricted.
`,
		},
		{
			code: `
[Array] = values;
`,
			options: { deny: ["Array"] },
			snapshot: `
[Array] = values;
 ~~~~~
 Global variable 'Array' is restricted.
`,
		},
		{
			code: `
Array.Array;
`,
			options: { deny: ["Array"] },
			snapshot: `
Array.Array;
~~~~~
Global variable 'Array' is restricted.
`,
		},
		{
			code: `
projectGlobal;
`,
			files: {
				"globals.d.ts": `declare const projectGlobal: string;`,
			},
			options: { deny: ["projectGlobal"] },
			snapshot: `
projectGlobal;
~~~~~~~~~~~~~
Global variable 'projectGlobal' is restricted.
`,
		},
		{
			code: `
const element = <Array />;
`,
			fileName: "file.tsx",
			options: { deny: ["Array"] },
			snapshot: `
const element = <Array />;
                 ~~~~~
                 Global variable 'Array' is restricted.
`,
		},
	],
	valid: [
		"Array.from([]);",
		{ code: "Array.from([]);", options: { deny: [] } },
		{ code: "Array.from([]);", options: { deny: ["Error"] } },
		{
			code: "function collect() { const Array = {}; Array.from([]); }",
			options: { deny: ["Array"] },
		},
		{
			code: "function collect() { let Array; Array = {}; }",
			options: { deny: ["Array"] },
		},
		{ code: "function Array() {}", options: { deny: ["Array"] } },
		{ code: "class Array {}", options: { deny: ["Array"] } },
		{
			code: "function collect(Array: unknown) { return Array; }",
			options: { deny: ["Array"] },
		},
		{ code: "try {} catch (Array) { Array; }", options: { deny: ["Array"] } },
		{ code: "{ const Array = {}; Array; }", options: { deny: ["Array"] } },
		{
			code: "import { Array } from 'values'; Array;",
			options: { deny: ["Array"] },
		},
		{
			code: "import Array from 'values'; Array;",
			options: { deny: ["Array"] },
		},
		{
			code: "import * as Array from 'values'; Array;",
			options: { deny: ["Array"] },
		},
		{
			code: "const object = { Array: 1 }; object.Array;",
			options: { deny: ["Array"] },
		},
		{ code: "const { Array: value } = object;", options: { deny: ["Array"] } },
		{
			code: "class Value { Array() {} } interface Shape { Array: string }",
			options: { deny: ["Array"] },
		},
		{
			code: "Array: while (true) { break Array; }",
			options: { deny: ["Array"] },
		},
		{ code: "type Value = Array<string>;", options: { deny: ["Array"] } },
		{
			code: "type Value = Array.Iterator<string>;",
			options: { deny: ["Array"] },
		},
		{
			code: "interface Value extends Array<string> {}",
			options: { deny: ["Array"] },
		},
		{
			code: "class Value implements Array<string> {}",
			options: { deny: ["Array"] },
		},
		{ code: "type Value = typeof Array;", options: { deny: ["Array"] } },
		{ code: "type Value = typeof Array.from;", options: { deny: ["Array"] } },
		{
			code: "interface Value { [Array.iterator]: string }",
			options: { deny: ["Array"] },
		},
		{ code: "export { Array };", options: { deny: ["Array"] } },
		{ code: "export type { Array };", options: { deny: ["Array"] } },
		{ code: "MissingGlobal;", options: { deny: ["MissingGlobal"] } },
		{
			code: "const value = { MissingGlobal };",
			options: { deny: ["MissingGlobal"] },
		},
		{
			code: "globalThis.Array; window.Array; self.Array; global.Array;",
			options: { deny: ["Array"] },
		},
	],
});

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
event;
`,
			options: { deny: ["event"] },
			snapshot: `
event;
~~~~~
Global variable 'event' is restricted.
`,
		},
		{
			code: `
window.addEventListener("load", () => {});
`,
			options: { deny: ["window"] },
			snapshot: `
window.addEventListener("load", () => {});
~~~~~~
Global variable 'window' is restricted.
`,
		},
	],
	valid: [
		{
			code: "function open() { const window = {}; window; }",
			options: { deny: ["window"] },
		},
		{
			code: "function handle(event: Event) { return event; }",
			options: { deny: ["event"] },
		},
		{ code: "window.event; globalThis.event;", options: { deny: ["event"] } },
	],
});
