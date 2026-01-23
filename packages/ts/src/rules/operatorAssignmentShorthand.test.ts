import rule from "./operatorAssignmentShorthand.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value = 0;
value = value + 1;
`,
			output: `
let value = 0;
value += 1;
`,
			snapshot: `
let value = 0;
value = value + 1;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`+=\` operator assignment.
`,
		},
		{
			code: `
let value = 0;
value = value - 1;
`,
			output: `
let value = 0;
value -= 1;
`,
			snapshot: `
let value = 0;
value = value - 1;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`-=\` operator assignment.
`,
		},
		{
			code: `
let value = 0;
value = value * 2;
`,
			output: `
let value = 0;
value *= 2;
`,
			snapshot: `
let value = 0;
value = value * 2;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`*=\` operator assignment.
`,
		},
		{
			code: `
let value = 1;
value = value / 2;
`,
			output: `
let value = 1;
value /= 2;
`,
			snapshot: `
let value = 1;
value = value / 2;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`/=\` operator assignment.
`,
		},
		{
			code: `
let value = 5;
value = value % 2;
`,
			output: `
let value = 5;
value %= 2;
`,
			snapshot: `
let value = 5;
value = value % 2;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`%=\` operator assignment.
`,
		},
		{
			code: `
let value = 2;
value = value ** 3;
`,
			output: `
let value = 2;
value **= 3;
`,
			snapshot: `
let value = 2;
value = value ** 3;
~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`**=\` operator assignment.
`,
		},
		{
			code: `
let value = 8;
value = value << 2;
`,
			output: `
let value = 8;
value <<= 2;
`,
			snapshot: `
let value = 8;
value = value << 2;
~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`<<=\` operator assignment.
`,
		},
		{
			code: `
let value = 8;
value = value >> 2;
`,
			output: `
let value = 8;
value >>= 2;
`,
			snapshot: `
let value = 8;
value = value >> 2;
~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`>>=\` operator assignment.
`,
		},
		{
			code: `
let value = 8;
value = value >>> 2;
`,
			output: `
let value = 8;
value >>>= 2;
`,
			snapshot: `
let value = 8;
value = value >>> 2;
~~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`>>>=\` operator assignment.
`,
		},
		{
			code: `
let value = 5;
value = value & 3;
`,
			output: `
let value = 5;
value &= 3;
`,
			snapshot: `
let value = 5;
value = value & 3;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`&=\` operator assignment.
`,
		},
		{
			code: `
let value = 5;
value = value ^ 3;
`,
			output: `
let value = 5;
value ^= 3;
`,
			snapshot: `
let value = 5;
value = value ^ 3;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`^=\` operator assignment.
`,
		},
		{
			code: `
let value = 5;
value = value | 3;
`,
			output: `
let value = 5;
value |= 3;
`,
			snapshot: `
let value = 5;
value = value | 3;
~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`|=\` operator assignment.
`,
		},
		{
			code: `
const object = { property: 0 };
object.property = object.property + 1;
`,
			output: `
const object = { property: 0 };
object.property += 1;
`,
			snapshot: `
const object = { property: 0 };
object.property = object.property + 1;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`+=\` operator assignment.
`,
		},
		{
			code: `
const array = [0];
array[0] = array[0] + 1;
`,
			output: `
const array = [0];
array[0] += 1;
`,
			snapshot: `
const array = [0];
array[0] = array[0] + 1;
~~~~~~~~~~~~~~~~~~~~~~~
This \`=\` assignment can be replaced with an \`+=\` operator assignment.
`,
		},
		{
			code: `
let a = 5;
a = 3 * a;
`,
			output: `
let a = 5;
a *= 3;
`,
			snapshot: `
let a = 5;
a = 3 * a;
~~~~~~~~~
This \`=\` assignment can be replaced with an \`*=\` operator assignment.
`,
		},
		{
			code: `
let a = 5;
a = 3 & a;
`,
			output: `
let a = 5;
a &= 3;
`,
			snapshot: `
let a = 5;
a = 3 & a;
~~~~~~~~~
This \`=\` assignment can be replaced with an \`&=\` operator assignment.
`,
		},
		{
			code: `
let a = 5;
a = 3 ^ a;
`,
			output: `
let a = 5;
a ^= 3;
`,
			snapshot: `
let a = 5;
a = 3 ^ a;
~~~~~~~~~
This \`=\` assignment can be replaced with an \`^=\` operator assignment.
`,
		},
		{
			code: `
let a = 5;
a = 3 | a;
`,
			output: `
let a = 5;
a |= 3;
`,
			snapshot: `
let a = 5;
a = 3 | a;
~~~~~~~~~
This \`=\` assignment can be replaced with an \`|=\` operator assignment.
`,
		},
	],
	valid: [
		`let value = 0; value += 1;`,
		`let value = 0; value -= 1;`,
		`let value = 0; value *= 2;`,
		`let value = 1; value /= 2;`,
		`let value = 5; value %= 2;`,
		`let value = 2; value **= 3;`,
		`let value = 8; value <<= 2;`,
		`let value = 8; value >>= 2;`,
		`let value = 8; value >>>= 2;`,
		`let value = 5; value &= 3;`,
		`let value = 5; value ^= 3;`,
		`let value = 5; value |= 3;`,
		`let value = 0; value = other + 1;`,
		`let value = 0; value = other - 1;`,
		`let value = 0; value = other * 2;`,
		`let value = 1; value = other / 2;`,
		`let value = 5; value = other % 2;`,
		`let value = 2; value = other ** 3;`,
		`let value = 8; value = other << 2;`,
		`let value = 8; value = other >> 2;`,
		`let value = 8; value = other >>> 2;`,
		`let value = 5; value = other & 3;`,
		`let value = 5; value = other ^ 3;`,
		`let value = 5; value = other | 3;`,
		`let value = 0; value = 1 + value;`,
		`const object = { a: 0, b: 1 }; object.a = object.b + 1;`,
		`const array = [0, 1]; array[0] = array[1] + 1;`,
	],
});
