import rule from "./regexResultArrayGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match[1];
}
`,
			output: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match.groups.foo;
}
`,
			snapshot: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match[1];
                        ~~
                        Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
}
`,
		},
		{
			code: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.[1];
}
`,
			output: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.groups.foo;
}
`,
			snapshot: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.[1];
                          ~~
                          Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
}
`,
		},
		{
			code: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.[(1)];
}
`,
			output: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.groups.foo;
}
`,
			snapshot: `
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.[(1)];
                          ~~~~
                          Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
}
`,
		},
		{
			code: `
const regex = /(a)(?<bar>b)c/;
let match;
while (match = regex.exec(text)) {
    const first = match[1];
    const second = match[2];
}
`,
			output: `
const regex = /(a)(?<bar>b)c/;
let match;
while (match = regex.exec(text)) {
    const first = match[1];
    const second = match.groups.bar;
}
`,
			snapshot: `
const regex = /(a)(?<bar>b)c/;
let match;
while (match = regex.exec(text)) {
    const first = match[1];
    const second = match[2];
                         ~~
                         Use \`.groups.bar\` instead of numeric index for the named capturing group 'bar'.
}
`,
		},
		{
			code: `
const regex = /(?<first>a)(?<second>b)c/;
let match;
while (match = regex.exec(text)) {
    const [, first, second] = match;
}
`,
			snapshot: `
const regex = /(?<first>a)(?<second>b)c/;
let match;
while (match = regex.exec(text)) {
    const [, first, second] = match;
}
`,
		},
		{
			code: `
const result = "text".match(/a(?<foo>b)c/);
const value = result[1];
`,
			output: `
const result = "text".match(/a(?<foo>b)c/);
const value = result.groups.foo;
`,
			snapshot: `
const result = "text".match(/a(?<foo>b)c/);
const value = result[1];
                     ~~
                     Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
`,
		},
		{
			code: `
const match = /(?<foo>test)/u.exec(text)!;
match[1];
`,
			output: `
const match = /(?<foo>test)/u.exec(text)!;
match.groups.foo;
`,
			snapshot: `
const match = /(?<foo>test)/u.exec(text)!;
match[1];
      ~~
      Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
`,
		},
		{
			code: `
/(?<bar>test)/u.exec(text)?.[1];
`,
			output: `
/(?<bar>test)/u.exec(text)?.groups.bar;
`,
			snapshot: `
/(?<bar>test)/u.exec(text)?.[1];
                             ~~
                             Use \`.groups.bar\` instead of numeric index for the named capturing group 'bar'.
`,
		},
		{
			code: `
const match = /(?<baz>test)/u.exec(text);
match?.[1];
`,
			output: `
const match = /(?<baz>test)/u.exec(text);
match?.groups.baz;
`,
			snapshot: `
const match = /(?<baz>test)/u.exec(text);
match?.[1];
        ~~
        Use \`.groups.baz\` instead of numeric index for the named capturing group 'baz'.
`,
		},
		{
			code: `
const match = /(?<foo>test)/u.exec(text);
if (match) {
    match[1];
}
`,
			output: `
const match = /(?<foo>test)/u.exec(text);
if (match) {
    match.groups.foo;
}
`,
			snapshot: `
const match = /(?<foo>test)/u.exec(text);
if (match) {
    match[1];
          ~~
          Use \`.groups.foo\` instead of numeric index for the named capturing group 'foo'.
}
`,
		},
		{
			code: `
const match = /(?<bar>test)/u.exec(text);
match
    ? match[1]
    : null;
`,
			output: `
const match = /(?<bar>test)/u.exec(text);
match
    ? match.groups.bar
    : null;
`,
			snapshot: `
const match = /(?<bar>test)/u.exec(text);
match
    ? match[1]
            ~~
            Use \`.groups.bar\` instead of numeric index for the named capturing group 'bar'.
    : null;
`,
		},
		{
			code: `
const match = /(?<baz>test)/u.exec(text);
match && match[1];
`,
			output: `
const match = /(?<baz>test)/u.exec(text);
match && match.groups.baz;
`,
			snapshot: `
const match = /(?<baz>test)/u.exec(text);
match && match[1];
               ~~
               Use \`.groups.baz\` instead of numeric index for the named capturing group 'baz'.
`,
		},
		{
			code: `
const match = /(?<qux>test)/u.exec(text);
if (!match) {
} else {
    match[1];
}
`,
			output: `
const match = /(?<qux>test)/u.exec(text);
if (!match) {
} else {
    match.groups.qux;
}
`,
			snapshot: `
const match = /(?<qux>test)/u.exec(text);
if (!match) {
} else {
    match[1];
          ~~
          Use \`.groups.qux\` instead of numeric index for the named capturing group 'qux'.
}
`,
		},
	],
	valid: [
		`
const regex = /regexp/;
let match;
while (match = regex.exec(text)) {
    const value = match[0];
}
`,
		`
const regex = /a(b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match[1];
}
`,
		`
const regex = /a(b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match?.[1];
}
`,
		`
const regex = /a(b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match.unknown;
}
`,
		`
const regex = /a(?<foo>b)c/;
let match;
while (match = regex.exec(text)) {
    const value = match.unknown;
}
`,
		`
const regex = /reg[[exp]]/v;
let match;
while (match = regex.exec(text)) {
    const value = match[0];
}
`,
		`
const result = "text".match(/regexp/);
const value = result[1];
`,
		`
const result = "text".match(/a(b)c/);
const value = result[1];
`,
		`
const result = "text".match(/a(?<foo>b)c/);
const value = result.groups.foo;
`,
		`
const result = "text".match(/a(?<foo>b)c/);
const value = result.unknown;
`,
		`
const result = unknown.match(/a(?<foo>b)c/);
const value = result[1];
`,
		`
const result = "text".match(/a(?<foo>b)c/g);
const value = result[1];
`,
		`
const matches = "text".matchAll(/a(?<foo>b)c/g);
for (const match of matches) {
    const value = match.groups.foo;
}
`,
		`
const matches = "text".matchAll(/a(b)c/g);
for (const match of matches) {
    const value = match[1];
}
`,
		`
const matches = unknown.matchAll(/a(?<foo>b)c/g);
for (const match of matches) {
    const value = match.groups.foo;
}
`,
		`
const regex = /a(?<foo>b)c/;
let match: any;
while (match = regex.exec(text)) {
    const value = match[1];
}
`,
		`
const regex = /a(?<foo>b)c/;
let match: unknown[];
while (match = regex.exec(text) as any) {
    const value = match[1];
}
`,
	],
});
