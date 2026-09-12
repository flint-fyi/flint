import rule from "./returnAwaitPromises.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
async function load() {
    try {
        return Promise.resolve(1);
    } catch {}
}
`,
			snapshot: `
async function load() {
    try {
        return Promise.resolve(1);
               ~~~~~~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } catch {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load() {
    try {
        return await Promise.resolve(1);
    } catch {}
}
`,
				},
			],
		},
		{
			code: `
const load = async () => await 1;
`,
			snapshot: `
const load = async () => await 1;
                         ~~~~~
                         This returned value is not thenable, so awaiting it only changes completion timing.
`,
			suggestions: [
				{
					id: "removeAwait",
					updated: `
const load = async () => 1;
`,
				},
			],
		},
		{
			code: `
async function choose(flag: boolean) {
    try {
        return flag ? Promise.resolve(1) : 1;
    } finally {}
}
`,
			snapshot: `
async function choose(flag: boolean) {
    try {
        return flag ? Promise.resolve(1) : 1;
                      ~~~~~~~~~~~~~~~~~~
                      Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function choose(flag: boolean) {
    try {
        return flag ? await Promise.resolve(1) : 1;
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function dispose() {
    using resource = createResource();
    return Promise.resolve(1);
}
`,
			snapshot: `
async function dispose() {
    using resource = createResource();
    return Promise.resolve(1);
           ~~~~~~~~~~~~~~~~~~
           Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function dispose() {
    using resource = createResource();
    return await Promise.resolve(1);
}
`,
				},
			],
		},
		{
			code: `
async function load() {
    return await {};
}
`,
			snapshot: `
async function load() {
    return await {};
           ~~~~~
           This returned value is not thenable, so awaiting it only changes completion timing.
}
`,
			suggestions: [
				{
					id: "removeAwait",
					updated: `
async function load() {
    return {};
}
`,
				},
			],
		},
		{
			code: `
async function load(value: PromiseLike<number>) {
    try {} catch {
        return value;
    } finally {}
}
`,
			snapshot: `
async function load(value: PromiseLike<number>) {
    try {} catch {
        return value;
               ~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load(value: PromiseLike<number>) {
    try {} catch {
        return await value;
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function load() {
    try {
        try {} finally {
            return Promise.resolve(1);
        }
    } catch {}
}
`,
			snapshot: `
async function load() {
    try {
        try {} finally {
            return Promise.resolve(1);
                   ~~~~~~~~~~~~~~~~~~
                   Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
        }
    } catch {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load() {
    try {
        try {} finally {
            return await Promise.resolve(1);
        }
    } catch {}
}
`,
				},
			],
		},
		{
			code: `
async function load(left: Promise<number>, right: Promise<string>) {
    try {
        return left || right;
    } finally {}
}
`,
			snapshot: `
async function load(left: Promise<number>, right: Promise<string>) {
    try {
        return left || right;
               ~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load(left: Promise<number>, right: Promise<string>) {
    try {
        return await (left || right);
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function load(value: unknown) {
    try {
        return value as Promise<number>;
    } finally {}
}
`,
			snapshot: `
async function load(value: unknown) {
    try {
        return value as Promise<number>;
               ~~~~~~~~~~~~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load(value: unknown) {
    try {
        return await (value as Promise<number>);
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function load(value: Promise<number>) {
    try {
        return (value satisfies PromiseLike<number>);
    } finally {}
}
`,
			snapshot: `
async function load(value: Promise<number>) {
    try {
        return (value satisfies PromiseLike<number>);
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load(value: Promise<number>) {
    try {
        return await (value satisfies PromiseLike<number>);
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function load() {
    for (using resource = createResource(); condition; update()) {
        return Promise.resolve(1);
    }
}
`,
			snapshot: `
async function load() {
    for (using resource = createResource(); condition; update()) {
        return Promise.resolve(1);
               ~~~~~~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    }
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load() {
    for (using resource = createResource(); condition; update()) {
        return await Promise.resolve(1);
    }
}
`,
				},
			],
		},
		{
			code: `
class Loader {
    async load() {
        for (using resource of resources) {
            return Promise.resolve(1);
        }
    }
}
`,
			snapshot: `
class Loader {
    async load() {
        for (using resource of resources) {
            return Promise.resolve(1);
                   ~~~~~~~~~~~~~~~~~~
                   Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
        }
    }
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
class Loader {
    async load() {
        for (using resource of resources) {
            return await Promise.resolve(1);
        }
    }
}
`,
				},
			],
		},
		{
			code: `
async function load(flag: boolean) {
    try {
        return ((flag ? Promise.resolve(1) : 1));
    } finally {}
}
`,
			snapshot: `
async function load(flag: boolean) {
    try {
        return ((flag ? Promise.resolve(1) : 1));
                        ~~~~~~~~~~~~~~~~~~
                        Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load(flag: boolean) {
    try {
        return ((flag ? await Promise.resolve(1) : 1));
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
async function load() {
    return await /* retain */ 1;
}
`,
			snapshot: `
async function load() {
    return await /* retain */ 1;
           ~~~~~
           This returned value is not thenable, so awaiting it only changes completion timing.
}
`,
			suggestions: [
				{
					id: "removeAwait",
					updated: `
async function load() {
    return  /* retain */ 1;
}
`,
				},
			],
		},
		{
			code: `
const load = async function () {
    try {
        return <Promise<number>>Promise.resolve(1);
    } finally {}
};
`,
			snapshot: `
const load = async function () {
    try {
        return <Promise<number>>Promise.resolve(1);
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
};
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
const load = async function () {
    try {
        return await (<Promise<number>>Promise.resolve(1));
    } finally {}
};
`,
				},
			],
		},
		{
			code: `
async function load<T extends PromiseLike<number>>(value: T) {
    try {
        return value;
    } finally {}
}
`,
			snapshot: `
async function load<T extends PromiseLike<number>>(value: T) {
    try {
        return value;
               ~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
async function load<T extends PromiseLike<number>>(value: T) {
    try {
        return await value;
    } finally {}
}
`,
				},
			],
		},
		{
			code: `
type NumberThen = (resolve: (value: number) => void) => void;
type StringThen = (resolve: (value: string) => void) => void;
async function load(value: { then: NumberThen | StringThen }) {
    try {
        return value;
    } finally {}
}
`,
			snapshot: `
type NumberThen = (resolve: (value: number) => void) => void;
type StringThen = (resolve: (value: string) => void) => void;
async function load(value: { then: NumberThen | StringThen }) {
    try {
        return value;
               ~~~~~
               Await this returned promise so its rejection is handled before the surrounding error handling or resource disposal completes.
    } finally {}
}
`,
			suggestions: [
				{
					id: "addAwait",
					updated: `
type NumberThen = (resolve: (value: number) => void) => void;
type StringThen = (resolve: (value: string) => void) => void;
async function load(value: { then: NumberThen | StringThen }) {
    try {
        return await value;
    } finally {}
}
`,
				},
			],
		},
	],
	valid: [
		`async function load() { return Promise.resolve(1); }`,
		`async function load() { try {} catch { return Promise.resolve(1); } }`,
		`async function load() { try {} finally { return Promise.resolve(1); } }`,
		`async function* load() { try { return Promise.resolve(1); } finally {} }`,
		`const load = async function* () { try { return await 1; } finally {} };`,
		`class Loader { async *load() { try { return Promise.resolve(1); } finally {} } }`,
		`function load() { try { return Promise.resolve(1); } finally {} }`,
		`const load = () => { try { return Promise.resolve(1); } finally {} };`,
		`class Loader { get value() { try { return Promise.resolve(1); } finally {} } }`,
		`async function load(value: any) { try { return value; } finally {} }`,
		`async function load(value: unknown) { try { return value; } finally {} }`,
		`async function load(value: Promise<number> | number) { try { return value; } finally {} }`,
		`async function load(value: Promise<number> | undefined) { try { return value; } finally {} }`,
		`async function load(value: number | string) { try { return value; } finally {} }`,
		`async function load<T extends object>(value: T) { try { return value; } finally {} }`,
		`async function load<T extends { value: number }>(value: T) { try { return value; } finally {} }`,
		`async function load<T extends number>(value: T) { try { return value; } finally {} }`,
		`async function load<T>(value: T) { try { return value; } finally {} }`,
		`async function load<T extends any>(value: T) { try { return value; } finally {} }`,
		`async function load<T extends unknown>(value: T) { try { return value; } finally {} }`,
		`async function load<T extends PromiseLike<number> | number>(value: T) { try { return value; } finally {} }`,
		`async function load(value: never) { try { return value; } finally {} }`,
		`async function load(value: null | undefined | void) { try { return value; } finally {} }`,
		`async function load(value: bigint | boolean | number | string | symbol) { try { return value; } finally {} }`,
		`async function load(value: { then?: (resolve: (value: number) => void) => void }) { try { return value; } finally {} }`,
		`async function load(value: { then: ((resolve: (value: number) => void) => void) | undefined }) { try { return value; } finally {} }`,
		`async function load(value: { then: any }) { try { return value; } finally {} }`,
		`async function load(value: { then(): void }) { try { return value; } finally {} }`,
		`async function load(value: { then(resolve: number): void }) { try { return value; } finally {} }`,
		`async function load(value: { then(resolve: any): void }) { try { return value; } finally {} }`,
		`async function load() { return await Promise.resolve(1); }`,
		`async function load(value: Promise<number> | number) { return await value; }`,
		`async function load(flag: boolean, value: Promise<number>) { try { return await (flag ? value : 1); } finally {} }`,
		`async function load(flag: boolean, value: Promise<number>) { try { return flag && value; } finally {} }`,
		`async function load() { return; }`,
		`return Promise.resolve(1);`,
		`
async function load() {
    return Promise.resolve(1);
    using resource = createResource();
}
`,
		`
async function outer() {
    using resource = createResource();
    return async function inner() { return Promise.resolve(1); };
}
`,
		`
async function load(flag: boolean) {
    if (flag) {
        using resource = createResource();
    }
    return Promise.resolve(1);
}
`,
		`
async function load() {
    {
        using resource = createResource();
    }
    return Promise.resolve(1);
}
`,
		`
async function load() {
    const value = 1;
    return Promise.resolve(value);
}
`,
	],
});
