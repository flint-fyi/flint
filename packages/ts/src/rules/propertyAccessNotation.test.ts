import rule from "./propertyAccessNotation.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = obj["property"];
`,
			output: `
const value = obj.property;
`,
			snapshot: `
const value = obj["property"];
                  ~~~~~~~~~~
                  Use dot notation instead of bracket notation for \`property\`.
`,
		},
		{
			code: `
obj["value"] = 123;
`,
			output: `
obj.value = 123;
`,
			snapshot: `
obj["value"] = 123;
    ~~~~~~~
    Use dot notation instead of bracket notation for \`value\`.
`,
		},
		{
			code: `
const result = data["items"]["first"];
`,
			output: `
const result = data.items.first;
`,
			snapshot: `
const result = data["items"]["first"];
                             ~~~~~~~
                             Use dot notation instead of bracket notation for \`first\`.
                    ~~~~~~~
                    Use dot notation instead of bracket notation for \`items\`.
`,
		},
		{
			code: `
const name = person["firstName"];
`,
			output: `
const name = person.firstName;
`,
			snapshot: `
const name = person["firstName"];
                    ~~~~~~~~~~~
                    Use dot notation instead of bracket notation for \`firstName\`.
`,
		},
		{
			code: `
const count = arr["length"];
`,
			output: `
const count = arr.length;
`,
			snapshot: `
const count = arr["length"];
                  ~~~~~~~~
                  Use dot notation instead of bracket notation for \`length\`.
`,
		},
		{
			code: `
const value = foo["bar"]["baz"];
`,
			output: `
const value = foo.bar.baz;
`,
			snapshot: `
const value = foo["bar"]["baz"];
                         ~~~~~
                         Use dot notation instead of bracket notation for \`baz\`.
                  ~~~~~
                  Use dot notation instead of bracket notation for \`bar\`.
`,
		},
		{
			code: `
const underscore = obj["_private"];
`,
			output: `
const underscore = obj._private;
`,
			snapshot: `
const underscore = obj["_private"];
                       ~~~~~~~~~~
                       Use dot notation instead of bracket notation for \`_private\`.
`,
		},
		{
			code: `
const dollar = obj["$element"];
`,
			output: `
const dollar = obj.$element;
`,
			snapshot: `
const dollar = obj["$element"];
                   ~~~~~~~~~~
                   Use dot notation instead of bracket notation for \`$element\`.
`,
		},
		{
			code: `
const val = obj?.["property"];
`,
			output: `
const val = obj?.property;
`,
			snapshot: `
const val = obj?.["property"];
                  ~~~~~~~~~~
                  Use dot notation instead of bracket notation for \`property\`.
`,
		},
		{
			code: `
const nested = a?.["b"]?.["c"];
`,
			output: `
const nested = a?.b?.c;
`,
			snapshot: `
const nested = a?.["b"]?.["c"];
                          ~~~
                          Use dot notation instead of bracket notation for \`c\`.
                   ~~~
                   Use dot notation instead of bracket notation for \`b\`.
`,
		},
		{
			code: `
function test() {
    return this["property"];
}
`,
			output: `
function test() {
    return this.property;
}
`,
			snapshot: `
function test() {
    return this["property"];
                ~~~~~~~~~~
                Use dot notation instead of bracket notation for \`property\`.
}
`,
		},
		{
			code: `
const method = obj["toString"];
`,
			output: `
const method = obj.toString;
`,
			snapshot: `
const method = obj["toString"];
                   ~~~~~~~~~~
                   Use dot notation instead of bracket notation for \`toString\`.
`,
		},
		{
			code: `
const unicode = obj["naïve"];
`,
			output: `
const unicode = obj.naïve;
`,
			snapshot: `
const unicode = obj["naïve"];
                    ~~~~~~~
                    Use dot notation instead of bracket notation for \`naïve\`.
`,
		},
		{
			code: `
const num = obj["prop123"];
`,
			output: `
const num = obj.prop123;
`,
			snapshot: `
const num = obj["prop123"];
                ~~~~~~~~~
                Use dot notation instead of bracket notation for \`prop123\`.
`,
		},
		{
			code: `
type ObjType = { foo: string };
declare const obj: ObjType;
obj["foo"];
`,
			output: `
type ObjType = { foo: string };
declare const obj: ObjType;
obj.foo;
`,
			snapshot: `
type ObjType = { foo: string };
declare const obj: ObjType;
obj["foo"];
    ~~~~~
    Use dot notation instead of bracket notation for \`foo\`.
`,
		},
	],
	valid: [
		`const value = obj.property;`,
		`const value = obj.nested.deep;`,
		`const value = obj["key with spaces"];`,
		`const value = obj["key-with-dashes"];`,
		`const value = obj["key.with.dots"];`,
		`const value = obj["123startsWithNumber"];`,
		`const value = obj["special!chars"];`,
		`const value = obj[""];`,
		`const dynamicKey = "prop"; const value = obj[dynamicKey];`,
		`const value = obj[key];`,
		`const value = arr[0];`,
		`const value = arr[index];`,
		`const value = obj[1 + 2];`,
		`const value = obj[getKey()];`,
		`const value = obj[\`template\`];`,
		`const value = obj[\`template\${var}\`];`,
		`const value = obj["break"];`,
		`const value = obj["case"];`,
		`const value = obj["catch"];`,
		`const value = obj["class"];`,
		`const value = obj["const"];`,
		`const value = obj["continue"];`,
		`const value = obj["debugger"];`,
		`const value = obj["default"];`,
		`const value = obj["delete"];`,
		`const value = obj["do"];`,
		`const value = obj["else"];`,
		`const value = obj["enum"];`,
		`const value = obj["export"];`,
		`const value = obj["extends"];`,
		`const value = obj["false"];`,
		`const value = obj["finally"];`,
		`const value = obj["for"];`,
		`const value = obj["function"];`,
		`const value = obj["if"];`,
		`const value = obj["import"];`,
		`const value = obj["in"];`,
		`const value = obj["instanceof"];`,
		`const value = obj["new"];`,
		`const value = obj["null"];`,
		`const value = obj["return"];`,
		`const value = obj["super"];`,
		`const value = obj["switch"];`,
		`const value = obj["this"];`,
		`const value = obj["throw"];`,
		`const value = obj["true"];`,
		`const value = obj["try"];`,
		`const value = obj["typeof"];`,
		`const value = obj["var"];`,
		`const value = obj["void"];`,
		`const value = obj["while"];`,
		`const value = obj["with"];`,
		`const value = obj["await"];`,
		`const value = obj["implements"];`,
		`const value = obj["interface"];`,
		`const value = obj["let"];`,
		`const value = obj["package"];`,
		`const value = obj["private"];`,
		`const value = obj["protected"];`,
		`const value = obj["public"];`,
		`const value = obj["static"];`,
		`const value = obj["yield"];`,
		`const value = obj?.property;`,
		`const value = obj?.[dynamicKey];`,
		`const value = obj?.["key with spaces"];`,
	],
});
