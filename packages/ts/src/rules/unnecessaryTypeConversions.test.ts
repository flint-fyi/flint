import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeConversions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const text: string;
String(text);
`,
			snapshot: `
declare const text: string;
String(text);
~~~~~~
This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
text satisfies string;
`,
				},
			],
		},
		{
			code: `
declare const text: string;
text.toString(1);
`,
			snapshot: `
declare const text: string;
text.toString(1);
     ~~~~~~~~~~~
     This method conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
text satisfies string;
`,
				},
			],
		},
		{
			code: `
declare const text: string;
text + "";
`,
			snapshot: `
declare const text: string;
text + "";
    ~~~~~
    This string concatenation conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
text satisfies string;
`,
				},
			],
		},
		{
			code: `
declare const text: string;
"" + text;
`,
			snapshot: `
declare const text: string;
"" + text;
~~~~~
This string concatenation conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
text satisfies string;
`,
				},
			],
		},
		{
			code: `
let text = "value";
text += "";
`,
			snapshot: `
let text = "value";
text += "";
~~~~~~~~~~
This string assignment conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
let text = "value";

`,
				},
				{
					id: "useSatisfies",
					updated: `
let text = "value";
text satisfies string;
`,
				},
			],
		},
		{
			code: `
declare const count: number;
+count;
`,
			snapshot: `
declare const count: number;
+count;
~
This unary conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const count: number;
count;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const count: number;
count satisfies number;
`,
				},
			],
		},
		{
			code: `
declare const enabled: boolean;
!!enabled;
`,
			snapshot: `
declare const enabled: boolean;
!!enabled;
~~
This unary conversion is unnecessary because the expression is already boolean.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const enabled: boolean;
enabled;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const enabled: boolean;
enabled satisfies boolean;
`,
				},
			],
		},
		{
			code: `
declare const enabled: boolean;
! !enabled;
`,
			snapshot: `
declare const enabled: boolean;
! !enabled;
~~~
This unary conversion is unnecessary because the expression is already boolean.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const enabled: boolean;
enabled;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const enabled: boolean;
enabled satisfies boolean;
`,
				},
			],
		},
		{
			code: `
declare const integer: 1 | 2;
~~integer;
`,
			snapshot: `
declare const integer: 1 | 2;
~~integer;
~~
This unary conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const integer: 1 | 2;
integer;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const integer: 1 | 2;
integer satisfies number;
`,
				},
			],
		},
		{
			code: `
Number(1);
`,
			snapshot: `
Number(1);
~~~~~~
This constructor conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
1;
`,
				},
				{
					id: "useSatisfies",
					updated: `
1 satisfies number;
`,
				},
			],
		},
		{
			code: `
Boolean(true);
`,
			snapshot: `
Boolean(true);
~~~~~~~
This constructor conversion is unnecessary because the expression is already boolean.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
true;
`,
				},
				{
					id: "useSatisfies",
					updated: `
true satisfies boolean;
`,
				},
			],
		},
		{
			code: `
BigInt(1n);
`,
			snapshot: `
BigInt(1n);
~~~~~~
This constructor conversion is unnecessary because the expression is already bigint.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
1n;
`,
				},
				{
					id: "useSatisfies",
					updated: `
1n satisfies bigint;
`,
				},
			],
		},
		{
			code: `
function convert<T extends string>(text: T) {
    return String(text);
}
`,
			snapshot: `
function convert<T extends string>(text: T) {
    return String(text);
           ~~~~~~
           This constructor conversion is unnecessary because the expression is already string.
}
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
function convert<T extends string>(text: T) {
    return text;
}
`,
				},
				{
					id: "useSatisfies",
					updated: `
function convert<T extends string>(text: T) {
    return text satisfies string;
}
`,
				},
			],
		},
		{
			code: `
let text = "value";
consume(text += "");
`,
			snapshot: `
let text = "value";
consume(text += "");
        ~~~~~~~~~~
        This string assignment conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
let text = "value";
consume(text);
`,
				},
				{
					id: "useSatisfies",
					updated: `
let text = "value";
consume(text satisfies string);
`,
				},
			],
		},
		{
			code: `
String("a" + "b").length;
`,
			snapshot: `
String("a" + "b").length;
~~~~~~
This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
("a" + "b").length;
`,
				},
				{
					id: "useSatisfies",
					updated: `
(("a" + "b") satisfies string).length;
`,
				},
			],
		},
		{
			code: `
2 * Number(2 + 2);
`,
			snapshot: `
2 * Number(2 + 2);
    ~~~~~~
    This constructor conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
2 * (2 + 2);
`,
				},
				{
					id: "useSatisfies",
					updated: `
2 * ((2 + 2) satisfies number);
`,
				},
			],
		},
		{
			code: `
const previous = 1
String("a" + "b").length;
`,
			snapshot: `
const previous = 1
String("a" + "b").length;
~~~~~~
This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
const previous = 1
;("a" + "b").length;
`,
				},
				{
					id: "useSatisfies",
					updated: `
const previous = 1
;(("a" + "b") satisfies string).length;
`,
				},
			],
		},
		{
			code: `
~~2147483648;
`,
			snapshot: `
~~2147483648;
~~
This unary conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
2147483648;
`,
				},
				{
					id: "useSatisfies",
					updated: `
2147483648 satisfies number;
`,
				},
			],
		},
		{
			code: `
~~-1;
`,
			snapshot: `
~~-1;
~~
This unary conversion is unnecessary because the expression is already number.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
(-1);
`,
				},
				{
					id: "useSatisfies",
					updated: `
(-1) satisfies number;
`,
				},
			],
		},
		{
			code: `
declare const text: string;
(String(text));
`,
			snapshot: `
declare const text: string;
(String(text));
 ~~~~~~
 This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
(text);
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
(text satisfies string);
`,
				},
			],
		},
		{
			code: `
declare const text: string;
String(text)[0];
`,
			snapshot: `
declare const text: string;
String(text)[0];
~~~~~~
This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text[0];
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
(text satisfies string)[0];
`,
				},
			],
		},
		{
			code: `
declare const text: string;
String(text)\`suffix\`;
`,
			snapshot: `
declare const text: string;
String(text)\`suffix\`;
~~~~~~
This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
declare const text: string;
text\`suffix\`;
`,
				},
				{
					id: "useSatisfies",
					updated: `
declare const text: string;
(text satisfies string)\`suffix\`;
`,
				},
			],
		},
		{
			code: `
const text = String("a" + "b");
`,
			snapshot: `
const text = String("a" + "b");
             ~~~~~~
             This constructor conversion is unnecessary because the expression is already string.
`,
			suggestions: [
				{
					id: "removeTypeConversion",
					updated: `
const text = ("a" + "b");
`,
				},
				{
					id: "useSatisfies",
					updated: `
const text = ("a" + "b") satisfies string;
`,
				},
			],
		},
	],
	valid: [
		`String(); Number(); Boolean(); BigInt();`,
		`String(1); Number("1"); Boolean(1); BigInt(1);`,
		`declare const value: string | number; String(value);`,
		`declare const value: any; String(value);`,
		`declare const value: unknown; String(value);`,
		`declare const value: String; String(value);`,
		`new String("value");`,
		`function String(value: string) { return value; } String("value");`,
		`function convert(String: (value: string) => string) { return String("value"); }`,
		`declare const toString: () => string; toString();`,
		`declare const text: string; text.toString; text["toString"]();`,
		`enum State { Ready = "ready" } State.Ready.toString();`,
		`declare const count: number; count + ""; "" + count; count += "";`,
		`declare const count: number; !count; ~count;`,
		`declare const enabled: boolean; !enabled;`,
		`declare const count: number; ~~count;`,
		`declare const fraction: 1.5; ~~fraction;`,
		`declare const count: number; count - 1;`,
	],
});
