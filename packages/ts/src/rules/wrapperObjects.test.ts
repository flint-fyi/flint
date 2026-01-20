import { ruleTester } from "./ruleTester.ts";
import rule from "./wrapperObjects.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new String("hello");
`,
			snapshot: `
new String("hello");
~~~~~~~~~~~~~~~~~~~
String wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const text = new String("hello");
`,
			snapshot: `
const text = new String("hello");
             ~~~~~~~~~~~~~~~~~~~
             String wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const count = new Number(42);
`,
			snapshot: `
const count = new Number(42);
              ~~~~~~~~~~~~~~
              Number wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const flag = new Boolean(true);
`,
			snapshot: `
const flag = new Boolean(true);
             ~~~~~~~~~~~~~~~~~
             Boolean wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const emptyText = new String();
`,
			snapshot: `
const emptyText = new String();
                  ~~~~~~~~~~~~
                  String wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const zeroValue = new Number();
`,
			snapshot: `
const zeroValue = new Number();
                  ~~~~~~~~~~~~
                  Number wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const falseValue = new Boolean();
`,
			snapshot: `
const falseValue = new Boolean();
                   ~~~~~~~~~~~~~
                   Boolean wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
		{
			code: `
const converted = new String(123);
`,
			snapshot: `
const converted = new String(123);
                  ~~~~~~~~~~~~~~~
                  String wrapper objects are rarely intended and can cause unexpected behavior.
`,
		},
	],
	valid: [
		"String(0);",
		"String('');",
		"const text = String(value);",
		"const count = Number(value);",
		"const flag = Boolean(value);",
		"const text = 'hello';",
		"const count = 42;",
		"const flag = true;",
		"class CustomString { constructor(value: string) {} } new CustomString('test');",
		"function String(value: string) { return value; } String('test');",
		"const String = (value: string) => value; String('test');",
		"const obj = new Object();",
		"const list = new Array(10);",
		"new (String as unknown)('test');",
		"const constructor = String; new constructor('test');",
	],
});
