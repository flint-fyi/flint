import { ruleTester } from "./ruleTester.ts";
import rule from "./sizeComparisonOperators.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (items.length > 0) {}
`,
			output: `
if (items.length) {}
`,
			snapshot: `
if (items.length > 0) {}
    ~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
if (items.length !== 0) {}
`,
			output: `
if (items.length) {}
`,
			snapshot: `
if (items.length !== 0) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
if (items.length != 0) {}
`,
			output: `
if (items.length) {}
`,
			snapshot: `
if (items.length != 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
if (items.length === 0) {}
`,
			output: `
if (!items.length) {}
`,
			snapshot: `
if (items.length === 0) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
if (items.length == 0) {}
`,
			output: `
if (!items.length) {}
`,
			snapshot: `
if (items.length == 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
if (items.length <= 0) {}
`,
			output: `
if (!items.length) {}
`,
			snapshot: `
if (items.length <= 0) {}
    ~~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
if (mySet.size > 0) {}
`,
			output: `
if (mySet.size) {}
`,
			snapshot: `
if (mySet.size > 0) {}
    ~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
if (myMap.size === 0) {}
`,
			output: `
if (!myMap.size) {}
`,
			snapshot: `
if (myMap.size === 0) {}
    ~~~~~~~~~~~~~~~~
    Prefer implicit boolean coercions instead of explicit \`=== 0\` comparisons.
`,
		},
		{
			code: `
return typeof value === "string" && value.length > 0;
`,
			output: `
return typeof value === "string" && !!value.length;
`,
			snapshot: `
return typeof value === "string" && value.length > 0;
                                    ~~~~~~~~~~~~~~~~
                                    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
const hasItems = items.length > 0;
`,
			output: `
const hasItems = !!items.length;
`,
			snapshot: `
const hasItems = items.length > 0;
                 ~~~~~~~~~~~~~~~~
                 Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
const check = () => items.length > 0;
`,
			output: `
const check = () => !!items.length;
`,
			snapshot: `
const check = () => items.length > 0;
                    ~~~~~~~~~~~~~~~~
                    Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
return items.length > 0;
`,
			output: `
return !!items.length;
`,
			snapshot: `
return items.length > 0;
       ~~~~~~~~~~~~~~~~
       Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
let value: boolean;
value = items.length > 0;
`,
			output: `
let value: boolean;
value = !!items.length;
`,
			snapshot: `
let value: boolean;
value = items.length > 0;
        ~~~~~~~~~~~~~~~~
        Prefer implicit boolean coercions instead of explicit \`> 0\` comparisons.
`,
		},
		{
			code: `
if (items.length) {}
`,
			options: { style: "explicit" },
			output: `
if (items.length > 0) {}
`,
			snapshot: `
if (items.length) {}
    ~~~~~~~~~~~~
    Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
while (items.length) {}
`,
			options: { style: "explicit" },
			output: `
while (items.length > 0) {}
`,
			snapshot: `
while (items.length) {}
       ~~~~~~~~~~~~
       Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
const result = items.length ? "yes" : "no";
`,
			options: { style: "explicit" },
			output: `
const result = items.length > 0 ? "yes" : "no";
`,
			snapshot: `
const result = items.length ? "yes" : "no";
               ~~~~~~~~~~~~
               Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
Boolean(items.length);
`,
			options: { style: "explicit" },
			output: `
Boolean(items.length > 0);
`,
			snapshot: `
Boolean(items.length);
        ~~~~~~~~~~~~
        Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
!!items.length;
`,
			options: { style: "explicit" },
			output: `
items.length > 0;
`,
			snapshot: `
!!items.length;
~~~~~~~~~~~~~~
Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
items.length && doSomething();
`,
			options: { style: "explicit" },
			output: `
items.length > 0 && doSomething();
`,
			snapshot: `
items.length && doSomething();
~~~~~~~~~~~~
Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
if (!items.length) {}
`,
			options: { style: "explicit" },
			output: `
if (items.length === 0) {}
`,
			snapshot: `
if (!items.length) {}
    ~~~~~~~~~~~~~
    Prefer explicit \`=== 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
if (mySet.size) {}
`,
			options: { style: "explicit" },
			output: `
if (mySet.size > 0) {}
`,
			snapshot: `
if (mySet.size) {}
    ~~~~~~~~~~
    Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
if (!myMap.size) {}
`,
			options: { style: "explicit" },
			output: `
if (myMap.size === 0) {}
`,
			snapshot: `
if (!myMap.size) {}
    ~~~~~~~~~~~
    Prefer explicit \`=== 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
do {} while (items.length);
`,
			options: { style: "explicit" },
			output: `
do {} while (items.length > 0);
`,
			snapshot: `
do {} while (items.length);
             ~~~~~~~~~~~~
             Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
for (; items.length; ) {}
`,
			options: { style: "explicit" },
			output: `
for (; items.length > 0; ) {}
`,
			snapshot: `
for (; items.length; ) {}
       ~~~~~~~~~~~~
       Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
		{
			code: `
const hasItems = items.length && items.size;
`,
			options: { style: "explicit" },
			output: `
const hasItems = items.length > 0 && items.size;
`,
			snapshot: `
const hasItems = items.length && items.size;
                 ~~~~~~~~~~~~
                 Prefer explicit \`> 0\` comparisons instead of implicit boolean coercions.
`,
		},
	],
	valid: [
		`if (items.length) {}`,
		`if (!items.length) {}`,
		`items.length && doSomething();`,
		`const result = items.length ? "yes" : "no";`,
		`Boolean(items.length);`,
		`if (mySet.size) {}`,
		`const count = items.length;`,
		`const count = items.length ?? 0;`,
		`const value = items.length || 1;`,
		`const size = mySet.size;`,
		`const fallback = items.length || defaultValue;`,
		`const combined = items.length + otherItems.length;`,
		`function getLength() { return items.length; }`,
		`array.map(item => item.length);`,
		`if (items.length >= 1) {}`,
		{ code: `if (items.length > 0) {}`, options: { style: "explicit" } },
		{ code: `if (items.length === 0) {}`, options: { style: "explicit" } },
		{ code: `if (items.length !== 0) {}`, options: { style: "explicit" } },
		{ code: `if (items.length >= 1) {}`, options: { style: "explicit" } },
		{ code: `const count = items.length;`, options: { style: "explicit" } },
		{
			code: `const count = items.length ?? 0;`,
			options: { style: "explicit" },
		},
		{
			code: `const value = items.length || 1;`,
			options: { style: "explicit" },
		},
		{ code: `const size = mySet.size;`, options: { style: "explicit" } },
		{ code: `if (mySet.size > 0) {}`, options: { style: "explicit" } },
		{ code: `if (myMap.size === 0) {}`, options: { style: "explicit" } },
		{
			code: `const fallback = items.length || defaultValue;`,
			options: { style: "explicit" },
		},
		{
			code: `const combined = items.length + otherItems.length;`,
			options: { style: "explicit" },
		},
		{
			code: `function getLength() { return items.length; }`,
			options: { style: "explicit" },
		},
		{
			code: `array.map(item => item.length);`,
			options: { style: "explicit" },
		},
	],
});
