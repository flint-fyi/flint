import { ruleTester } from "./ruleTester.ts";
import rule from "./staticMemberOnlyClasses.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class MathUtils {
    static PI = 3.14159;
    static add(number1: number, number2: number) {
        return number1 + number2;
    }
}
`,
			snapshot: `
class MathUtils {
      ~~~~~~~~~
      This class only contains static members. Consider using module-level exports instead.
    static PI = 3.14159;
    static add(number1: number, number2: number) {
        return number1 + number2;
    }
}
`,
		},
		{
			code: `
class Config {
    static defaultValue = 42;
    constructor() {}
}
`,
			snapshot: `
class Config {
      ~~~~~~
      This class only contains static members. Consider using module-level exports instead.
    static defaultValue = 42;
    constructor() {}
}
`,
		},
		{
			code: `
class StaticMethods {
    static method1() {
        return 1;
    }
    static method2() {
        return 2;
    }
}
`,
			snapshot: `
class StaticMethods {
      ~~~~~~~~~~~~~
      This class only contains static members. Consider using module-level exports instead.
    static method1() {
        return 1;
    }
    static method2() {
        return 2;
    }
}
`,
		},
		{
			code: `
class StaticAccessors {
    static get value() {
        return 42;
    }
    static set value(newValue: number) {}
}
`,
			snapshot: `
class StaticAccessors {
      ~~~~~~~~~~~~~~~
      This class only contains static members. Consider using module-level exports instead.
    static get value() {
        return 42;
    }
    static set value(newValue: number) {}
}
`,
		},
		{
			code: `
const utility = class StaticOnly {
    static helper() {
        return "help";
    }
};
`,
			snapshot: `
const utility = class StaticOnly {
                      ~~~~~~~~~~
                      This class only contains static members. Consider using module-level exports instead.
    static helper() {
        return "help";
    }
};
`,
		},
		{
			code: `
const anonymous = class {
    static value = 1;
};
`,
			snapshot: `
const anonymous = class {
                  ~~~~~~~
                  This class only contains static members. Consider using module-level exports instead.
    static value = 1;
    ~~~~~~~~~~~~~~~~~
};
~
`,
		},
		{
			code: `
class WithStaticBlock {
    static value = 1;
    static {
        console.log("initialized");
    }
}
`,
			snapshot: `
class WithStaticBlock {
      ~~~~~~~~~~~~~~~
      This class only contains static members. Consider using module-level exports instead.
    static value = 1;
    static {
        console.log("initialized");
    }
}
`,
		},
	],
	valid: [
		`
class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}
`,
		`
class Counter {
    static count = 0;
    value: number = 0;
}
`,
		`
class Child extends Parent {
    static method() {}
}
`,
		`
abstract class AbstractService {
    static factory() {}
}
`,
		`
class Singleton {
    private constructor() {}
    static instance = new Singleton();
}
`,
		`
@decorator
class DecoratedClass {
    static method() {}
}
`,
		`
class WithInstanceMethod {
    static staticMethod() {}
    instanceMethod() {}
}
`,
		`
class WithInstanceProperty {
    static staticProp = 1;
    instanceProp = 2;
}
`,
		`
class WithInstanceGetter {
    static staticValue = 1;
    get instanceValue() {
        return 2;
    }
}
`,
		`
class WithInstanceSetter {
    static staticValue = 1;
    set instanceValue(value: number) {}
}
`,
		`
class WithNonEmptyConstructor {
    static value = 1;
    constructor(value: number) {
        console.log(value);
    }
}
`,
		`
class Empty {}
`,
		`
class ImplementsInterface implements SomeInterface {
    value: number = 0;
}
`,
		`
class WithIndexSignature {
    static value = 1;
    [key: string]: unknown;
}
`,
	],
});
