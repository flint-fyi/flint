import rule from "./extraneousClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Empty {}
`,
			snapshot: `
class Empty {}
      ~~~~~
      Unexpected empty class.
`,
		},
		{
			code: `
export class Empty {}
`,
			snapshot: `
export class Empty {}
             ~~~~~
             Unexpected empty class.
`,
		},
		{
			code: `
const Empty = class {};
`,
			snapshot: `
const Empty = class {};
              ~~~~~~~~
              Unexpected empty class.
`,
		},
		{
			code: `
const Named = class MyClass {};
`,
			snapshot: `
const Named = class MyClass {};
                    ~~~~~~~
                    Unexpected empty class.
`,
		},
		{
			code: `
class ConstructorOnly {
    constructor() {
        console.log("init");
    }
}
`,
			snapshot: `
class ConstructorOnly {
      ~~~~~~~~~~~~~~~
      Unexpected class with only a constructor.
    constructor() {
        console.log("init");
    }
}
`,
		},
		{
			code: `
class ConstructorWithParams {
    constructor(value: number) {
        console.log(value);
    }
}
`,
			snapshot: `
class ConstructorWithParams {
      ~~~~~~~~~~~~~~~~~~~~~
      Unexpected class with only a constructor.
    constructor(value: number) {
        console.log(value);
    }
}
`,
		},
		{
			code: `
const Example = class {
    constructor() {}
};
`,
			snapshot: `
const Example = class {
                ~~~~~~~
                Unexpected class with only a constructor.
    constructor() {}
    ~~~~~~~~~~~~~~~~
};
~
`,
		},
		{
			code: `
class StaticOnly {
    static value = 42;
}
`,
			snapshot: `
class StaticOnly {
      ~~~~~~~~~~
      Unexpected class with only static properties.
    static value = 42;
}
`,
		},
		{
			code: `
class StaticMethods {
    static getValue() {
        return 42;
    }
    static setValue(value: number) {}
}
`,
			snapshot: `
class StaticMethods {
      ~~~~~~~~~~~~~
      Unexpected class with only static properties.
    static getValue() {
        return 42;
    }
    static setValue(value: number) {}
}
`,
		},
		{
			code: `
class StaticAccessors {
    static get value() {
        return 42;
    }
    static set value(value: number) {}
}
`,
			snapshot: `
class StaticAccessors {
      ~~~~~~~~~~~~~~~
      Unexpected class with only static properties.
    static get value() {
        return 42;
    }
    static set value(value: number) {}
}
`,
		},
		{
			code: `
class StaticAndConstructor {
    static value = 42;
    constructor() {}
}
`,
			snapshot: `
class StaticAndConstructor {
      ~~~~~~~~~~~~~~~~~~~~
      Unexpected class with only static properties.
    static value = 42;
    constructor() {}
}
`,
		},
		{
			code: `
class StaticBlock {
    static {
        console.log("init");
    }
}
`,
			snapshot: `
class StaticBlock {
      ~~~~~~~~~~~
      Unexpected empty class.
    static {
        console.log("init");
    }
}
`,
		},
		{
			code: `
class StaticPrivate {
    static #value = 42;
    static #method() {}
}
`,
			snapshot: `
class StaticPrivate {
      ~~~~~~~~~~~~~
      Unexpected class with only static properties.
    static #value = 42;
    static #method() {}
}
`,
		},
		{
			code: `
export class Utility {
    static readonly VERSION = "1.0.0";
    static format(value: string) {
        return value.trim();
    }
}
`,
			snapshot: `
export class Utility {
             ~~~~~~~
             Unexpected class with only static properties.
    static readonly VERSION = "1.0.0";
    static format(value: string) {
        return value.trim();
    }
}
`,
		},
		{
			code: `
class Empty {}
`,
			options: { allowConstructorOnly: true },
			snapshot: `
class Empty {}
      ~~~~~
      Unexpected empty class.
`,
		},
		{
			code: `
class Empty {}
`,
			options: { allowStaticOnly: true },
			snapshot: `
class Empty {}
      ~~~~~
      Unexpected empty class.
`,
		},
		{
			code: `
class Empty {}
`,
			options: { allowWithDecorator: true },
			snapshot: `
class Empty {}
      ~~~~~
      Unexpected empty class.
`,
		},
		{
			code: `
class ConstructorOnly {
    constructor() {}
}
`,
			options: { allowEmpty: true },
			snapshot: `
class ConstructorOnly {
      ~~~~~~~~~~~~~~~
      Unexpected class with only a constructor.
    constructor() {}
}
`,
		},
		{
			code: `
class ConstructorOnly {
    constructor() {}
}
`,
			options: { allowStaticOnly: true },
			snapshot: `
class ConstructorOnly {
      ~~~~~~~~~~~~~~~
      Unexpected class with only a constructor.
    constructor() {}
}
`,
		},
		{
			code: `
class StaticOnly {
    static value = 42;
}
`,
			options: { allowEmpty: true },
			snapshot: `
class StaticOnly {
      ~~~~~~~~~~
      Unexpected class with only static properties.
    static value = 42;
}
`,
		},
		{
			code: `
class StaticOnly {
    static value = 42;
}
`,
			options: { allowConstructorOnly: true },
			snapshot: `
class StaticOnly {
      ~~~~~~~~~~
      Unexpected class with only static properties.
    static value = 42;
}
`,
		},
		{
			code: `
@decorator
class Empty {}
`,
			snapshot: `
@decorator
class Empty {}
      ~~~~~
      Unexpected empty class.
`,
		},
		{
			code: `
@decorator
class ConstructorOnly {
    constructor() {}
}
`,
			snapshot: `
@decorator
class ConstructorOnly {
      ~~~~~~~~~~~~~~~
      Unexpected class with only a constructor.
    constructor() {}
}
`,
		},
		{
			code: `
@decorator
class StaticOnly {
    static value = 42;
}
`,
			snapshot: `
@decorator
class StaticOnly {
      ~~~~~~~~~~
      Unexpected class with only static properties.
    static value = 42;
}
`,
		},
		{
			code: `
class WithSemicolon {
    ;
}
`,
			snapshot: `
class WithSemicolon {
      ~~~~~~~~~~~~~
      Unexpected empty class.
    ;
}
`,
		},
	],
	valid: [
		`class Example { value = 42; }`,
		`class Example { method() {} }`,
		`class Example { get value() { return 42; } }`,
		`class Example { set value(value: number) {} }`,
		`class Example { #privateValue = 42; }`,
		`class Example { #privateMethod() {} }`,
		`class Example { accessor prop = 42; }`,
		`class Example { static value = 42; method() {} }`,
		`class Example { static method() {} value = 42; }`,
		`class Example { constructor() {} value = 42; }`,
		`class Example { constructor(public value: number) {} }`,
		`class Example { constructor(private value: number) {} }`,
		`class Example { constructor(protected value: number) {} }`,
		`class Example { constructor(readonly value: number) {} }`,
		`class Example { constructor(public readonly value: number) {} }`,
		`class Example { constructor(private readonly value: number) {} }`,
		`class Example { constructor(protected readonly value: number) {} }`,
		`abstract class Example { abstract value: number; }`,
		`abstract class Example { abstract method(): void; }`,
		`abstract class Example { abstract get value(): number; }`,
		`abstract class Example { abstract set value(value: number); }`,
		`abstract class Example { abstract accessor prop: number; }`,
		`class Derived extends Base {}`,
		`class Derived extends Base { static value = 42; }`,
		`class Derived extends Base { constructor() { super(); } }`,

		{
			code: `class Empty {}`,
			options: { allowEmpty: true },
		},
		{
			code: `const Empty = class {};`,
			options: { allowEmpty: true },
		},
		{
			code: `class ConstructorOnly { constructor() {} }`,
			options: { allowConstructorOnly: true },
		},
		{
			code: `class ConstructorWithParams { constructor(value: number) { console.log(value); } }`,
			options: { allowConstructorOnly: true },
		},
		{
			code: `const Example = class { constructor() {} };`,
			options: { allowConstructorOnly: true },
		},
		{
			code: `class StaticOnly { static value = 42; }`,
			options: { allowStaticOnly: true },
		},
		{
			code: `class StaticMethods { static getValue() { return 42; } }`,
			options: { allowStaticOnly: true },
		},
		{
			code: `class StaticAndConstructor { static value = 42; constructor() {} }`,
			options: { allowStaticOnly: true },
		},
		{
			code: `@decorator class Empty {}`,
			options: { allowWithDecorator: true },
		},
		{
			code: `@decorator class ConstructorOnly { constructor() {} }`,
			options: { allowWithDecorator: true },
		},
		{
			code: `@decorator class StaticOnly { static value = 42; }`,
			options: { allowWithDecorator: true },
		},
		{
			code: `@dec1 @dec2 class MultiDecorator {}`,
			options: { allowWithDecorator: true },
		},
	],
});
