import rule from "./mappingKeyCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `camelCase: value`,
			snapshot: `camelCase: value
~~~~~~~~~
Mapping key should use snake_case.`,
		},
		{
			code: `PascalCase: value`,
			snapshot: `PascalCase: value
~~~~~~~~~~
Mapping key should use snake_case.`,
		},
		{
			code: `kebab-case: value`,
			snapshot: `kebab-case: value
~~~~~~~~~~
Mapping key should use snake_case.`,
		},
		{
			code: `SCREAMING_SNAKE: value`,
			snapshot: `SCREAMING_SNAKE: value
~~~~~~~~~~~~~~~
Mapping key should use snake_case.`,
		},
	],
	valid: [
		`snake_case: value`,
		`simple: value`,
		`key123: value`,
		`multi_word_key: value`,
	],
});
