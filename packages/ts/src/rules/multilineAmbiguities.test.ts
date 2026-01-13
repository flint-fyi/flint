import rule from "./multilineAmbiguities.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = identifier
(expression).doSomething()
`,
			snapshot: `
const value = identifier
(expression).doSomething()
~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const value = identifier
[element].forEach(callback)
`,
			snapshot: `
const value = identifier
[element].forEach(callback)
~~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
		{
			code: `
const value = identifier
\`template literal\`
`,
			snapshot: `
const value = identifier
\`template literal\`
~~~~~~~~~~~~~~~~~~
This ambiguous line break before a template literal will be misinterpreted as a tagged template.
`,
		},
		{
			code: `
const a = b
(c || d).doSomething()
`,
			snapshot: `
const a = b
(c || d).doSomething()
~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const e = f
[g].forEach(x => x)
`,
			snapshot: `
const e = f
[g].forEach(x => x)
~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
		{
			code: `
const h = i
\`template\`
`,
			snapshot: `
const h = i
\`template\`
~~~~~~~~~~
This ambiguous line break before a template literal will be misinterpreted as a tagged template.
`,
		},
		{
			code: `
function test() {
    const result = calculate()
    (value + 1).toString()
}
`,
			snapshot: `
function test() {
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
        const data = getData()
        [0].value
    }
}
`,
			snapshot: `
class MyClass {
    method() {
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
const value = identifier /* comment with ( */
(expression).doSomething()
`,
			snapshot: `
const value = identifier /* comment with ( */
(expression).doSomething()
~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before parentheses will be misinterpreted as a function call.
`,
		},
		{
			code: `
const value = identifier // comment with [
[element].forEach(callback)
`,
			snapshot: `
const value = identifier // comment with [
[element].forEach(callback)
~~~~~~~~~~~~~~~~~~~~~~~~~~~
This ambiguous line break before brackets will be misinterpreted as a property access.
`,
		},
	],
	valid: [
		`const value = identifier(expression).doSomething()`,
		`const value = identifier[element].forEach(callback)`,
		"const value = identifier`template literal`",
		`
const value = identifier;
(expression).doSomething()
`,
		`
const value = identifier;
[element].forEach(callback)
`,
		"const value = identifier;\n`template literal`",
		`
const a = b;
(c || d).doSomething()
`,
		`
const e = f;
[g].forEach(x => x)
`,
		"const h = i;\n`template`",
		`
function test() {
    const result = calculate();
    (value + 1).toString()
}
`,
		`
class MyClass {
    method() {
        const data = getData();
        [0].value
    }
}
`,
		`const value = call(); const other = value`,
		`
const value = getData();
const element = [1, 2, 3];
`,
		`
callee(
  a
    ? b
    : c
);
`,
		`const value = identifier/* ( */("arg")`,
		`const value = identifier/* [ */[0]`,
		"const value = identifier/* ` */`template`",
		`
const value = createLanguage<
    TypeA,
    TypeB
>({
    name: "test"
})
`,
	],
});
