import { ruleTester } from "./ruleTester.ts";
import rule from "./sizeComparisonOperators.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (items.length) {}
`,
			output: `
if (items.length > 0) {}
`,
			snapshot: `
if (items.length) {}
    ~~~~~~~~~~~~
    Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
while (items.length) {}
`,
			output: `
while (items.length > 0) {}
`,
			snapshot: `
while (items.length) {}
       ~~~~~~~~~~~~
       Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
const result = items.length ? "yes" : "no";
`,
			output: `
const result = items.length > 0 ? "yes" : "no";
`,
			snapshot: `
const result = items.length ? "yes" : "no";
               ~~~~~~~~~~~~
               Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
Boolean(items.length);
`,
			output: `
Boolean(items.length > 0);
`,
			snapshot: `
Boolean(items.length);
        ~~~~~~~~~~~~
        Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
!!items.length;
`,
			output: `
items.length > 0;
`,
			snapshot: `
!!items.length;
~~~~~~~~~~~~~~
Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
items.length && doSomething();
`,
			output: `
items.length > 0 && doSomething();
`,
			snapshot: `
items.length && doSomething();
~~~~~~~~~~~~
Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
if (!items.length) {}
`,
			output: `
if (items.length === 0) {}
`,
			snapshot: `
if (!items.length) {}
    ~~~~~~~~~~~~~
    Use explicit \`=== 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
if (mySet.size) {}
`,
			output: `
if (mySet.size > 0) {}
`,
			snapshot: `
if (mySet.size) {}
    ~~~~~~~~~~
    Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
if (!myMap.size) {}
`,
			output: `
if (myMap.size === 0) {}
`,
			snapshot: `
if (!myMap.size) {}
    ~~~~~~~~~~~
    Use explicit \`=== 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
do {} while (items.length);
`,
			output: `
do {} while (items.length > 0);
`,
			snapshot: `
do {} while (items.length);
             ~~~~~~~~~~~~
             Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
for (; items.length; ) {}
`,
			output: `
for (; items.length > 0; ) {}
`,
			snapshot: `
for (; items.length; ) {}
       ~~~~~~~~~~~~
       Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
		{
			code: `
const hasItems = items.length && items.size;
`,
			output: `
const hasItems = items.length > 0 && items.size;
`,
			snapshot: `
const hasItems = items.length && items.size;
                 ~~~~~~~~~~~~
                 Use explicit \`> 0\` comparison instead of implicit boolean coercion.
`,
		},
	],
	valid: [
		`if (items.length > 0) {}`,
		`if (items.length === 0) {}`,
		`if (items.length !== 0) {}`,
		`if (items.length >= 1) {}`,
		`const count = items.length;`,
		`const count = items.length ?? 0;`,
		`const value = items.length || 1;`,
		`const size = mySet.size;`,
		`if (mySet.size > 0) {}`,
		`if (myMap.size === 0) {}`,
		`const fallback = items.length || defaultValue;`,
		`const combined = items.length + otherItems.length;`,
		`function getLength() { return items.length; }`,
		`array.map(item => item.length);`,
	],
});
