import rule from "./classMemberDuplicates.ts";
import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
class Foo {
    bar() {}
    bar() {}
}
`,
			},
			snapshot: {
				"file.js": `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar() {}
}
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
	valid: [
		`class Foo {} void Foo;`,
		`class Foo { bar() {} } void Foo;`,
		`class Foo { bar() {} baz() {} } void Foo;`,
		`class Foo { bar = 1; baz = 2; } void Foo;`,
		`class Foo { get bar() { return 1; } set bar(value: number) { void value; } } void Foo;`,
		`class Foo { set bar(value: number) { void value; } get bar() { return 1; } } void Foo;`,
		`class Foo { bar() {} static bar() {} } void Foo;`,
		`class Foo { static bar() {} bar() {} } void Foo;`,
		`class Foo { bar = 1; static bar = 2; } void Foo;`,
		`class Foo { #bar() {} bar() { this.#bar(); } } void Foo;`,
		`class Foo { bar() { this.#bar(); } #bar() {} } void Foo;`,
		`class Foo { "bar"() {} baz() {} } void Foo;`,
		`class Foo { 123() {} 456() {} } void Foo;`,
		`
declare const computed: string;
class Foo { [computed]() {} [computed]() {} }
void Foo;
`,
		`const Foo = class { bar() {} baz() {} }; void Foo;`,
		`class Foo { static get bar() { return 1; } static set bar(value: number) { void value; } } void Foo;`,
	],
});
