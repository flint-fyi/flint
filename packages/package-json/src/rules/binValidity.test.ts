import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.binValidity, {
	invalid: [
		{
			code: `
{
  "bin": null
}
`,
			snapshot: `
{
  "bin": null
         ~~~~
         Invalid bin: the value is \`null\`, but should be a \`string\` or an \`object\`.
}
`,
		},
		{
			code: `
{
  "bin": 123
}
`,
			snapshot: `
{
  "bin": 123
         ~~~
         Invalid bin: the type should be \`string\` or \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "bin": ["./cli.js"]
}
`,
			snapshot: `
{
  "bin": ["./cli.js"]
         ~~~~~~~~~~~~
         Invalid bin: the type should be \`string\` or \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "bin": ""
}
`,
			snapshot: `
{
  "bin": ""
         ~~
         Invalid bin: the value is empty, but should be a relative path.
}
`,
		},
		{
			code: `
{
  "bin": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "bin": {
    "invalid-bin": 123
                   ~~~
                   Invalid bin: the value of property "invalid-bin" should be a string.
  }
}
`,
		},
		{
			code: `
{
  "bin": {
    "invalid-bin": ""
  }
}
`,
			snapshot: `
{
  "bin": {
    "invalid-bin": ""
                   ~~
                   Invalid bin: the value of property "invalid-bin" is empty, but should be a relative path.
  }
}
`,
		},
		{
			code: `
{
  "bin": {
    "": "invalid-key"
  }
}
`,
			snapshot: `
{
  "bin": {
    "": "invalid-key"
        ~~~~~~~~~~~~~
        Invalid bin: property 0 has an empty key, but should be a valid command name.
  }
}
`,
		},
		{
			code: `
{
  "bin": {
    "": "invalid-key",
    "   ": "invalid-key"
  }
}
`,
			snapshot: `
{
  "bin": {
    "": "invalid-key",
        ~~~~~~~~~~~~~
        Invalid bin: property 0 has an empty key, but should be a valid command name.
    "   ": "invalid-key"
           ~~~~~~~~~~~~~
           Invalid bin: property 1 has an empty key, but should be a valid command name.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "bin": "./cli.js"
}`,
		`{
  "bin": { "my-cli": "./cli.js" }
}`,
		`{
  "bin": "file.js"
}`,
		`{
  "bin": { "file": "file.js" }
}`,
		`{
  "bin": { "file": "file.js", "other": "./other.js" }
}`,
		`{
  "bin": { "first": "file.js", "OTHER": "./other.js" }
}`,
	],
});
