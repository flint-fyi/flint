import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeParameters.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function consume<Value>(value: Value) {}
`,
			snapshot: `
function consume<Value>(value: Value) {}
                 ~~~~~
                 Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function consume(value: unknown) {}
`,
				},
			],
		},
		{
			code: `
class Empty<Value> {}
`,
			snapshot: `
class Empty<Value> {}
            ~~~~~
            Type parameter Value is never used in the class signature.
`,
			suggestions: [
				{ id: "replaceWithConstraint", updated: "\nclass Empty {}\n" },
			],
		},
		{
			code: `
const callback = <Value extends string | number>(value: Value[]) => value.length;
`,
			snapshot: `
const callback = <Value extends string | number>(value: Value[]) => value.length;
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
const callback = (value: (string | number)[]) => value.length;
`,
				},
			],
		},
		{
			code: `
interface Callable { <Value>(value: Value): void; }
`,
			snapshot: `
interface Callable { <Value>(value: Value): void; }
                      ~~~~~
                      Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: "\ninterface Callable { (value: unknown): void; }\n",
				},
			],
		},
		{
			code: `
type Constructor = new <Value>() => Value;
type FunctionType = <Result>() => Result;
`,
			snapshot: `
type Constructor = new <Value>() => Value;
                        ~~~~~
                        Type parameter Value is used only once in the function signature.
type FunctionType = <Result>() => Result;
                     ~~~~~~
                     Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated:
						"\ntype Constructor = new () => unknown;\ntype FunctionType = <Result>() => Result;\n",
				},
				{
					id: "replaceWithConstraint",
					updated:
						"\ntype Constructor = new <Value>() => Value;\ntype FunctionType = () => unknown;\n",
				},
			],
		},
		{
			code: `
interface Methods {
    method<Value>(value: Value): void;
}
const object = { method<Value>(value: Value) {} };
`,
			snapshot: `
interface Methods {
    method<Value>(value: Value): void;
           ~~~~~
           Type parameter Value is used only once in the function signature.
}
const object = { method<Value>(value: Value) {} };
                        ~~~~~
                        Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated:
						"\ninterface Methods {\n    method(value: unknown): void;\n}\nconst object = { method<Value>(value: Value) {} };\n",
				},
				{
					id: "replaceWithConstraint",
					updated:
						"\ninterface Methods {\n    method<Value>(value: Value): void;\n}\nconst object = { method(value: unknown) {} };\n",
				},
			],
		},
		{
			code: `
const expression = class<Value> {};
const fn = function <Result>(): Result { throw new Error(); };
`,
			snapshot: `
const expression = class<Value> {};
                         ~~~~~
                         Type parameter Value is never used in the class signature.
const fn = function <Result>(): Result { throw new Error(); };
                     ~~~~~~
                     Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated:
						"\nconst expression = class {};\nconst fn = function <Result>(): Result { throw new Error(); };\n",
				},
				{
					id: "replaceWithConstraint",
					updated:
						"\nconst expression = class<Value> {};\nconst fn = function (): unknown { throw new Error(); };\n",
				},
			],
		},
		{
			code: `
function arrays<Value>(input: Value[]) {}
`,
			snapshot: `
function arrays<Value>(input: Value[]) {}
                ~~~~~
                Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: "\nfunction arrays(input: unknown[]) {}\n",
				},
			],
		},
		{
			code: `
function bodyOnly<Value>() {
    let first: Value;
    let second: Value;
}
`,
			snapshot: `
function bodyOnly<Value>() {
                  ~~~~~
                  Type parameter Value is never used in the function signature.
    let first: Value;
    let second: Value;
}
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function bodyOnly() {
    let first: unknown;
    let second: unknown;
}
`,
				},
			],
		},
		{
			code: `
function defaults<Value extends object, Result = Value>(value: Value): Result {}
`,
			snapshot: `
function defaults<Value extends object, Result = Value>(value: Value): Result {}
                                        ~~~~~~~~~~~~~~
                                        Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function defaults<Value extends object>(value: Value): unknown {}
`,
				},
			],
		},
		{
			code: `
function replaceFirst<Value extends string, Result>(value: Value): Result {}
`,
			snapshot: `
function replaceFirst<Value extends string, Result>(value: Value): Result {}
                      ~~~~~~~~~~~~~~~~~~~~
                      Type parameter Value is used only once in the function signature.
                                            ~~~~~~
                                            Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function replaceFirst<Result>(value: string): Result {}
`,
				},
				{
					id: "replaceWithConstraint",
					updated: `
function replaceFirst<Value extends string>(value: Value): unknown {}
`,
				},
			],
		},
		{
			code: `
function indexedConstraint<Value extends { key: string } | { key: number }>(value: Value["key"]) {}
`,
			snapshot: `
function indexedConstraint<Value extends { key: string } | { key: number }>(value: Value["key"]) {}
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                           Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function indexedConstraint(value: ({ key: string } | { key: number })["key"]) {}
`,
				},
			],
		},
		{
			code: `
function unionConstraint<Value extends string | number>(value: Value | undefined) {}
`,
			snapshot: `
function unionConstraint<Value extends string | number>(value: Value | undefined) {}
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                         Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function unionConstraint(value: (string | number) | undefined) {}
`,
				},
			],
		},
		{
			code: `
function intersectionConstraint<Value extends string | number>(value: Value & {}) {}
`,
			snapshot: `
function intersectionConstraint<Value extends string | number>(value: Value & {}) {}
                                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                Type parameter Value is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function intersectionConstraint(value: (string | number) & {}) {}
`,
				},
			],
		},
		{
			code: `
function preserveComment<Value, /* result */ Result>(value: Value): Result {}
`,
			snapshot: `
function preserveComment<Value, /* result */ Result>(value: Value): Result {}
                         ~~~~~
                         Type parameter Value is used only once in the function signature.
                                             ~~~~~~
                                             Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function preserveComment</* result */ Result>(value: unknown): Result {}
`,
				},
				{
					id: "replaceWithConstraint",
					updated: `
function preserveComment<Value>(value: Value): unknown {}
`,
				},
			],
		},
		{
			code: `
function unionOutputs<ArrayValue, TupleValue>(): ArrayValue[] | [TupleValue] | undefined {}
`,
			snapshot: `
function unionOutputs<ArrayValue, TupleValue>(): ArrayValue[] | [TupleValue] | undefined {}
                      ~~~~~~~~~~
                      Type parameter ArrayValue is used only once in the function signature.
                                  ~~~~~~~~~~
                                  Type parameter TupleValue is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function unionOutputs<TupleValue>(): unknown[] | [TupleValue] | undefined {}
`,
				},
				{
					id: "replaceWithConstraint",
					updated: `
function unionOutputs<ArrayValue>(): ArrayValue[] | [unknown] | undefined {}
`,
				},
			],
		},
		{
			code: `
function preservePrevious<Value /* value */, Result>(value: Value): Result {}
`,
			snapshot: `
function preservePrevious<Value /* value */, Result>(value: Value): Result {}
                          ~~~~~
                          Type parameter Value is used only once in the function signature.
                                             ~~~~~~
                                             Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function preservePrevious<Result>(value: unknown): Result {}
`,
				},
				{
					id: "replaceWithConstraint",
					updated: `
function preservePrevious<Value /* value */>(value: Value): unknown {}
`,
				},
			],
		},
		{
			code: `
function preserveMultiline<Value,
    /* result */ Result>(value: Value): Result {}
`,
			snapshot: `
function preserveMultiline<Value,
                           ~~~~~
                           Type parameter Value is used only once in the function signature.
    /* result */ Result>(value: Value): Result {}
                 ~~~~~~
                 Type parameter Result is used only once in the function signature.
`,
			suggestions: [
				{
					id: "replaceWithConstraint",
					updated: `
function preserveMultiline</* result */ Result>(value: unknown): Result {}
`,
				},
				{
					id: "replaceWithConstraint",
					updated: `
function preserveMultiline<Value>(value: Value): unknown {}
`,
				},
			],
		},
	],
	valid: [
		"const plain = () => 0; class Plain {}",
		"const identity = <Value>(value: Value): Value => value;",
		"function pair<Value>(first: Value, second: Value) { return [first, second]; }",
		"function inferred<Value>(value: Value) { return value; }",
		"function wrapped<Value>(value: Promise<Value>) {}",
		"function nestedWrapped<Value>(value: Promise<Value | string>) {}",
		"function mutable<Value>(): Value[] { return []; }",
		"function mutableTuple<Value>(): [Value] { throw new Error(); }",
		"function repeatedTuple<Value>(value: [Value, Value]) {}",
		"function readonlyArray<Value>(value: Value): ReadonlyArray<Value> { return [value]; }",
		"function readonlyTuple<Value>(value: Value): readonly [Value] { return [value]; }",
		"function explicitThis<Value>(this: Value, value: Value) {}",
		"function predicate<Value>(value: unknown, expected: Value): value is Value { return value === expected; }",
		"function indexed<Value, Key extends keyof Value>(value: Value, key: Key): Value[Key] { return value[key]; }",
		"function templated<Value extends string>(value: Value): `prefix-${Value}` { return `prefix-${value}`; }",
		"function conditional<Value>(value: Value): Value extends string ? Value : never { throw new Error(); }",
		"function mapped<Value>(value: Value): { [Key in keyof Value as `${Key & string}`]: Value[Key] } { throw new Error(); }",
		'function mappedProperties<Value>(value: Value): { [Key in "fixed"]: Value } { return { fixed: value }; }',
		"declare function mappedReturnType<Value extends string>(value: Value): { [Key in Value]: Capitalize<Key> }; function inferredMappedReturnType<Value extends string>(value: Value) { return mappedReturnType(value); }",
		"function objectSignatures<Value>(value: Value): { (input: Value): Value; new (input: Value): { value: Value }; [key: string]: Value; [key: number]: Value } { throw new Error(); }",
		"function noTypeArguments<Value>(value: Value): Value | Date { return value; }",
		"function deep<Value>(value: [Value, Value, Value, Value, Value, Value, Value, Value, Value, Value, Value]) {}",
		"function shadowed<Value>(value: Value): Value { function inner<Value>(value: Value): Value { return value; } return inner(value); }",
		"type Alias<Input> = { value: Input }; function aliased<Value>(value: Alias<Value>) {}",
		"class Box<Value> { first?: Value; second?: Value; }",
		"class ArrayBox<Value> { values: Value[] = []; }",
	],
});
