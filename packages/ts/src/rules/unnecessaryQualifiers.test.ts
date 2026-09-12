import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryQualifiers.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
namespace Store { export interface Item {} let item: Store.Item; }
`,
			output: `
namespace Store { export interface Item {} let item: Item; }
`,
			snapshot: `
namespace Store { export interface Item {} let item: Store.Item; }
                                                     ~~~~~
                                                     This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace Store { export const value = 1; Store . value; }
`,
			output: `
namespace Store { export const value = 1; value; }
`,
			snapshot: `
namespace Store { export const value = 1; Store . value; }
                                          ~~~~~
                                          This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace Outer { export const value = 1; export namespace Inner { Outer.value; } }
`,
			output: `
namespace Outer { export const value = 1; export namespace Inner { value; } }
`,
			snapshot: `
namespace Outer { export const value = 1; export namespace Inner { Outer.value; } }
                                                                   ~~~~~
                                                                   This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace A.B.C { export type Item = string; let item: A.B.C.Item; }
`,
			output: `
namespace A.B.C { export type Item = string; let item: Item; }
`,
			snapshot: `
namespace A.B.C { export type Item = string; let item: A.B.C.Item; }
                                                       ~~~~~
                                                       This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace Outer { export type Item = string; export namespace A.B {} let item: Outer.Item; }
`,
			output: `
namespace Outer { export type Item = string; export namespace A.B {} let item: Item; }
`,
			snapshot: `
namespace Outer { export type Item = string; export namespace A.B {} let item: Outer.Item; }
                                                                               ~~~~~
                                                                               This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
enum State { Ready, Current = State.Ready }
`,
			output: `
enum State { Ready, Current = Ready }
`,
			snapshot: `
enum State { Ready, Current = State.Ready }
                              ~~~~~
                              This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace Feature { export enum State { Ready, Current = Feature.State.Ready } }
`,
			output: `
namespace Feature { export enum State { Ready, Current = Ready } }
`,
			snapshot: `
namespace Feature { export enum State { Ready, Current = Feature.State.Ready } }
                                                         ~~~~~~~~~~~~~
                                                         This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace A { export namespace C { export const value = 1; } A.C.value; }
`,
			output: `
namespace A { export namespace C { export const value = 1; } C.value; }
`,
			snapshot: `
namespace A { export namespace C { export const value = 1; } A.C.value; }
                                                             ~
                                                             This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
namespace Store { export const value = 1; Store./* retain */value; }
`,
			snapshot: `
namespace Store { export const value = 1; Store./* retain */value; }
                                          ~~~~~
                                          This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
		{
			code: `
import * as feature from "./feature";
declare module "./feature" { feature.value; }
`,
			files: {
				"feature.ts": `export const value = 1;`,
			},
			output: `
import * as feature from "./feature";
declare module "./feature" { value; }
`,
			snapshot: `
import * as feature from "./feature";
declare module "./feature" { feature.value; }
                             ~~~~~~~
                             This qualifier is unnecessary because the unqualified name is already in scope and resolves to the same namespace or enum member.
`,
		},
	],
	valid: [
		`namespace A { export const value = 1; } A.value;`,
		`namespace A { export const value = 1; namespace B { const value = 2; A.value; } }`,
		`namespace A { export type Item = string; namespace B { type Item = number; let item: A.Item; } }`,
		`namespace A { export const value = 1; } namespace B { A.value; }`,
		`enum First { Ready } enum Second { Current = First.Ready }`,
		`namespace A { Missing.value; }`,
		`namespace A { export const value = 1; A.missing; }`,
		`namespace A { export const value = 1; A["value"]; }`,
		`namespace A { export const value = 1; A?.value; }`,
		`namespace A { export const value = 1; getNamespace().value; }`,
		`namespace A { export const value = 1; (A as typeof A).value; }`,
		`class Store { static value = 1; static current = Store.value; }`,
		`class Store { static #value = 1; static current = Store.#value; }`,
		`enum State { Ready } namespace State { export const current = State.Ready; }`,
		`namespace State { export enum State { Ready } } namespace State { export const current = State.Ready; }`,
		`namespace A.B {}`,
		{
			code: `import * as feature from "./feature"; import { value } from "./feature"; feature.value;`,
			files: { "feature.ts": `export const value = 1;` },
		},
	],
});
