import rule from "./classMemberDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Foo {
    bar() {}
    bar() {}
}
`,
			snapshot: `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar() {}
}
`,
		},
		{
			code: `
class Foo {
    bar;
    bar;
}
`,
			snapshot: `
class Foo {
    bar;
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar;
}
`,
		},
		{
			code: `
class Foo {
    bar = 1;
    bar = 2;
}
`,
			snapshot: `
class Foo {
    bar = 1;
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar = 2;
}
`,
		},
		{
			code: `
class Foo {
    "bar"() {}
    "bar"() {}
}
`,
			snapshot: `
class Foo {
    "bar"() {}
    ~~~~~
    Duplicate class member name 'bar' will be overwritten.
    "bar"() {}
}
`,
		},
		{
			code: `
class Foo {
    123() {}
    123() {}
}
`,
			snapshot: `
class Foo {
    123() {}
    ~~~
    Duplicate class member name '123' will be overwritten.
    123() {}
}
`,
		},
		{
			code: `
class Foo {
    #bar() {}
    #bar() {}
}
`,
			snapshot: `
class Foo {
    #bar() {}
    ~~~~
    Duplicate class member name '#bar' will be overwritten.
    #bar() {}
}
`,
		},
		{
			code: `
class Foo {
    get bar() { return 1; }
    get bar() { return 2; }
}
`,
			snapshot: `
class Foo {
    get bar() { return 1; }
        ~~~
        Duplicate class member name 'bar' will be overwritten.
    get bar() { return 2; }
}
`,
		},
		{
			code: `
class Foo {
    set bar(value) {}
    set bar(value) {}
}
`,
			snapshot: `
class Foo {
    set bar(value) {}
        ~~~
        Duplicate class member name 'bar' will be overwritten.
    set bar(value) {}
}
`,
		},
		{
			code: `
class Foo {
    bar() {}
    get bar() { return 1; }
}
`,
			snapshot: `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    get bar() { return 1; }
}
`,
		},
		{
			code: `
class Foo {
    bar() {}
    set bar(value) {}
}
`,
			snapshot: `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    set bar(value) {}
}
`,
		},
		{
			code: `
class Foo {
    static bar() {}
    static bar() {}
}
`,
			snapshot: `
class Foo {
    static bar() {}
           ~~~
           Duplicate class member name 'bar' will be overwritten.
    static bar() {}
}
`,
		},
		{
			code: `
class Foo {
    static bar;
    static bar;
}
`,
			snapshot: `
class Foo {
    static bar;
           ~~~
           Duplicate class member name 'bar' will be overwritten.
    static bar;
}
`,
		},
		{
			code: `
class Foo {
    bar() {}
    bar() {}
    baz() {}
    baz() {}
}
`,
			snapshot: `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    ~~~
    Duplicate class member name 'baz' will be overwritten.
    bar() {}
    baz() {}
    baz() {}
}
`,
		},
		{
			code: `
const Foo = class {
    bar() {}
    bar() {}
};
`,
			snapshot: `
const Foo = class {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar() {}
};
`,
		},
		{
			code: `
class Foo {
    bar;
    bar() {}
}
`,
			snapshot: `
class Foo {
    bar;
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar() {}
}
`,
		},
		{
			code: `
class Foo {
    bar() {}
    bar;
}
`,
			snapshot: `
class Foo {
    bar() {}
    ~~~
    Duplicate class member name 'bar' will be overwritten.
    bar;
}
`,
		},
	],
	valid: [
		`class Foo {}`,
		`class Foo { bar() {} }`,
		`class Foo { bar() {} baz() {} }`,
		`class Foo { bar; baz; }`,
		`class Foo { get bar() { return 1; } set bar(value) {} }`,
		`class Foo { set bar(value) {} get bar() { return 1; } }`,
		`class Foo { bar() {} static bar() {} }`,
		`class Foo { static bar() {} bar() {} }`,
		`class Foo { bar; static bar; }`,
		`class Foo { #bar() {} bar() {} }`,
		`class Foo { bar() {} #bar() {} }`,
		`class Foo { "bar"() {} baz() {} }`,
		`class Foo { 123() {} 456() {} }`,
		`class Foo { [computed]() {} [computed]() {} }`,
		`const Foo = class { bar() {} baz() {} };`,
		`class Foo { static get bar() { return 1; } static set bar(value) {} }`,
	],
});
