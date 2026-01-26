import rule from "./unnecessaryBooleanCasts.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `if (!!value) {}`,
			snapshot: `if (!!value) {}
    ~~~~~~~
    Redundant double negation.`,
		},
		{
			code: `while (!!condition) {}`,
			snapshot: `while (!!condition) {}
       ~~~~~~~~~~~
       Redundant double negation.`,
		},
		{
			code: `const result = !!flag ? "yes" : "no";`,
			snapshot: `const result = !!flag ? "yes" : "no";
               ~~~~~~
               Redundant double negation.`,
		},
		{
			code: `if (Boolean(value)) {}`,
			snapshot: `if (Boolean(value)) {}
    ~~~~~~~~~~~~~~
    Redundant Boolean() call.`,
		},
		{
			code: `while (Boolean(condition)) {}`,
			snapshot: `while (Boolean(condition)) {}
       ~~~~~~~~~~~~~~~~~~
       Redundant Boolean() call.`,
		},
		{
			code: `do {} while (!!active);`,
			snapshot: `do {} while (!!active);
             ~~~~~~~~
             Redundant double negation.`,
		},
		{
			code: `for (; !!running;) {}`,
			snapshot: `for (; !!running;) {}
       ~~~~~~~~~
       Redundant double negation.`,
		},
	],
	valid: [
		`if (value) {}`,
		`while (condition) {}`,
		`const result = flag ? "yes" : "no";`,
		`const bool = !!value;`,
		`const bool = Boolean(value);`,
		`!value;`,
		`const inverted = !value;`,
		`if (!value) {}`,
		`const result = { enabled: !!flag };`,
	],
});
