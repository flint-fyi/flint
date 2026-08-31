import rule from "./propertyAccessNotation.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj = { property: 1 };
const value = obj["property"];
`,
			output: `
const obj = { property: 1 };
const value = obj.property;
`,
			snapshot: `
const obj = { property: 1 };
const value = obj["property"];
                  ~~~~~~~~~~
                  Prefer the cleaner dot notation instead of bracket notation for \`property\`.
`,
		},
		{
			code: `
const obj = { value: 0 };
obj["value"] = 123;
`,
			output: `
const obj = { value: 0 };
obj.value = 123;
`,
			snapshot: `
const obj = { value: 0 };
obj["value"] = 123;
    ~~~~~~~
    Prefer the cleaner dot notation instead of bracket notation for \`value\`.
`,
		},
		{
			code: `
const data = { items: { first: 1 } };
const result = data["items"]["first"];
`,
			output: `
const data = { items: { first: 1 } };
const result = data["items"].first;
`,
			snapshot: `
const data = { items: { first: 1 } };
const result = data["items"]["first"];
                    ~~~~~~~
                    Prefer the cleaner dot notation instead of bracket notation for \`items\`.
                             ~~~~~~~
                             Prefer the cleaner dot notation instead of bracket notation for \`first\`.
`,
		},
		{
			code: `
const person = { firstName: "Test" };
const name = person["firstName"];
`,
			output: `
const person = { firstName: "Test" };
const name = person.firstName;
`,
			snapshot: `
const person = { firstName: "Test" };
const name = person["firstName"];
                    ~~~~~~~~~~~
                    Prefer the cleaner dot notation instead of bracket notation for \`firstName\`.
`,
		},
		{
			code: `
const arr = [1, 2, 3];
const count = arr["length"];
`,
			output: `
const arr = [1, 2, 3];
const count = arr.length;
`,
			snapshot: `
const arr = [1, 2, 3];
const count = arr["length"];
                  ~~~~~~~~
                  Prefer the cleaner dot notation instead of bracket notation for \`length\`.
`,
		},
		{
			code: `
const foo = { bar: { baz: 1 } };
const value = foo["bar"]["baz"];
`,
			output: `
const foo = { bar: { baz: 1 } };
const value = foo["bar"].baz;
`,
			snapshot: `
const foo = { bar: { baz: 1 } };
const value = foo["bar"]["baz"];
                  ~~~~~
                  Prefer the cleaner dot notation instead of bracket notation for \`bar\`.
                         ~~~~~
                         Prefer the cleaner dot notation instead of bracket notation for \`baz\`.
`,
		},
		{
			code: `
const obj = { _private: 1 };
const underscore = obj["_private"];
`,
			output: `
const obj = { _private: 1 };
const underscore = obj._private;
`,
			snapshot: `
const obj = { _private: 1 };
const underscore = obj["_private"];
                       ~~~~~~~~~~
                       Prefer the cleaner dot notation instead of bracket notation for \`_private\`.
`,
		},
		{
			code: `
const obj = { $element: 1 };
const dollar = obj["$element"];
`,
			output: `
const obj = { $element: 1 };
const dollar = obj.$element;
`,
			snapshot: `
const obj = { $element: 1 };
const dollar = obj["$element"];
                   ~~~~~~~~~~
                   Prefer the cleaner dot notation instead of bracket notation for \`$element\`.
`,
		},
		{
			code: `
const obj = { property: 1 };
const val = obj?.["property"];
`,
			output: `
const obj = { property: 1 };
const val = obj?.property;
`,
			snapshot: `
const obj = { property: 1 };
const val = obj?.["property"];
                  ~~~~~~~~~~
                  Prefer the cleaner dot notation instead of bracket notation for \`property\`.
`,
		},
		{
			code: `
const a = { b: { c: 1 } };
const nested = a?.["b"]?.["c"];
`,
			output: `
const a = { b: { c: 1 } };
const nested = a?.["b"]?.c;
`,
			snapshot: `
const a = { b: { c: 1 } };
const nested = a?.["b"]?.["c"];
                   ~~~
                   Prefer the cleaner dot notation instead of bracket notation for \`b\`.
                          ~~~
                          Prefer the cleaner dot notation instead of bracket notation for \`c\`.
`,
		},
		{
			code: `
function test(this: { property: number }) {
    return this["property"];
}
`,
			output: `
function test(this: { property: number }) {
    return this.property;
}
`,
			snapshot: `
function test(this: { property: number }) {
    return this["property"];
                ~~~~~~~~~~
                Prefer the cleaner dot notation instead of bracket notation for \`property\`.
}
`,
		},
		{
			code: `
const obj = { toString() { return "value"; } };
const method = obj["toString"];
`,
			output: `
const obj = { toString() { return "value"; } };
const method = obj.toString;
`,
			snapshot: `
const obj = { toString() { return "value"; } };
const method = obj["toString"];
                   ~~~~~~~~~~
                   Prefer the cleaner dot notation instead of bracket notation for \`toString\`.
`,
		},
		{
			code: `
const obj = { naïve: 1 };
const unicode = obj["naïve"];
`,
			output: `
const obj = { naïve: 1 };
const unicode = obj.naïve;
`,
			snapshot: `
const obj = { naïve: 1 };
const unicode = obj["naïve"];
                    ~~~~~~~
                    Prefer the cleaner dot notation instead of bracket notation for \`naïve\`.
`,
		},
		{
			code: `
const obj = { prop123: 1 };
const num = obj["prop123"];
`,
			output: `
const obj = { prop123: 1 };
const num = obj.prop123;
`,
			snapshot: `
const obj = { prop123: 1 };
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

container['computed'] = "value";
`,
			output: `
declare const container: {
  [i: string]: string;
}

container.computed = "value";
`,
			snapshot: `
declare const container: {
  [i: string]: string;
}

container['computed'] = "value";
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

container['known'] = "value";
`,
			options: { allowIndexSignaturePropertyAccess: true },
			output: `
declare const container: {
  [i: string]: string;
  known: string;
}

container.known = "value";
`,
			snapshot: `
declare const container: {
  [i: string]: string;
  known: string;
}

container['known'] = "value";
          ~~~~~~~
          Prefer the cleaner dot notation instead of bracket notation for \`known\`.
`,
		},
	],
	valid: [
		`const obj = { property: 1 }; const value = obj.property;`,
		`const obj = { nested: { deep: 1 } }; const value = obj.nested.deep;`,
		`const obj = { "key with spaces": 1 }; const value = obj["key with spaces"];`,
		`const obj = { "key-with-dashes": 1 }; const value = obj["key-with-dashes"];`,
		`const obj = { "key.with.dots": 1 }; const value = obj["key.with.dots"];`,
		`const obj = { "123startsWithNumber": 1 }; const value = obj["123startsWithNumber"];`,
		`const obj = { "special!chars": 1 }; const value = obj["special!chars"];`,
		`const obj = { "": 1 }; const value = obj[""];`,
		`const obj = { prop: 1 }; const dynamicKey = "prop"; const value = obj[dynamicKey];`,
		`const obj: Record<string, number> = {}; const key = "value"; const value = obj[key];`,
		`const arr = [1]; const value = arr[0];`,
		`const arr = [1]; const index = 0; const value = arr[index];`,
		`const obj: Record<number, number> = { 3: 1 }; const value = obj[1 + 2];`,
		`const obj: Record<string, number> = {}; function getKey() { return "value"; } const value = obj[getKey()];`,
		`const obj = { template: 1 }; const value = obj[\`template\`];`,
		`const obj: Record<string, number> = {}; const suffix = "Name"; const value = obj[\`template\${suffix}\`];`,
		`const obj = { property: 1 }; const value = obj?.property;`,
		`const obj = { prop: 1 }; const dynamicKey = "prop"; const value = obj?.[dynamicKey];`,
		`const obj = { "key with spaces": 1 }; const value = obj?.["key with spaces"];`,
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
		`
class Container {
  constructor(private privateProperty: number) {}
}

const container = new Container(123);
container['privateProperty'] = 456;
`,
		{
			code: `
declare const container: {
  [i: string]: string;
}

container['protectedProperty'] = "value";
`,
			options: { allowIndexSignaturePropertyAccess: true },
		},
	],
});
