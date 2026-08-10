import { ruleTester } from "./ruleTester.ts";
import rule from "./sizeComparisonOperators.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const items: number[];
if (items.length > 0) {}
`,
			output: `
declare const items: number[];
if (items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length > 0) {}
    ~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length !== 0) {}
`,
			output: `
declare const items: number[];
if (items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length !== 0) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length != 0) {}
`,
			output: `
declare const items: number[];
if (items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length != 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length === 0) {}
`,
			output: `
declare const items: number[];
if (!items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length === 0) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length == 0) {}
`,
			output: `
declare const items: number[];
if (!items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length == 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length <= 0) {}
`,
			output: `
declare const items: number[];
if (!items.length) {}
`,
			snapshot: `
declare const items: number[];
if (items.length <= 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
declare const mySet: Set<number>;
if (mySet.size > 0) {}
`,
			output: `
declare const mySet: Set<number>;
if (mySet.size) {}
`,
			snapshot: `
declare const mySet: Set<number>;
if (mySet.size > 0) {}
    ~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const myMap: Map<string, number>;
if (myMap.size === 0) {}
`,
			output: `
declare const myMap: Map<string, number>;
if (!myMap.size) {}
`,
			snapshot: `
declare const myMap: Map<string, number>;
if (myMap.size === 0) {}
    ~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
function check(value: unknown): boolean {
return typeof value === "string" && value.length > 0;
}
`,
			output: `
function check(value: unknown): boolean {
return typeof value === "string" && !!value.length;
}
`,
			snapshot: `
function check(value: unknown): boolean {
return typeof value === "string" && value.length > 0;
                                    ~~~~~~~~~~~~~~~~
                                    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
}
`,
		},
		{
			code: `
declare const items: number[];
const hasItems = items.length > 0;
`,
			output: `
declare const items: number[];
const hasItems = !!items.length;
`,
			snapshot: `
declare const items: number[];
const hasItems = items.length > 0;
                 ~~~~~~~~~~~~~~~~
                 Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
const check = () => items.length > 0;
`,
			output: `
declare const items: number[];
const check = () => !!items.length;
`,
			snapshot: `
declare const items: number[];
const check = () => items.length > 0;
                    ~~~~~~~~~~~~~~~~
                    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
function f() {
return items.length > 0;
}
`,
			output: `
declare const items: number[];
function f() {
return !!items.length;
}
`,
			snapshot: `
declare const items: number[];
function f() {
return items.length > 0;
       ~~~~~~~~~~~~~~~~
       Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
}
`,
		},
		{
			code: `
declare const items: number[];
let value: boolean;
value = items.length > 0;
`,
			output: `
declare const items: number[];
let value: boolean;
value = !!items.length;
`,
			snapshot: `
declare const items: number[];
let value: boolean;
value = items.length > 0;
        ~~~~~~~~~~~~~~~~
        Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
declare const items: number[];
if (items.length) {}
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
if (items.length > 0) {}
`,
			snapshot: `
declare const items: number[];
if (items.length) {}
    ~~~~~~~~~~~~
    Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
while (items.length) {}
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
while (items.length > 0) {}
`,
			snapshot: `
declare const items: number[];
while (items.length) {}
       ~~~~~~~~~~~~
       Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
const result = items.length ? "yes" : "no";
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
const result = items.length > 0 ? "yes" : "no";
`,
			snapshot: `
declare const items: number[];
const result = items.length ? "yes" : "no";
               ~~~~~~~~~~~~
               Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
Boolean(items.length);
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
Boolean(items.length > 0);
`,
			snapshot: `
declare const items: number[];
Boolean(items.length);
        ~~~~~~~~~~~~
        Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
!!items.length;
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
items.length > 0;
`,
			snapshot: `
declare const items: number[];
!!items.length;
~~~~~~~~~~~~~~
Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
declare function doSomething(): void;
items.length && doSomething();
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
declare function doSomething(): void;
items.length > 0 && doSomething();
`,
			snapshot: `
declare const items: number[];
declare function doSomething(): void;
items.length && doSomething();
~~~~~~~~~~~~
Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
if (!items.length) {}
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
if (items.length === 0) {}
`,
			snapshot: `
declare const items: number[];
if (!items.length) {}
    ~~~~~~~~~~~~~
    Prefer explicit \`=== 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const mySet: Set<number>;
if (mySet.size) {}
`,
			options: { style: "explicit" },
			output: `
declare const mySet: Set<number>;
if (mySet.size > 0) {}
`,
			snapshot: `
declare const mySet: Set<number>;
if (mySet.size) {}
    ~~~~~~~~~~
    Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const myMap: Map<string, number>;
if (!myMap.size) {}
`,
			options: { style: "explicit" },
			output: `
declare const myMap: Map<string, number>;
if (myMap.size === 0) {}
`,
			snapshot: `
declare const myMap: Map<string, number>;
if (!myMap.size) {}
    ~~~~~~~~~~~
    Prefer explicit \`=== 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
do {} while (items.length);
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
do {} while (items.length > 0);
`,
			snapshot: `
declare const items: number[];
do {} while (items.length);
             ~~~~~~~~~~~~
             Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: number[];
for (; items.length; ) {}
`,
			options: { style: "explicit" },
			output: `
declare const items: number[];
for (; items.length > 0; ) {}
`,
			snapshot: `
declare const items: number[];
for (; items.length; ) {}
       ~~~~~~~~~~~~
       Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
declare const items: { length: number; size: number };
const hasItems = items.length && items.size;
`,
			options: { style: "explicit" },
			output: `
declare const items: { length: number; size: number };
const hasItems = items.length > 0 && items.size;
`,
			snapshot: `
declare const items: { length: number; size: number };
const hasItems = items.length && items.size;
                 ~~~~~~~~~~~~
                 Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
	],
	valid: [
		`declare const items: number[]; if (items.length) {}`,
		`declare const items: number[]; if (!items.length) {}`,
		`
declare const items: number[];
declare function doSomething(): void;

items.length && doSomething();
`,
		`declare const items: number[]; const result = items.length ? "yes" : "no";`,
		`declare const items: number[]; Boolean(items.length);`,
		`declare const mySet: Set<number>; if (mySet.size) {}`,
		`declare const items: number[]; const count = items.length;`,
		`declare const items: number[]; const count = items.length ?? 0;`,
		`declare const items: number[]; const value = items.length || 1;`,
		`declare const mySet: Set<number>; const size = mySet.size;`,
		`
declare const defaultValue: number;
declare const items: number[];

const fallback = items.length || defaultValue;
`,
		`
declare const items: number[];
declare const otherItems: number[];

const combined = items.length + otherItems.length;
`,
		`declare const items: number[]; function getLength() { return items.length; }`,
		`declare const array: { length: number }[]; array.map(item => item.length);`,
		`declare const items: number[]; if (items.length >= 1) {}`,
		{
			code: `declare const items: number[]; if (items.length > 0) {}`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; if (items.length === 0) {}`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; if (items.length !== 0) {}`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; if (items.length >= 1) {}`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; const count = items.length;`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; const count = items.length ?? 0;`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; const value = items.length || 1;`,
			options: { style: "explicit" },
		},
		{
			code: `declare const mySet: Set<number>; const size = mySet.size;`,
			options: { style: "explicit" },
		},
		{
			code: `declare const mySet: Set<number>; if (mySet.size > 0) {}`,
			options: { style: "explicit" },
		},
		{
			code: `declare const myMap: Map<string, number>; if (myMap.size === 0) {}`,
			options: { style: "explicit" },
		},
		{
			code: `
declare const defaultValue: number;
declare const items: number[];

const fallback = items.length || defaultValue;
`,
			options: { style: "explicit" },
		},
		{
			code: `
declare const items: number[];
declare const otherItems: number[];

const combined = items.length + otherItems.length;
`,
			options: { style: "explicit" },
		},
		{
			code: `declare const items: number[]; function getLength() { return items.length; }`,
			options: { style: "explicit" },
		},
		{
			code: `declare const array: { length: number }[]; array.map(item => item.length);`,
			options: { style: "explicit" },
		},
	],
});
