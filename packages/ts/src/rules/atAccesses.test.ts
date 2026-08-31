import rule from "./atAccesses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[];
const last = array[array.length - 1];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const items: number[];
const secondLast = items[items.length - 2];
`,
			snapshot: `
declare const items: number[];
const secondLast = items[items.length - 2];
                   ~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const str: string;
const char = str[str.length - 1];
`,
			snapshot: `
declare const str: string;
const char = str[str.length - 1];
             ~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
function getValue(this: { data: number[] }) {
    return this.data[this.data.length - 1];
}
`,
			snapshot: `
function getValue(this: { data: number[] }) {
    return this.data[this.data.length - 1];
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer using .at() with a negative index instead of calculating length minus an offset.
}
`,
		},
		{
			code: `
declare function getArray(): number[];
const element = getArray()[getArray().length - 1];
`,
			snapshot: `
declare function getArray(): number[];
const element = getArray()[getArray().length - 1];
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length /* comment */ - 1];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length /* comment */ - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[/* before */ array.length - 1];
`,
			snapshot: `
declare const array: number[];
const last = array[/* before */ array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - /* after */ 1];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - /* after */ 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - 1 /* trailing */];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 1 /* trailing */];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - 0b1];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 0b1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - 0o11];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 0o11];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - 0xFF];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 0xFF];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - 1.0];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - 1.0];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[(array.length) - 1];
`,
			snapshot: `
declare const array: number[];
const last = array[(array.length) - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length - (1)];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length - (1)];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[(array.length - 1)];
`,
			snapshot: `
declare const array: number[];
const last = array[(array.length - 1)];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = (array)[array.length - 1];
`,
			snapshot: `
declare const array: number[];
const last = (array)[array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = ((array[array.length - 1]));
`,
			snapshot: `
declare const array: number[];
const last = ((array[array.length - 1]));
               ~~~~~~~~~~~~~~~~~~~~~~~
               Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[][];
const last = array[0][array[0].length - 1];
`,
			snapshot: `
declare const array: number[][];
const last = array[0][array[0].length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: { pop(): { shift(): number[] } }[];
array[array.length - 1].pop().shift()[0];
`,
			snapshot: `
declare const array: { pop(): { shift(): number[] } }[];
array[array.length - 1].pop().shift()[0];
~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
let a = 0;
a = array[array.length - 1]
`,
			snapshot: `
declare const array: number[];
let a = 0;
a = array[array.length - 1]
    ~~~~~~~~~~~~~~~~~~~~~~~
    Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const a = array[array.length - 1]
`,
			snapshot: `
declare const array: number[];
const a = array[array.length - 1]
          ~~~~~~~~~~~~~~~~~~~~~~~
          Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const {a = array[array.length - 1]} = {}
`,
			snapshot: `
declare const array: number[];
const {a = array[array.length - 1]} = {}
           ~~~~~~~~~~~~~~~~~~~~~~~
           Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
typeof array[array.length - 1]
`,
			snapshot: `
declare const array: number[];
typeof array[array.length - 1]
       ~~~~~~~~~~~~~~~~~~~~~~~
       Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
class Foo { bar: number[] = []; baz() { return this.bar[this.bar.length - 1]; } }
`,
			snapshot: `
class Foo { bar: number[] = []; baz() { return this.bar[this.bar.length - 1]; } }
                                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                               Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const last = array[array.length -1];
`,
			snapshot: `
declare const array: number[];
const last = array[array.length -1];
             ~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
const ninth = array[array.length - 9];
`,
			snapshot: `
declare const array: number[];
const ninth = array[array.length - 9];
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
array[array /* comment */.length - 1]
`,
			snapshot: `
declare const array: number[];
array[array /* comment */.length - 1]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const array: number[];
/* before */ if /* after */ (true) { array[array.length - 1]; }
`,
			snapshot: `
declare const array: number[];
/* before */ if /* after */ (true) { array[array.length - 1]; }
                                     ~~~~~~~~~~~~~~~~~~~~~~~
                                     Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
declare const obj: { array: number[] };
obj.array[obj.array/* comment */.length - 1]
`,
			snapshot: `
declare const obj: { array: number[] };
obj.array[obj.array/* comment */.length - 1]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
	],
	valid: [
		`
declare const array: number[];
const first = array[0];
`,
		`
declare const array: number[];
const last = array.at(-1);
`,
		`
declare const array: number[];
declare const index: number;
const element = array[index];
`,
		`
declare const array: number[];
declare const someVar: number;
const value = array[someVar - 1];
`,
		`
declare const array: number[];
declare const other: number[];
const item = array[other.length - 1];
`,
		`
declare const str: string;
const char = str.charAt(0);
`,
		`
declare const array: number[];
const last = array[array.length];
`,
		`
declare const array: number[];
const value = array[array.length + 1];
`,
		`
declare const array: number[];
const item = array[array.length - 0];
`,
		`
declare const array: number[];
array[array.length - 1] = 1
`,
		`
declare const array: number[];
array[array.length - 1] += 1
`,
		`
declare const array: number[];
array[array.length - 1] -= 1
`,
		`
declare const array: number[];
array[array.length - 1] *= 1
`,
		`
declare const array: number[];
array[array.length - 1] %= 1
`,
		`
declare const array: number[];
++ array[array.length - 1]
`,
		`
declare const array: number[];
-- array[array.length - 1]
`,
		`
declare const array: number[];
array[array.length - 1] ++
`,
		`
declare const array: number[];
array[array.length - 1] --
`,
		`
declare const array: number[];
delete array[array.length - 1]
`,
		`
declare const array: number[];
([array[array.length - 1]] = [0])
`,
		`
declare const value: { foo: number };
declare const array: number[];
({foo: array[array.length - 1]} = value)
`,
		`
declare const array: number[];
({foo: array[array.length - 1] = 9} = {})
`,
		`
declare const array: number[];
array[array.length + -1]
`,
		`
declare const array: number[];
array[array.length - -1]
`,
		`
declare const array: number[];
array[array.length - 1.5]
`,
		`
declare const array: number[];
const offset = Number("1");
array[array.length - offset]
`,
	],
});
