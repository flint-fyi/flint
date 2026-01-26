import { ruleTester } from "./ruleTester.ts";
import rule from "./strictBooleanExpressions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: any;
if (value) {}
`,
			snapshot: `
declare const value: any;
if (value) {}
    ~~~~~
    Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const value: any;
while (value) {}
`,
			snapshot: `
declare const value: any;
while (value) {}
       ~~~~~
       Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const value: any;
do {} while (value);
`,
			snapshot: `
declare const value: any;
do {} while (value);
             ~~~~~
             Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const value: any;
for (; value; ) {}
`,
			snapshot: `
declare const value: any;
for (; value; ) {}
       ~~~~~
       Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const value: any;
const result = value ? 1 : 0;
`,
			snapshot: `
declare const value: any;
const result = value ? 1 : 0;
               ~~~~~
               Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const value: any;
const negated = !value;
`,
			snapshot: `
declare const value: any;
const negated = !value;
                 ~~~~~
                 Using \`any\` in a boolean context can cause unexpected behavior.
`,
		},
		{
			code: `
declare const flag: boolean | null;
if (flag) {}
`,
			snapshot: `
declare const flag: boolean | null;
if (flag) {}
    ~~~~
    Nullable booleans require explicit null checks in conditions.
`,
		},
		{
			code: `
declare const flag: boolean | undefined;
if (flag) {}
`,
			snapshot: `
declare const flag: boolean | undefined;
if (flag) {}
    ~~~~
    Nullable booleans require explicit null checks in conditions.
`,
		},
		{
			code: `
declare const flag: boolean | null | undefined;
if (flag) {}
`,
			snapshot: `
declare const flag: boolean | null | undefined;
if (flag) {}
    ~~~~
    Nullable booleans require explicit null checks in conditions.
`,
		},
		{
			code: `
const config = { enabled: true };
if (config) {}
`,
			snapshot: `
const config = { enabled: true };
if (config) {}
    ~~~~~~
    This condition is always truthy.
`,
		},
		{
			code: `
function getHandler() { return () => {}; }
if (getHandler()) {}
`,
			snapshot: `
function getHandler() { return () => {}; }
if (getHandler()) {}
    ~~~~~~~~~~~~
    This condition is always truthy.
`,
		},
		{
			code: `
class Service {}
const service = new Service();
if (service) {}
`,
			snapshot: `
class Service {}
const service = new Service();
if (service) {}
    ~~~~~~~
    This condition is always truthy.
`,
		},
	],
	valid: [
		`const flag = true; if (flag) {}`,
		`const flag = false; if (flag) {}`,
		`declare const flag: boolean; if (flag) {}`,
		`const text = "hello"; if (text) {}`,
		`declare const text: string; if (text) {}`,
		`const count = 42; if (count) {}`,
		`declare const count: number; if (count) {}`,
		`declare const item: object | null; if (item) {}`,
		`declare const item: object | undefined; if (item) {}`,
		`declare const nullable: string | null; if (nullable != null) {}`,
		`declare const flag: boolean | null; if (flag === true) {}`,
		`declare const flag: boolean | undefined; if (flag ?? false) {}`,
		`const items = [1, 2, 3]; if (items.length) {}`,
		`declare const items: number[]; if (items.length) {}`,
		`declare const getter: (() => void) | undefined; if (getter) {}`,
	],
});
