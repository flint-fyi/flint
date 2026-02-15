import rule from "./returnThisTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Foo {
    f(): Foo {
        return this;
    }
}
`,
			output: `
class Foo {
    f(): this {
        return this;
    }
}
`,
			snapshot: `
class Foo {
    f(): Foo {
         ~~~
         Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Foo {
    f = function (): Foo {
        return this;
    };
}
`,
			output: `
class Foo {
    f = function (): this {
        return this;
    };
}
`,
			snapshot: `
class Foo {
    f = function (): Foo {
                     ~~~
                     Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    };
}
`,
		},
		{
			code: `
class Foo {
    f(): Foo {
        const self = this;
        return self;
    }
}
`,
			output: `
class Foo {
    f(): this {
        const self = this;
        return self;
    }
}
`,
			snapshot: `
class Foo {
    f(): Foo {
         ~~~
         Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        const self = this;
        return self;
    }
}
`,
		},
		{
			code: `
class Foo {
    f = (): Foo => {
        return this;
    };
}
`,
			output: `
class Foo {
    f = (): this => {
        return this;
    };
}
`,
			snapshot: `
class Foo {
    f = (): Foo => {
            ~~~
            Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    };
}
`,
		},
		{
			code: `
class Foo {
    f = (): Foo => {
        const self = this;
        return self;
    };
}
`,
			output: `
class Foo {
    f = (): this => {
        const self = this;
        return self;
    };
}
`,
			snapshot: `
class Foo {
    f = (): Foo => {
            ~~~
            Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        const self = this;
        return self;
    };
}
`,
		},
		{
			code: `
class Foo {
    f = (): Foo => this;
}
`,
			output: `
class Foo {
    f = (): this => this;
}
`,
			snapshot: `
class Foo {
    f = (): Foo => this;
            ~~~
            Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
}
`,
		},
		{
			code: `
class Foo {
    accessor f = (): Foo => {
        return this;
    };
}
`,
			output: `
class Foo {
    accessor f = (): this => {
        return this;
    };
}
`,
			snapshot: `
class Foo {
    accessor f = (): Foo => {
                     ~~~
                     Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    };
}
`,
		},
		{
			code: `
class Foo {
    accessor f = (): Foo => this;
}
`,
			output: `
class Foo {
    accessor f = (): this => this;
}
`,
			snapshot: `
class Foo {
    accessor f = (): Foo => this;
                     ~~~
                     Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
}
`,
		},
		{
			code: `
class Foo {
    f1(): Foo | undefined {
        return this;
    }
    f2(): this | undefined {
        return this;
    }
}
`,
			output: `
class Foo {
    f1(): this | undefined {
        return this;
    }
    f2(): this | undefined {
        return this;
    }
}
`,
			snapshot: `
class Foo {
    f1(): Foo | undefined {
          ~~~
          Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
    f2(): this | undefined {
        return this;
    }
}
`,
		},
		{
			code: `
class Foo {
    bar(): Foo | undefined {
        if (Math.random() > 0.5) {
            return this;
        }
    }
}
`,
			output: `
class Foo {
    bar(): this | undefined {
        if (Math.random() > 0.5) {
            return this;
        }
    }
}
`,
			snapshot: `
class Foo {
    bar(): Foo | undefined {
           ~~~
           Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        if (Math.random() > 0.5) {
            return this;
        }
    }
}
`,
		},
		{
			code: `
class Foo {
    bar(num: 1 | 2): Foo {
        switch (num) {
            case 1:
                return this;
            case 2:
                return this;
        }
    }
}
`,
			output: `
class Foo {
    bar(num: 1 | 2): this {
        switch (num) {
            case 1:
                return this;
            case 2:
                return this;
        }
    }
}
`,
			snapshot: `
class Foo {
    bar(num: 1 | 2): Foo {
                     ~~~
                     Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        switch (num) {
            case 1:
                return this;
            case 2:
                return this;
        }
    }
}
`,
		},
		{
			code: `
class Animal<T> {
    eat(): Animal<T> {
        console.log("I'm moving!");
        return this;
    }
}
`,
			output: `
class Animal<T> {
    eat(): this {
        console.log("I'm moving!");
        return this;
    }
}
`,
			snapshot: `
class Animal<T> {
    eat(): Animal<T> {
           ~~~~~~~~~
           Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        console.log("I'm moving!");
        return this;
    }
}
`,
		},
		{
			code: `
declare const valueUnion: number | string;

class BaseUnion {
    f(): BaseUnion | string {
        if (Math.random()) {
            return this;
        }

        return valueUnion;
    }
}
`,
			output: `
declare const valueUnion: number | string;

class BaseUnion {
    f(): this | string {
        if (Math.random()) {
            return this;
        }

        return valueUnion;
    }
}
`,
			snapshot: `
declare const valueUnion: number | string;

class BaseUnion {
    f(): BaseUnion | string {
         ~~~~~~~~~
         Prefer \`this\` as the return type instead of the class name for polymorphic chaining.
        if (Math.random()) {
            return this;
        }

        return valueUnion;
    }
}
`,
		},
	],
	valid: [
		`
class Foo {
    f1() {}
    f2(): Foo {
        return new Foo();
    }
    f3() {
        return this;
    }
    f4(): this {
        return this;
    }
    f5(): any {
        return this;
    }
    f6(): unknown {
        return this;
    }
    f7(foo: Foo): Foo {
        return Math.random() > 0.5 ? foo : this;
    }
    f10(this: Foo, that: Foo): Foo;
    f11(): Foo {
        return;
    }
    f13(this: Foo): Foo {
        return this;
    }
    f14(): { f14: Function } {
        return this;
    }
    f15(): Foo | this {
        return Math.random() > 0.5 ? new Foo() : this;
    }
}
`,
		`
class Foo {
    f1 = () => {};
    f2 = (): Foo => {
        return new Foo();
    };
    f3 = () => this;
    f4 = (): this => {
        return this;
    };
    f5 = (): Foo => new Foo();
    f6 = '';
}
`,
		`
const Foo = class {
    bar() {
        return this;
    }
};
`,
		`
class Base {}
class Derived extends Base {
    f(): Base {
        return this;
    }
}
`,
		`
class Foo {
    accessor f = () => {
        return this;
    };
}
`,
		`
class Foo {
    accessor f = (): this => {
        return this;
    };
}
`,
		`
class Foo {
    f?: string;
}
`,
		`
declare const valueUnion: BaseUnion | string;

class BaseUnion {
    f(): BaseUnion | string {
        if (Math.random()) {
            return this;
        }

        return valueUnion;
    }
}
`,
	],
});
