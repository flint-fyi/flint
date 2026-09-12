import rule from "./multilineAmbiguities.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function identifier(value: { doSomething(): void }) {
    return value;
}
const expression = { doSomething() {} };
const value = identifier
(expression).doSomething()
`,
			snapshot: `
function identifier(value: { doSomething(): void }) {
    return value;
}
const expression = { doSomething() {} };
const value = identifier
(expression).doSomething()
~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const identifier = [[1]];
const element = 0;
const callback = (value: number) => value;
const value = identifier
[element].forEach(callback)
`,
			snapshot: `
const identifier = [[1]];
const element = 0;
const callback = (value: number) => value;
const value = identifier
[element].forEach(callback)
~~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
		{
			code: `
function identifier(strings: TemplateStringsArray) {
    return strings[0];
}
const value = identifier
\`template literal\`
`,
			snapshot: `
function identifier(strings: TemplateStringsArray) {
    return strings[0];
}
const value = identifier
\`template literal\`
~~~~~~~~~~~~~~~~~~
This ambiguous line break before a template literal will be misinterpreted as a tagged template.
`,
		},
		{
			code: `
function b(value: { doSomething(): void }) {
    return value;
}
const c = { doSomething() {} };
const d = c;
const a = b
(c || d).doSomething()
`,
			snapshot: `
function b(value: { doSomething(): void }) {
    return value;
}
const c = { doSomething() {} };
const d = c;
const a = b
(c || d).doSomething()
~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const f = [[1]];
const g = 0;
const e = f
[g].forEach(x => x)
`,
			snapshot: `
const f = [[1]];
const g = 0;
const e = f
[g].forEach(x => x)
~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
		{
			code: `
function i(strings: TemplateStringsArray) {
    return strings[0];
}
const h = i
\`template\`
`,
			snapshot: `
function i(strings: TemplateStringsArray) {
    return strings[0];
}
const h = i
\`template\`
~~~~~~~~~~
This ambiguous line break before a template literal will be misinterpreted as a tagged template.
`,
		},
		{
			code: `
function test() {
    const value = 1;
    const calculate = () => (next: number) => next;
    const result = calculate()
    (value + 1).toString()
}
`,
			snapshot: `
function test() {
    const value = 1;
    const calculate = () => (next: number) => next;
    const result = calculate()
    (value + 1).toString()
    ~~~~~~~~~~~~~~~~~~~~~~
    This ambiguous line break before parentheses will be misinterpreted as a function call.
}
`,
		},
		{
			code: `
class MyClass {
    method() {
        const getData = () => [{ value: 1 }];
        const data = getData()
        [0].value
    }
}
`,
			snapshot: `
class MyClass {
    method() {
        const getData = () => [{ value: 1 }];
        const data = getData()
        [0].value
        ~~~~~~~~~
        This ambiguous line break before brackets will be misinterpreted as a property access.
    }
}
`,
		},
		{
			code: `
function identifier(value: { doSomething(): void }) {
    return value;
}
const expression = { doSomething() {} };
const value = identifier /* comment with ( */
(expression).doSomething()
`,
			snapshot: `
function identifier(value: { doSomething(): void }) {
    return value;
}
const expression = { doSomething() {} };
const value = identifier /* comment with ( */
(expression).doSomething()
~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const identifier = [[1]];
const element = 0;
const callback = (value: number) => value;
const value = identifier // comment with [
[element].forEach(callback)
`,
			snapshot: `
const identifier = [[1]];
const element = 0;
const callback = (value: number) => value;
const value = identifier // comment with [
[element].forEach(callback)
~~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
		{
			code: `
declare function makeHandler<T extends (input: number) => void>(callback: T): T;
const handler = makeHandler<(input: number) => void>
((input: number) => {})
`,
			snapshot: `
declare function makeHandler<T extends (input: number) => void>(callback: T): T;
const handler = makeHandler<(input: number) => void>
((input: number) => {})
~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
declare function check<T>(value: boolean): T;
const result = check<number>
(1 > 0)
`,
			snapshot: `
declare function check<T>(value: boolean): T;
const result = check<number>
(1 > 0)
~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
	],
	valid: [
		`
function identifier(value: { doSomething(): void }) {
    return value;
}
const expression = { doSomething() {} };
const value = identifier(expression).doSomething()
`,
		`
const identifier = [[1]];
const element = 0;
const callback = (value: number) => value;
const value = identifier[element].forEach(callback)
`,
		`
function identifier(strings: TemplateStringsArray) {
    return strings[0];
}
const value = identifier\`template literal\`
`,
		`
const identifier = 0;
const expression = { doSomething() {} };
const value = identifier;
(expression).doSomething()
`,
		`
const identifier = 0;
const element = 1;
const callback = (value: number) => value;
const value = identifier;
[element].forEach(callback)
`,
		`
const identifier = 0;
const value = identifier;
\`template literal\`
`,
		`
const b = 1;
const c = { doSomething() {} };
const d = c;
const a = b;
(c || d).doSomething()
`,
		`
const f = 1;
const g = 1;
const e = f;
[g].forEach(x => x)
`,
		`
const i = 1;
const h = i;
\`template\`
`,
		`
function test() {
    const value = 1;
    const calculate = () => 1;
    const result = calculate();
    (value + 1).toString()
}
`,
		`
class MyClass {
    method() {
        const getData = () => [{ value: 1 }];
        const data = getData();
        [{ value: 0 }][0].value
    }
}
`,
		`
const call = () => 1;
const value = call(); const other = value
`,
		`
const getData = () => [1, 2, 3];
const value = getData();
const element = [1, 2, 3];
`,
		`
const callee = (value: number) => value;
const a = true;
const b = 1;
const c = 2;
callee(
  a
    ? b
    : c
);
`,
		`
const identifier = (value: string) => value;
const value = identifier/* ( */("arg")
`,
		`
const identifier = [1];
const value = identifier/* [ */[0]
`,
		`
function identifier(strings: TemplateStringsArray) {
    return strings[0];
}
const value = identifier/* \` */\`template\`
`,
		`
type TypeA = { a: string };
type TypeB = { b: string };
function createLanguage<T, U>(value: { name: string }) {
    return value;
}
const value = createLanguage<
    TypeA,
    TypeB
>({
    name: "test"
})
`,
	],
});
