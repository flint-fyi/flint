import rule from "./regexTestMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const pattern: RegExp;
if (pattern.exec(text)) {}
`,
			snapshot: `
declare const pattern: RegExp;
if (pattern.exec(text)) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
while (/search/.exec(text)) {}
`,
			output: `
while (/search/.test(text)) {}
`,
			snapshot: `
while (/search/.exec(text)) {}
       ~~~~~~~~~~~~~~~~~~~
       Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
const found = !pattern.exec(text);
`,
			snapshot: `
declare const pattern: RegExp;
const found = !pattern.exec(text);
               ~~~~~~~~~~~~~~~~~~
               Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
const found = Boolean(pattern.exec(text));
`,
			snapshot: `
declare const pattern: RegExp;
const found = Boolean(pattern.exec(text));
                      ~~~~~~~~~~~~~~~~~~
                      Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const text: string;
if (text.match(/search/)) {}
`,
			output: `
declare const text: string;
if (/search/.test(text)) {}
`,
			snapshot: `
declare const text: string;
if (text.match(/search/)) {}
    ~~~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.match()\`.
`,
		},
		{
			code: `
declare const text: string;
if (text.match(new RegExp("search"))) {}
`,
			output: `
declare const text: string;
if (new RegExp("search").test(text)) {}
`,
			snapshot: `
declare const text: string;
if (text.match(new RegExp("search"))) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.match()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
const result = pattern.exec(text) ? "found" : "missing";
`,
			snapshot: `
declare const pattern: RegExp;
const result = pattern.exec(text) ? "found" : "missing";
               ~~~~~~~~~~~~~~~~~~
               Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
if (pattern.exec(text) && other) {}
`,
			snapshot: `
declare const pattern: RegExp;
if (pattern.exec(text) && other) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
do {} while (pattern.exec(text));
`,
			snapshot: `
declare const pattern: RegExp;
do {} while (pattern.exec(text));
             ~~~~~~~~~~~~~~~~~~
             Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
for (; pattern.exec(text);) {}
`,
			snapshot: `
declare const pattern: RegExp;
for (; pattern.exec(text);) {}
       ~~~~~~~~~~~~~~~~~~
       Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const text: string;
if (text.match(/search/g)) {}
`,
			snapshot: `
declare const text: string;
if (text.match(/search/g)) {}
    ~~~~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.match()\`.
`,
		},
		{
			code: `
if (/search/g.exec(text)) {}
`,
			snapshot: `
if (/search/g.exec(text)) {}
    ~~~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
	],
	valid: [
		`declare const text: string; const matches = text.match(/search/);`,
		`declare const pattern: RegExp; const result = pattern.exec(text);`,
		`declare const pattern: RegExp; pattern.test(text);`,
		`declare const text: string; text.match();`,
		`declare const text: string; text.match("search");`,
		`declare const pattern: RegExp; if (pattern.test(text)) {}`,
		`declare const pattern: RegExp; const group = pattern.exec(text)?.[1];`,
		`
declare const hasMatch: { match(...args: unknown[]): unknown };
hasMatch.match(/test/);
`,
	],
});
