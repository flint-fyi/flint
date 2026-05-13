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
      This empty class does nothing and can be removed.
`,
		},
		{
			code: `
export class Empty {}
`,
			snapshot: `
export class Empty {}
             ~~~~~
             This empty class does nothing and can be removed.
`,
		},
		{
			code: `
const Empty = class {};
`,
			snapshot: `
const Empty = class {};
              ~~~~~~~~
              This empty class does nothing and can be removed.
`,
		},
		{
			code: `
const Named = class MyClass {};
`,
			snapshot: `
const Named = class MyClass {};
                    ~~~~~~~
                    This empty class does nothing and can be removed.
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
      This class contains only a constructor and can be removed or replaced with a standalone function.
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
      This class contains only a constructor and can be removed or replaced with a standalone function.
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
                This class contains only a constructor and can be removed or replaced with a standalone function.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This empty class does nothing and can be removed.
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
      This class contains only static properties and can be removed or replaced with variables.
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
             This class contains only static properties and can be removed or replaced with variables.
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
      This empty class does nothing and can be removed.
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
      This empty class does nothing and can be removed.
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
      This empty class does nothing and can be removed.
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
      This class contains only a constructor and can be removed or replaced with a standalone function.
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
      This class contains only a constructor and can be removed or replaced with a standalone function.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This empty class does nothing and can be removed.
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
      This class contains only a constructor and can be removed or replaced with a standalone function.
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
      This class contains only static properties and can be removed or replaced with variables.
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
      This empty class does nothing and can be removed.
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
