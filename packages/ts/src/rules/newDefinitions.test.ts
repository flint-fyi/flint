import rule from "./newDefinitions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface Container {
    new (): Container;
}
`,
			snapshot: `
interface Container {
    new (): Container;
    ~~~~~~~~~~~~~~~~~~
    An interface cannot be constructed directly; only classes can be instantiated.
}
`,
		},
		{
			code: `
interface Factory {
    new (value: string): Factory;
}
`,
			snapshot: `
interface Factory {
    new (value: string): Factory;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    An interface cannot be constructed directly; only classes can be instantiated.
}
`,
		},
		{
			code: `
interface Builder<T> {
    new (): Builder<T>;
}
`,
			snapshot: `
interface Builder<T> {
    new (): Builder<T>;
    ~~~~~~~~~~~~~~~~~~~
    An interface cannot be constructed directly; only classes can be instantiated.
}
`,
		},
		{
			code: `
export interface Service {
    new (): Service;
}
`,
			snapshot: `
export interface Service {
    new (): Service;
    ~~~~~~~~~~~~~~~~
    An interface cannot be constructed directly; only classes can be instantiated.
}
`,
		},
		{
			code: `
interface Handler {
    constructor(): void;
}
`,
			snapshot: `
interface Handler {
    constructor(): void;
    ~~~~~~~~~~~~~~~~~~~~
    Interfaces define \`new()\` signatures, not \`constructor\` methods.
}
`,
		},
		{
			code: `
interface Processor {
    constructor(value: number): void;
}
`,
			snapshot: `
interface Processor {
    constructor(value: number): void;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Interfaces define \`new()\` signatures, not \`constructor\` methods.
}
`,
		},
		{
			code: `
interface Manager {
    constructor(): Manager;
}
`,
			snapshot: `
interface Manager {
    constructor(): Manager;
    ~~~~~~~~~~~~~~~~~~~~~~~
    Interfaces define \`new()\` signatures, not \`constructor\` methods.
}
`,
		},
		{
			code: `
declare class Component {
    new (): Component;
}
`,
			snapshot: `
declare class Component {
    new (): Component;
    ~~~~~~~~~~~~~~~~~~
    A class method named \`new\` that returns the class type is misleading.
}
`,
		},
		{
			code: `
declare class Widget {
    new (config: object): Widget;
}
`,
			snapshot: `
declare class Widget {
    new (config: object): Widget;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    A class method named \`new\` that returns the class type is misleading.
}
`,
		},
		{
			code: `
declare abstract class Element {
    new (): Element;
}
`,
			snapshot: `
declare abstract class Element {
    new (): Element;
    ~~~~~~~~~~~~~~~~
    A class method named \`new\` that returns the class type is misleading.
}
`,
		},
		{
			code: `
const instance = class Named {
    new (): Named;
};
`,
			snapshot: `
const instance = class Named {
    new (): Named;
    ~~~~~~~~~~~~~~
    A class method named \`new\` that returns the class type is misleading.
};
`,
		},
	],
	valid: [
		`interface Factory { new (): object; }`,
		`interface Constructor { new (): unknown; }`,
		`interface Cloneable { clone(): Cloneable; }`,
		`interface Handler { handle(): void; }`,
		`interface Callable { (): void; }`,
		`
interface ConstructorFn {
    new (): DifferentType;
}
interface DifferentType {}
`,
		`
interface Wrapper<T> {
    new (): T;
}
`,
		`class Example { constructor() {} }`,
		`class Service { constructor(value: number) { console.log(value); } }`,
		`declare class Factory { create(): Factory; }`,
		`declare class Builder { build(): object; }`,
		`
class Container {
    new() {
        return new Container();
    }
}
`,
		`
declare class Utility {
    new(): object;
}
`,
		`
declare class Creator {
    new(): DifferentClass;
}
declare class DifferentClass {}
`,
		`const anonymous = class { constructor() {} };`,
		`const named = class MyClass { constructor() {} };`,
		`type Factory = { new (): object };`,
		`type Constructor = { new (): SomeOtherType };`,
		`interface Extended extends Base { new (): Base; }`,
		`
interface Nested {
    inner: {
        new (): object;
    };
}
`,
	],
});
