import rule from "./irregularWhitespace.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `key:\u00a0value`,
			snapshot: `key:\u00a0value
    ~
    Irregular whitespace character found.`,
		},
		{
			code: `name:\u2003test`,
			snapshot: `name:\u2003test
     ~
     Irregular whitespace character found.`,
		},
		{
			code: `a:\u00a0b\nc:\u00a0d`,
			snapshot: `a:\u00a0b
  ~
  Irregular whitespace character found.
c:\u00a0d
  ~
  Irregular whitespace character found.`,
		},
	],
	valid: [`key: value`, `name: test`, `multi:\n  line: value`],
});
