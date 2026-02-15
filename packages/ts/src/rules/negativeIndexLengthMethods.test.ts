import rule from "./negativeIndexLengthMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - 2);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - 2, values.length - 1);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2, -1);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - 2, values.length - 1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const text = "hello";
text.slice(text.length - 3);
`,
			output: `
const text = "hello";
text.slice(-3);
`,
			snapshot: `
const text = "hello";
text.slice(text.length - 3);
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.at(values.length - 1);
`,
			output: `
const values = [1, 2, 3];
values.at(-1);
`,
			snapshot: `
const values = [1, 2, 3];
values.at(values.length - 1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`at\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.splice(values.length - 1, 1);
`,
			output: `
const values = [1, 2, 3];
values.splice(-1, 1);
`,
			snapshot: `
const values = [1, 2, 3];
values.splice(values.length - 1, 1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`splice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.toSpliced(values.length - 1, 1);
`,
			output: `
const values = [1, 2, 3];
values.toSpliced(-1, 1);
`,
			snapshot: `
const values = [1, 2, 3];
values.toSpliced(values.length - 1, 1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`toSpliced\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.with(values.length - 1, 99);
`,
			output: `
const values = [1, 2, 3];
values.with(-1, 99);
`,
			snapshot: `
const values = [1, 2, 3];
values.with(values.length - 1, 99);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`with\`.
`,
		},
		{
			code: `
const buffer = new Int32Array([1, 2, 3, 4]);
buffer.subarray(buffer.length - 2);
`,
			output: `
const buffer = new Int32Array([1, 2, 3, 4]);
buffer.subarray(-2);
`,
			snapshot: `
const buffer = new Int32Array([1, 2, 3, 4]);
buffer.subarray(buffer.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`subarray\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice((values.length) - 2);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice((values.length) - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - (2));
`,
			output: `
const values = [1, 2, 3];
values.slice(-2);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - (2));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice((values.length - 2));
`,
			output: `
const values = [1, 2, 3];
values.slice((-2));
`,
			snapshot: `
const values = [1, 2, 3];
values.slice((values.length - 2));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - 2 - 1);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2 - 1);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - 2 - 1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
Array.prototype.slice.call(values, values.length - 2);
`,
			output: `
const values = [1, 2, 3];
Array.prototype.slice.call(values, -2);
`,
			snapshot: `
const values = [1, 2, 3];
Array.prototype.slice.call(values, values.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [values.length - 2]);
`,
			output: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [-2]);
`,
			snapshot: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [values.length - 2]);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [values.length - 2, values.length - 1]);
`,
			output: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [-2, -1]);
`,
			snapshot: `
const values = [1, 2, 3];
Array.prototype.slice.apply(values, [values.length - 2, values.length - 1]);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
[].slice.call(values, values.length - 2);
`,
			output: `
const values = [1, 2, 3];
[].slice.call(values, -2);
`,
			snapshot: `
const values = [1, 2, 3];
[].slice.call(values, values.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const text = "hello";
"".slice.call(text, text.length - 2);
`,
			output: `
const text = "hello";
"".slice.call(text, -2);
`,
			snapshot: `
const text = "hello";
"".slice.call(text, text.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const text = "hello";
String.prototype.slice.call(text, text.length - 2);
`,
			output: `
const text = "hello";
String.prototype.slice.call(text, -2);
`,
			snapshot: `
const text = "hello";
String.prototype.slice.call(text, text.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const buffer = new Int32Array([1, 2, 3]);
Int32Array.prototype.subarray.call(buffer, buffer.length - 2);
`,
			output: `
const buffer = new Int32Array([1, 2, 3]);
Int32Array.prototype.subarray.call(buffer, -2);
`,
			snapshot: `
const buffer = new Int32Array([1, 2, 3]);
Int32Array.prototype.subarray.call(buffer, buffer.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`subarray\`.
`,
		},
		{
			code: `
this.items.slice(this.items.length - 2);
`,
			output: `
this.items.slice(-2);
`,
			snapshot: `
this.items.slice(this.items.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
object.array.slice(object.array.length - 2);
`,
			output: `
object.array.slice(-2);
`,
			snapshot: `
object.array.slice(object.array.length - 2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - 0x2);
`,
			output: `
const values = [1, 2, 3];
values.slice(-0x2);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - 0x2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length - 2.0);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2.0);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length - 2.0);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
values.slice(values.length  -  2);
`,
			output: `
const values = [1, 2, 3];
values.slice(-2);
`,
			snapshot: `
const values = [1, 2, 3];
values.slice(values.length  -  2);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using a negative index over \`.length - index\` for \`slice\`.
`,
		},
	],
	valid: [
		`const values = [1, 2, 3]; values.slice(1);`,
		`const values = [1, 2, 3]; values.slice(-1);`,
		`const values = [1, 2, 3]; values.slice(1, 2);`,
		`const values = [1, 2, 3]; values.at(0);`,
		`const values = [1, 2, 3]; values.at(-1);`,
		`const values = [1, 2, 3]; const other = [4, 5]; values.slice(other.length - 1);`,
		`const values = [1, 2, 3]; values.slice(values.length);`,
		`const values = [1, 2, 3]; values.slice(values.length + 1);`,
		`const values = [1, 2, 3]; values.slice(values.length - 0);`,
		`const values = [1, 2, 3]; values.slice(values.length - -1);`,
		`const values = [1, 2, 3]; values.slice(values.length * 2);`,
		`const text = "hello"; text.slice(0, 3);`,
		`const values = [1, 2, 3]; values.indexOf(1);`,
		`const values = [1, 2, 3]; values.push(4);`,
		`const values = [1, 2, 3]; values.pop();`,
		`values.slice(values.length - 1.5);`,
		`const values = [1, 2, 3]; Object.prototype.slice.call(values, values.length - 2);`,
		`const obj = { length: 5; slice(at: number) {} }; obj.slice(obj.length - 2);`,
		`declare const custom: { length: number; slice(start: number): void }; custom.slice(custom.length - 2);`,
		`const values = [1, 2, 3]; values.toSpliced(values.length);`,
		`const text = "hello"; text.subarray?.(text.length - 2);`,
	],
});
