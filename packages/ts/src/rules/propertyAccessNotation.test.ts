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
                  Prefer the cleaner dot notation instead of bracket notation for \`property\`.
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
    Prefer the cleaner dot notation instead of bracket notation for \`value\`.
`,
		},
		{
			code: `
const result = data["items"]["first"];
`,
			output: `
const result = data["items"].first;
`,
			snapshot: `
const result = data["items"]["first"];
                             ~~~~~~~
                             Prefer the cleaner dot notation instead of bracket notation for \`first\`.
                    ~~~~~~~
                    Prefer the cleaner dot notation instead of bracket notation for \`items\`.
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
                    Prefer the cleaner dot notation instead of bracket notation for \`firstName\`.
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
                  Prefer the cleaner dot notation instead of bracket notation for \`length\`.
`,
		},
		{
			code: `
const value = foo["bar"]["baz"];
`,
			output: `
const value = foo["bar"].baz;
`,
			snapshot: `
const value = foo["bar"]["baz"];
                         ~~~~~
                         Prefer the cleaner dot notation instead of bracket notation for \`baz\`.
                  ~~~~~
                  Prefer the cleaner dot notation instead of bracket notation for \`bar\`.
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
                       Prefer the cleaner dot notation instead of bracket notation for \`_private\`.
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
                   Prefer the cleaner dot notation instead of bracket notation for \`$element\`.
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
                  Prefer the cleaner dot notation instead of bracket notation for \`property\`.
`,
		},
		{
			code: `
const nested = a?.["b"]?.["c"];
`,
			output: `
const nested = a?.["b"]?.c;
`,
			snapshot: `
const nested = a?.["b"]?.["c"];
                          ~~~
                          Prefer the cleaner dot notation instead of bracket notation for \`c\`.
                   ~~~
                   Prefer the cleaner dot notation instead of bracket notation for \`b\`.
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
                Prefer the cleaner dot notation instead of bracket notation for \`property\`.
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
                   Prefer the cleaner dot notation instead of bracket notation for \`toString\`.
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
                    Prefer the cleaner dot notation instead of bracket notation for \`naïve\`.
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
                Prefer the cleaner dot notation instead of bracket notation for \`prop123\`.
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
    Prefer the cleaner dot notation instead of bracket notation for \`foo\`.
`,
		},
		{
			code: `
declare const container: {
  [i: string]: string;
}

container['computed'] = 123;
`,
			output: `
declare const container: {
  [i: string]: string;
}

container.computed = 123;
`,
			snapshot: `
declare const container: {
  [i: string]: string;
}

container['computed'] = 123;
          ~~~~~~~~~~
          Prefer the cleaner dot notation instead of bracket notation for \`computed\`.
`,
		},
		{
			code: `
declare const container: {
  [i: string]: string;
  known: string;
}

container['known'] = 123;
`,
			options: { allowIndexSignaturePropertyAccess: true },
			output: `
declare const container: {
  [i: string]: string;
  known: string;
}

container.known = 123;
`,
			snapshot: `
declare const container: {
  [i: string]: string;
  known: string;
}

container['known'] = 123;
          ~~~~~~~
          Prefer the cleaner dot notation instead of bracket notation for \`known\`.
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
		`const value = obj?.property;`,
		`const value = obj?.[dynamicKey];`,
		`const value = obj?.["key with spaces"];`,
		`
class Container {
  private privateProperty = 123;
}

const container = new Container();
container['privateProperty'] = 123;
`,
		`
class Container {
  protected protectedProperty = 123;
}

const container = new Container();
container['protectedProperty'] = 123;
`,
		{
			code: `
declare const container: {
  [i: string]: string;
}

container['protectedProperty'] = 123;
`,
			options: { allowIndexSignaturePropertyAccess: true },
		},
	],
});
