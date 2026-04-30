import rule from "./langValidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const element = <div lang=""></div>;
`,
			snapshot: `
const element = <div lang=""></div>;
                          ~~
                          The lang attribute value '(empty)' is not a valid BCP 47 language tag.
`,
		},
		{
			code: `
const element = <div lang="e"></div>;
`,
			snapshot: `
const element = <div lang="e"></div>;
                          ~~~
                          The lang attribute value 'e' is not a valid BCP 47 language tag.
`,
		},
		{
			code: `
const element = <div lang="1234"></div>;
`,
			snapshot: `
const element = <div lang="1234"></div>;
                          ~~~~~~
                          The lang attribute value '1234' is not a valid BCP 47 language tag.
`,
		},
		{
			code: `
const element = <html lang="123"></html>;
`,
			snapshot: `
const element = <html lang="123"></html>;
                           ~~~~~
                           The lang attribute value '123' is not a valid BCP 47 language tag.
`,
		},
	],
	valid: [
		`const element = <div lang="en"></div>;`,
		`const element = <div lang="en-US"></div>;`,
		`const element = <div lang="en-GB"></div>;`,
		`const element = <div lang="zh-Hans"></div>;`,
		`const element = <div lang="zh-Hans-CN"></div>;`,
		`const element = <div lang="fr"></div>;`,
		`const element = <div lang="fr-CA"></div>;`,
		`const element = <div lang="es-419"></div>;`,
		`const element = <html lang="en"></html>;`,
		`const element = <html lang="en-US"></html>;`,
		`const element = <div></div>;`,
		`const element = <div lang={language}></div>;`,
		`const element = <div lang="en-GB-oxendict"></div>;`,
	],
});
