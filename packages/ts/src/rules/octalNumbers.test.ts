import rule from "./octalNumbers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const value = 0; void value;`,
			name: "RuleTester invalid-suite sentinel",
			snapshot: `const value = 0; void value;`,
		},
	],
	valid: [
		`const value = 0; void value;`,
		`const value = 1; void value;`,
		`const value = 10; void value;`,
		`const value = 100; void value;`,
		`const value = 0x7F; void value;`,
		`const value = 0o77; void value;`,
		`const value = 0O77; void value;`,
		`const value = 0b111; void value;`,
		`const value = 0B111; void value;`,
		`const value = 0.8; void value;`,
		`const value = 8; void value;`,
		`const value = 9; void value;`,
		`const value = 123; void value;`,
		`const values = [0, 1, 10, 100]; void values;`,
		`const hex = 0xFF; void hex;`,
		`const binary = 0b1010; void binary;`,
		`const octal = 0o755; void octal;`,
	],
});
