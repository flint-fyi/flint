import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./constructorSupers.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
class Parent {}
class Child extends Parent {
    constructor() {
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
class Parent {}
class Child extends Parent {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
    }
}
`,
		},
		{
			code: `
class Example {
    constructor() {
        super();
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
class Example {
    constructor() {
        super();
        ~~~~~~~
        Constructors of non-derived classes must not call \`super()\`.
    }
}
`,
		},
		{
			code: `
class Parent {}
class Child extends Parent {
    public constructor() {
    }
}
`,
			files: createRuleTesterTSConfig({ noCheck: true }),
			snapshot: `
class Parent {}
class Child extends Parent {
    public constructor() {
           ~~~~~~~~~~~
           Constructors of derived classes must call \`super()\` before using \`this\` or returning.
    }
}
`,
		},
		{
			code: `
class Parent {}
class Child extends Parent {
    private constructor() {
    }
}
`,
			files: createRuleTesterTSConfig({ noCheck: true }),
			snapshot: `
class Parent {}
class Child extends Parent {
    private constructor() {
            ~~~~~~~~~~~
            Constructors of derived classes must call \`super()\` before using \`this\` or returning.
    }
}
`,
		},
	],
	valid: [
		{
			code: `class Parent {} class Child extends Parent { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent { value = 0; } class Child extends Parent { constructor(value: number) { super(); this.value = value; } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Example { value = 0; constructor() { this.value = 1; } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Example { value = 0; constructor(value: number) { this.value = value; } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Example { }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent {} class Child extends Parent { }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent {} class Child extends Parent { declare init: () => void; constructor() { super(); this.init(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent {} class Child extends Parent { method() { return 42; } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent {} class Example { method() { class Inner extends Parent { constructor() { super(); } } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Example { constructor() { const fn = function() { }; } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class C {} class A { constructor() { class B extends C { constructor() { super(); } } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class B {} class D {} class A extends B { constructor() { super(); class C extends D { constructor() { super(); } } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class B {} class A extends B { constructor() { super(); class C { constructor() { } } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `declare const a: boolean; class B {} class A extends B { constructor() { a ? super() : super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `declare const a: boolean; class B {} class A extends B { constructor() { if (a) super(); else super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `declare const a: number; class B {} class A extends B { constructor() { switch (a) { case 0: super(); break; default: super(); } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class B {} class A extends B { constructor() { try {} finally { super(); } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `declare const a: boolean; class B {} class A extends B { constructor() { if (a) throw Error(); super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class A extends (class B {}) { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `let B = class {}; const C = class {}; class A extends (B = C) { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `let B = class {}; const C = class {}; class A extends (B || C) { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `declare const a: boolean; const B = class {}; const C = class {}; class A extends (a ? B : C) { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `const B = class {}; const C = class {}; class A extends (void B, C) { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class A extends Object { constructor() { super(); for (let i = 0; i < 0; i++); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class B {} class A extends B { declare a: () => void; constructor(a: number[]) { super(); for (const b of a) { this.a(); } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class B {} declare function foo(value: string): void; let b = ""; class A extends B { constructor(a: object) { super(); for (b in a) { foo(b); } } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `const obj = { prop: class {} }; class A extends obj?.prop { constructor() { super(); } }`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		{
			code: `class Parent {} class Child extends Parent { "constructor"() {} }`,
			files: createRuleTesterTSConfig({ noCheck: true }),
		},
	],
});
