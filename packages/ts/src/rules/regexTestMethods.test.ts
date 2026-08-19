import rule from "./regexTestMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const pattern: RegExp;
declare const text: string;

if (pattern.exec(text)) {}
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

if (pattern.exec(text)) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const text: string;

while (/search/.exec(text)) {}
`,
			output: `
declare const text: string;

while (/search/.test(text)) {}
`,
			snapshot: `
declare const text: string;

while (/search/.exec(text)) {}
       ~~~~~~~~~~~~~~~~~~~
       Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
declare const text: string;

const found = !pattern.exec(text);
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

const found = !pattern.exec(text);
               ~~~~~~~~~~~~~~~~~~
               Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
declare const text: string;

const found = Boolean(pattern.exec(text));
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

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
declare const text: string;

const result = pattern.exec(text) ? "found" : "missing";
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

const result = pattern.exec(text) ? "found" : "missing";
               ~~~~~~~~~~~~~~~~~~
               Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
declare const text: string;
declare const other: boolean;

if (pattern.exec(text) && other) {}
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;
declare const other: boolean;

if (pattern.exec(text) && other) {}
    ~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
declare const text: string;

do {} while (pattern.exec(text));
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

do {} while (pattern.exec(text));
             ~~~~~~~~~~~~~~~~~~
             Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
		{
			code: `
declare const pattern: RegExp;
declare const text: string;

for (; pattern.exec(text);) {}
`,
			snapshot: `
declare const pattern: RegExp;
declare const text: string;

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
declare const text: string;

if (/search/g.exec(text)) {}
`,
			snapshot: `
declare const text: string;

if (/search/g.exec(text)) {}
    ~~~~~~~~~~~~~~~~~~~~
    Prefer the faster \`RegExp.test()\` for boolean checks instead of the slower \`RegExp.exec()\`.
`,
		},
	],
	valid: [
		`
declare const text: string;

const matches = text.match(/search/);
`,
		`
declare const pattern: RegExp;
declare const text: string;

const result = pattern.exec(text);
`,
		`
declare const pattern: RegExp;
declare const text: string;

pattern.test(text);
`,
		`
declare const text: { match(): unknown };

text.match();
`,
		`
declare const text: string;

text.match("search");
`,
		`
declare const pattern: RegExp;
declare const text: string;

if (pattern.test(text)) {}
`,
		`
declare const pattern: RegExp;
declare const text: string;

const group = pattern.exec(text)?.[1];
`,
		`
declare const hasMatch: { match(...args: unknown[]): unknown };
hasMatch.match(/test/);
`,
	],
});
