import rule from "./restrictedIdentifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const data = 1;
`,
			options: { deny: ["data"] },
			snapshot: `
const data = 1;
      ~~~~
      Identifier 'data' is restricted.
`,
		},
		{
			code: `
function data() {}
`,
			options: { deny: ["data"] },
			snapshot: `
function data() {}
         ~~~~
         Identifier 'data' is restricted.
`,
		},
		{
			code: `
function fn(data: string) {}
`,
			options: { deny: ["data"] },
			snapshot: `
function fn(data: string) {}
            ~~~~
            Identifier 'data' is restricted.
`,
		},
		{
			code: `
function fn(callback: () => void, e: Error) {}
`,
			options: { deny: ["callback", "e"] },
			snapshot: `
function fn(callback: () => void, e: Error) {}
            ~~~~~~~~
            Identifier 'callback' is restricted.
                                  ~
                                  Identifier 'e' is restricted.
`,
		},
		{
			code: `
class data {}
`,
			options: { deny: ["data"] },
			snapshot: `
class data {}
      ~~~~
      Identifier 'data' is restricted.
`,
		},
		{
			code: `
import data from 'lib';
void data;
`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const data: number;
export default data;
`,
			},
			options: { deny: ["data"] },
			snapshot: `
import data from 'lib';
       ~~~~
       Identifier 'data' is restricted.
void data;
`,
		},
		{
			code: `
import { data } from 'lib';
void data;
`,
			files: {
				"lib.d.ts": `
declare module "lib" {
    export const data: number;
}
`,
			},
			options: { deny: ["data"] },
			snapshot: `
import { data } from 'lib';
         ~~~~
         Identifier 'data' is restricted.
void data;
`,
		},
		{
			code: `
import { foo as data } from 'lib';
void data;
`,
			files: {
				"lib.d.ts": `
declare module "lib" {
    export const foo: number;
}
`,
			},
			options: { deny: ["data"] },
			snapshot: `
import { foo as data } from 'lib';
                ~~~~
                Identifier 'data' is restricted.
void data;
`,
		},
		{
			code: `
import * as data from 'lib';
void data;
`,
			files: {
				"node_modules/lib/index.d.ts": `
export const value: number;
`,
			},
			options: { deny: ["data"] },
			snapshot: `
import * as data from 'lib';
            ~~~~
            Identifier 'data' is restricted.
void data;
`,
		},
	],
	valid: [
		`
const value = 1;
`,
		`
function handleData() {}
`,
		`
function fn(value: string) {}
`,
		{
			code: `
import value from 'lib';
void value;
`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const value: number;
export default value;
`,
			},
		},
		`
const obj = { data: 0 };
obj.data = 1;
`,
		`
const obj = { data: 1 };
const { data } = obj;
void data;
`,
	],
});
