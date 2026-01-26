import rule from "./unifiedSignatures.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `interface Parser {
    parse(input: string): Document;
    parse(input: Buffer): Document;
}`,
			snapshot: `interface Parser {
    parse(input: string): Document;
    parse(input: Buffer): Document;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    These overloads could be unified using a union type.
}`,
		},
		{
			code: `interface Logger {
    log(): void;
    log(message: string): void;
}`,
			snapshot: `interface Logger {
    log(): void;
    log(message: string): void;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    These overloads could be unified using an optional parameter.
}`,
		},
		{
			code: `type Handler = {
    (event: MouseEvent): void;
    (event: KeyboardEvent): void;
};`,
			snapshot: `type Handler = {
    (event: MouseEvent): void;
    (event: KeyboardEvent): void;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    These overloads could be unified using a union type.
};`,
		},
	],
	valid: [
		`interface Parser {
    parse(input: string | Buffer): Document;
}`,
		`interface Logger {
    log(message?: string): void;
}`,
		`interface Service {
    fetch(id: number): Item;
    fetch(name: string): Item[];
}`,
		`interface Converter {
    convert(value: number): string;
    convert(value: string): number;
}`,
	],
});
