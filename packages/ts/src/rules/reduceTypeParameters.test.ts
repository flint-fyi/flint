import rule from "./reduceTypeParameters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[1, 2, 3].reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
`,
			output: `
[1, 2, 3].reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
[1, 2, 3].reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
                                                                        ~~~~~~~~~~~~~~
                                                                        Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
[1, 2, 3].reduce((accumulator, value) => accumulator.concat(value * 2), <number[]>[]);
`,
			output: `
[1, 2, 3].reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
[1, 2, 3].reduce((accumulator, value) => accumulator.concat(value * 2), <number[]>[]);
                                                                        ~~~~~~~~~~~~
                                                                        Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
[1, 2, 3]?.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
`,
			output: `
[1, 2, 3]?.reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
[1, 2, 3]?.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
                                                                         ~~~~~~~~~~~~~~
                                                                         Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
const names = ["a", "b", "c"];
names.reduce(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {} as Record<string, boolean>,
);
`,
			output: `
const names = ["a", "b", "c"];
names.reduce<Record<string, boolean>>(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {},
);
`,
			snapshot: `
const names = ["a", "b", "c"];
names.reduce(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {} as Record<string, boolean>,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
);
`,
		},
		{
			code: `
["a", "b"]["reduce"](
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {} as Record<string, boolean>,
);
`,
			output: `
["a", "b"]["reduce"]<Record<string, boolean>>(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {},
);
`,
			snapshot: `
["a", "b"]["reduce"](
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {} as Record<string, boolean>,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
);
`,
		},
		{
			code: `
declare const tuple: [number, number, number];
tuple.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
`,
			output: `
declare const tuple: [number, number, number];
tuple.reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
declare const tuple: [number, number, number];
tuple.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
                                                                    ~~~~~~~~~~~~~~
                                                                    Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
declare const tupleOrArray: [number, number, number] | number[];
tupleOrArray.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
`,
			output: `
declare const tupleOrArray: [number, number, number] | number[];
tupleOrArray.reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
declare const tupleOrArray: [number, number, number] | number[];
tupleOrArray.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
                                                                           ~~~~~~~~~~~~~~
                                                                           Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
declare const tuple: [number, number, number] & number[];
tuple.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
`,
			output: `
declare const tuple: [number, number, number] & number[];
tuple.reduce<number[]>((accumulator, value) => accumulator.concat(value * 2), []);
`,
			snapshot: `
declare const tuple: [number, number, number] & number[];
tuple.reduce((accumulator, value) => accumulator.concat(value * 2), [] as number[]);
                                                                    ~~~~~~~~~~~~~~
                                                                    Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
function example<U extends number[]>(values: U) {
    return values.reduce(() => {}, {} as Record<string, boolean>);
}
`,
			output: `
function example<U extends number[]>(values: U) {
    return values.reduce<Record<string, boolean>>(() => {}, {});
}
`,
			snapshot: `
function example<U extends number[]>(values: U) {
    return values.reduce(() => {}, {} as Record<string, boolean>);
                                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                   Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
}
`,
		},
		{
			code: `
function example<T extends Record<string, boolean>>(value: T) {
    ["a", "b"].reduce(
        (accumulator, name) => ({
            ...accumulator,
            [name]: true,
        }),
        value as Record<string, boolean>,
    );
}
`,
			output: `
function example<T extends Record<string, boolean>>(value: T) {
    ["a", "b"].reduce<Record<string, boolean>>(
        (accumulator, name) => ({
            ...accumulator,
            [name]: true,
        }),
        value,
    );
}
`,
			snapshot: `
function example<T extends Record<string, boolean>>(value: T) {
    ["a", "b"].reduce(
        (accumulator, name) => ({
            ...accumulator,
            [name]: true,
        }),
        value as Record<string, boolean>,
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
    );
}
`,
		},
		{
			code: `
declare const values: string[];
values.reduce((accumulator) => accumulator, values.shift() as string | undefined);
`,
			output: `
declare const values: string[];
values.reduce<string | undefined>((accumulator) => accumulator, values.shift());
`,
			snapshot: `
declare const values: string[];
values.reduce((accumulator) => accumulator, values.shift() as string | undefined);
                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                            Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const arrayOrReducer: number[] & Reducer;
arrayOrReducer.reduce(accumulator => {
    return (accumulator as number[]).concat(1);
}, [] as number[]);
`,
			output: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const arrayOrReducer: number[] & Reducer;
arrayOrReducer.reduce<number[]>(accumulator => {
    return (accumulator as number[]).concat(1);
}, []);
`,
			snapshot: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const arrayOrReducer: number[] & Reducer;
arrayOrReducer.reduce(accumulator => {
    return (accumulator as number[]).concat(1);
}, [] as number[]);
   ~~~~~~~~~~~~~~
   Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
		{
			code: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const tuple: [number, number, number] | Reducer;
tuple.reduce(accumulator => {
    return (accumulator as number[]).concat(1);
}, [] as number[]);
`,
			output: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const tuple: [number, number, number] | Reducer;
tuple.reduce<number[]>(accumulator => {
    return (accumulator as number[]).concat(1);
}, []);
`,
			snapshot: `
type Reducer = { reduce: (callback: (arg: unknown) => unknown, arg: unknown) => unknown };
declare const tuple: [number, number, number] | Reducer;
tuple.reduce(accumulator => {
    return (accumulator as number[]).concat(1);
}, [] as number[]);
   ~~~~~~~~~~~~~~
   Using a type assertion on a reducer's initial value is less type-safe than providing a type parameter.
`,
		},
	],
	valid: [
		`[1, 2, 3].reduce((sum, num) => sum + num, 0);`,
		`[1, 2, 3].reduce((accumulator, value) => accumulator.concat(value * 2), []);`,
		`[1, 2, 3]?.reduce((accumulator, value) => accumulator.concat(value * 2), []);`,
		`[1, 2, 3]["reduce"]((sum, num) => sum + num, 0);`,
		`[1, 2, 3][null as unknown as "reduce"]((sum, num) => sum + num, 0);`,
		`declare const tuple: [number, number, number]; tuple.reduce((accumulator, value) => accumulator.concat(value * 2), []);`,
		`["a", "b"].reduce((accumulator, name) => \`\${accumulator} | hello \${name}!\`);`,
		`
new (class Mine {
    reduce() {}
})().reduce(() => {}, 1 as number);
`,
		`
class Mine {
    reduce() {}
}
new Mine().reduce(() => {}, 1 as number);
`,
		`
["a", "b"].reduce(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    {} as Record<"a" | "b", boolean>,
);
`,
		`
["a", "b"].reduce(
    (accumulator, name) => ({
        ...accumulator,
        [name]: true,
    }),
    { a: true, b: false, c: true } as Record<"a" | "b", boolean>,
);
`,
		`
function example<T extends Record<string, boolean>>() {
    ["a", "b"].reduce(
        (accumulator, name) => ({
            ...accumulator,
            [name]: true,
        }),
        {} as T,
    );
}
`,
		`
function example<T>() {
    ["a", "b"].reduce(
        (accumulator, name) => ({
            ...accumulator,
            [name]: true,
        }),
        {} as T,
    );
}
`,
	],
});
