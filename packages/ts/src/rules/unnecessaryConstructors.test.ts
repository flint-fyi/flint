import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryConstructors.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Empty {
    constructor() {}
}
`,
			snapshot: `
class Empty {
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Empty {
    
}
`,
				},
			],
		},
		{
			code: `
const Empty = class {
    value = 1
    constructor() {}
    method() {}
};
`,
			snapshot: `
const Empty = class {
    value = 1
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
    method() {}
};
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
const Empty = class {
    value = 1
    
    method() {}
};
`,
				},
			],
		},
		{
			code: `
abstract class Empty {
    static {}
    constructor() {}
}
`,
			snapshot: `
abstract class Empty {
    static {}
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
abstract class Empty {
    static {}
    
}
`,
				},
			],
		},
		{
			code: `
class Computed {
    field = 1
    constructor() {}
    ["method"]() {}
}
`,
			snapshot: `
class Computed {
    field = 1
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
    ["method"]() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Computed {
    field = 1
    ;
    ["method"]() {}
}
`,
				},
			],
		},
		{
			code: `
class Generator {
    field = 1
    constructor() {}
    *method() {}
}
`,
			snapshot: `
class Generator {
    field = 1
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
    *method() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Generator {
    field = 1
    ;
    *method() {}
}
`,
				},
			],
		},
		{
			code: `
class InMethod {
    field = 1
    constructor() {}
    in() {}
}
`,
			snapshot: `
class InMethod {
    field = 1
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
    in() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class InMethod {
    field = 1
    ;
    in() {}
}
`,
				},
			],
		},
		{
			code: `
class InstanceOfMethod {
    field = 1
    constructor() {}
    instanceof() {}
}
`,
			snapshot: `
class InstanceOfMethod {
    field = 1
    constructor() {}
    ~~~~~~~~~~~
    This constructor can be removed without changing class behavior.
    instanceof() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class InstanceOfMethod {
    field = 1
    ;
    instanceof() {}
}
`,
				},
			],
		},
	],
	valid: [
		"class Values { constructor(value: string) {} }",
		"class Values { private constructor() {} }",
		"class Values { constructor() { useValue(); } }",
		' class Values { constructor() { "use strict"; } }',
		"declare class Values { constructor(); }",
		"declare namespace API { class Values { constructor() {} } }",
		"class Values { constructor(); constructor() {} }",
		"class Values { constructor(); constructor(value?: string) {} }",
		"@sealed class Values { constructor() {} }",
		"class Values { @logged method() {}; constructor() {} }",
		"class Values { method(@logged value: string) {}; constructor() {} }",
		"class Values { /** docs */ constructor() {} }",
		"class Values { constructor() {} // trailing\n}",
		"class Values { constructor(/* preserve */) {} }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { super(...values); } }",
		"class Parent { constructor(...values: string[]) {} } class Child<Value> extends Parent { constructor(...values: string[]) { super(...values); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor() { super(); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(value: string) { super(value); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { super(...arguments); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: number[]) { super(...values); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { log(); super(...values); } }",
		"class Parent { constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { values; } }",
		"class Parent { constructor(value: string) {} } class Child extends Parent { constructor(...values: [string]) { super(...values); } }",
		"class Parent { constructor(value: string); constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { super(...values); } }",
		"class Parent { protected constructor(...values: string[]) {} } class Child extends Parent { constructor(...values: string[]) { super(...values); } }",
		"interface ParentConstructor { new (...values: string[]): object } declare const Parent: ParentConstructor; class Child extends Parent { constructor(...values: string[]) { super(...values); } }",
		"declare const Parent: { new (...values: string[]): object } & { new (...values: number[]): object }; class Child extends Parent { constructor(...values: string[]) { super(...values); } }",
	],
});
