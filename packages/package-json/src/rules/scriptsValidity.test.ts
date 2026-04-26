import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.scriptsValidity, {
	invalid: [
		{
			code: `
{
  "scripts": null
}
`,
			snapshot: `
{
  "scripts": null
             ~~~~
             Invalid scripts: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "scripts": 123
}
`,
			snapshot: `
{
  "scripts": 123
             ~~~
             Invalid scripts: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "scripts": "./script.js"
}
`,
			snapshot: `
{
  "scripts": "./script.js"
             ~~~~~~~~~~~~~
             Invalid scripts: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "scripts": ["tsc"]
}
`,
			snapshot: `
{
  "scripts": ["tsc"]
             ~~~~~~~
             Invalid scripts: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "scripts": {
    "invalid": 123
  }
}
`,
			snapshot: `
{
  "scripts": {
    "invalid": 123
               ~~~
               Invalid scripts: the value of property "invalid" should be a string.
  }
}
`,
		},
		{
			code: `
{
  "scripts": {
    "invalid": ""
  }
}
`,
			snapshot: `
{
  "scripts": {
    "invalid": ""
               ~~
               Invalid scripts: the value of property "invalid" is empty, but should be a script command.
  }
}
`,
		},
		{
			code: `
{
  "scripts": {
    "": "invalid"
  }
}
`,
			snapshot: `
{
  "scripts": {
    "": "invalid"
        ~~~~~~~~~
        Invalid scripts: property 0 has an empty key, but should be a script name.
  }
}
`,
		},
		{
			code: `
{
  "scripts": {
    "": "invalid",
    "   ": "invalid"
  }
}
`,
			snapshot: `
{
  "scripts": {
    "": "invalid",
        ~~~~~~~~~
        Invalid scripts: property 0 has an empty key, but should be a script name.
    "   ": "invalid"
           ~~~~~~~~~
           Invalid scripts: property 1 has an empty key, but should be a script name.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`
{
  "scripts": { "first": "node ./first.js" }
}
	`,
		`
{
  "scripts": { "first": "node ./first.js", "second": "node ./second.js" }
}
	`,
	],
});
