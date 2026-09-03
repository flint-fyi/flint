import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { domLibRuleTester } from "./ruleTester.ts";
import rule from "./thisBeforeSuper.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
class Parent { value = 0; }
class Child extends Parent {
    constructor() {
        this.value = 0;
        super();
    }
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
class Parent { value = 0; }
class Child extends Parent {
    constructor() {
        this.value = 0;
        ~~~~
        \`this\` is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
	],
	valid: [
		`class A { } void A;`,
		`class A { constructor() { } } void A;`,
		`class A { b = 0; constructor() { this.b = 0; } } void A;`,
		`class A { b() {} constructor() { this.b(); } } void A;`,
		`class A extends null { } void A;`,
		`class A extends null { constructor() { } } void A;`,
		`class B {} class A extends B { } void A;`,
		`class B {} class A extends B { constructor() { super(); } } void A;`,
		`class B {} class A extends B { c = 0; d = 0; constructor() { super(); this.c = this.d; } } void A;`,
		`class B {} class A extends B { c() {} constructor() { super(); this.c(); } } void A;`,
		`class B { c() {} } class A extends B { constructor() { super(); super.c(); } } void A;`,
		`class B {} class D { d = 0; } class A extends B { constructor() { class C extends D { constructor() { super(); this.d = 0; } } void C; super(); } } void A;`,
		`class B {} class C { d = 0; } class A extends B { constructor() { var B = class extends C { constructor() { super(); this.d = 0; } }; void B; super(); } } void A;`,
		`class B {} class A extends B { constructor() { function c(this: { d(): void }) { this.d(); } void c; super(); } } void A;`,
		`class B {} class A extends B { constructor() { var c = function c(this: { d(): void }) { this.d(); }; void c; super(); } } void A;`,
		`class B {} class A extends B { d() {} constructor() { var c = () => this.d(); void c; super(); } } void A;`,
		`class A { c = 0; b() { this.c = 0; } } void A;`,
		`class B {} class A extends B { d = 0; c() { this.d = 0; } } void A;`,
		`class C { field = this.toString(); } void C;`,
		`class B {} class C extends B { field = this.foo(); foo() {} } void C;`,
		`class B {} class C extends B { field = this.foo(); foo() {} constructor() { super(); } } void C;`,
	],
});
