import rule from "./objectCalls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = new Object();
`,
			snapshot: `
const value = new Object();
              ~~~
              Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const empty = new Object();
const filled = new Object({ key: "value" });
`,
			snapshot: `
const empty = new Object();
              ~~~
              Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
const filled = new Object({ key: "value" });
               ~~~
               Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
function createObject() {
    return new Object();
}
`,
			snapshot: `
function createObject() {
    return new Object();
           ~~~
           Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
}
`,
		},
		{
			code: `
declare const condition: boolean;

const config = condition ? new Object() : { default: true };
`,
			snapshot: `
declare const condition: boolean;

const config = condition ? new Object() : { default: true };
                           ~~~
                           Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const array = [new Object(), new Object()];
`,
			snapshot: `
const array = [new Object(), new Object()];
               ~~~
               Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
                             ~~~
                             Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const nested = { inner: new Object() };
`,
			snapshot: `
const nested = { inner: new Object() };
                        ~~~
                        Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
declare function processData(value: object): void;

processData(new Object());
`,
			snapshot: `
declare function processData(value: object): void;

processData(new Object());
            ~~~
            Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const value = Object();
`,
			snapshot: `
const value = Object();
              ~~~~~~
              Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const filled = Object({ key: "value" });
`,
			snapshot: `
const filled = Object({ key: "value" });
               ~~~~~~
               Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
function createObject() {
    return Object();
}
`,
			snapshot: `
function createObject() {
    return Object();
           ~~~~~~
           Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
}
`,
		},
		{
			code: `
declare const condition: boolean;

const config = condition ? Object() : { default: true };
`,
			snapshot: `
declare const condition: boolean;

const config = condition ? Object() : { default: true };
                           ~~~~~~
                           Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
const array = [Object(), Object()];
`,
			snapshot: `
const array = [Object(), Object()];
               ~~~~~~
               Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
                         ~~~~~~
                         Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
		{
			code: `
declare function processData(value: object): void;

processData(Object());
`,
			snapshot: `
declare function processData(value: object): void;

processData(Object());
            ~~~~~~
            Prefer directly using \`{}\` instead of calling or constructing \`Object\`.
`,
		},
	],
	valid: [
		`const value = {};`,
		`const filled = { key: "value" };`,
		`const proto = Object.create(null);`,
		`
declare const prototype: object;

const inherited = Object.create(prototype);
`,
		`
declare const source: { key: string };

const assigned = Object.assign({}, source);
`,
		`
const data = { key: "value" };
const entries = Object.entries(data);
`,
		`
const data = { key: "value" };
const keys = Object.keys(data);
`,
		`
const data = { key: "value" };
const values = Object.values(data);
`,
		`function createEmpty() { return {}; }`,
		`const array = [{}, { key: "value" }];`,
		`const nested = { inner: {} };`,
		`
declare function processData(value: object): void;

processData({});
`,
		`
			class Object {}
			new Object();
			export {}
		`,
	],
});
