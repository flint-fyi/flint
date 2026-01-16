import rule from "./atAccesses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const last = array[array.length - 1];
`,
			snapshot: `
const last = array[array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const secondLast = items[items.length - 2];
`,
			snapshot: `
const secondLast = items[items.length - 2];
                   ~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const char = str[str.length - 1];
`,
			snapshot: `
const char = str[str.length - 1];
             ~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const value = this.data[this.data.length - 1];
`,
			snapshot: `
const value = this.data[this.data.length - 1];
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const element = getArray()[getArray().length - 1];
`,
			snapshot: `
const element = getArray()[getArray().length - 1];
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length /* comment */ - 1];
`,
			snapshot: `
const last = array[array.length /* comment */ - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[/* before */ array.length - 1];
`,
			snapshot: `
const last = array[/* before */ array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - /* after */ 1];
`,
			snapshot: `
const last = array[array.length - /* after */ 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - 1 /* trailing */];
`,
			snapshot: `
const last = array[array.length - 1 /* trailing */];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - 0b1];
`,
			snapshot: `
const last = array[array.length - 0b1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - 0o11];
`,
			snapshot: `
const last = array[array.length - 0o11];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - 0xFF];
`,
			snapshot: `
const last = array[array.length - 0xFF];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - 1.0];
`,
			snapshot: `
const last = array[array.length - 1.0];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[(array.length) - 1];
`,
			snapshot: `
const last = array[(array.length) - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length - (1)];
`,
			snapshot: `
const last = array[array.length - (1)];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[(array.length - 1)];
`,
			snapshot: `
const last = array[(array.length - 1)];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = (array)[array.length - 1];
`,
			snapshot: `
const last = (array)[array.length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = ((array[array.length - 1]));
`,
			snapshot: `
const last = ((array[array.length - 1]));
               ~~~~~~~~~~~~~~~~~~~~~~~
               Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[0][array[0].length - 1];
`,
			snapshot: `
const last = array[0][array[0].length - 1];
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
array[array.length - 1].pop().shift()[0];
`,
			snapshot: `
array[array.length - 1].pop().shift()[0];
~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
a = array[array.length - 1]
`,
			snapshot: `
a = array[array.length - 1]
    ~~~~~~~~~~~~~~~~~~~~~~~
    Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const a = array[array.length - 1]
`,
			snapshot: `
const a = array[array.length - 1]
          ~~~~~~~~~~~~~~~~~~~~~~~
          Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const {a = array[array.length - 1]} = {}
`,
			snapshot: `
const {a = array[array.length - 1]} = {}
           ~~~~~~~~~~~~~~~~~~~~~~~
           Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
typeof array[array.length - 1]
`,
			snapshot: `
typeof array[array.length - 1]
       ~~~~~~~~~~~~~~~~~~~~~~~
       Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
class Foo { bar: number[]; baz() { return this.bar[this.bar.length - 1]; } }
`,
			snapshot: `
class Foo { bar: number[]; baz() { return this.bar[this.bar.length - 1]; } }
                                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                          Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const last = array[array.length -1];
`,
			snapshot: `
const last = array[array.length -1];
             ~~~~~~~~~~~~~~~~~~~~~~
             Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
const ninth = array[array.length - 9];
`,
			snapshot: `
const ninth = array[array.length - 9];
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
array[array /* comment */.length - 1]
`,
			snapshot: `
array[array /* comment */.length - 1]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
/* before */ if /* after */ (true) { array[array.length - 1]; }
`,
			snapshot: `
/* before */ if /* after */ (true) { array[array.length - 1]; }
                                     ~~~~~~~~~~~~~~~~~~~~~~~
                                     Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
		{
			code: `
obj.array[obj.array/* comment */.length - 1]
`,
			snapshot: `
obj.array[obj.array/* comment */.length - 1]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer using .at() with a negative index instead of calculating length minus an offset.
`,
		},
	],
	valid: [
		`const first = array[0];`,
		`const last = array.at(-1);`,
		`const element = array[index];`,
		`const value = array[someVar - 1];`,
		`const item = array[other.length - 1];`,
		`const char = str.charAt(0);`,
		`const last = array[array.length];`,
		`const value = array[array.length + 1];`,
		`const item = array[array.length - 0];`,
		`array[array.length - 1] = 1`,
		`array[array.length - 1] += 1`,
		`array[array.length - 1] -= 1`,
		`array[array.length - 1] *= 1`,
		`array[array.length - 1] %= 1`,
		`++ array[array.length - 1]`,
		`-- array[array.length - 1]`,
		`array[array.length - 1] ++`,
		`array[array.length - 1] --`,
		`delete array[array.length - 1]`,
		`([array[array.length - 1]] = [])`,
		`({foo: array[array.length - 1]} = {})`,
		`({foo: array[array.length - 1] = 9} = {})`,
		`array[array.length + -1]`,
		`array[array.length - -1]`,
		`array[array.length - 1.5]`,
		`array[array.length - "1"]`,
	],
});
