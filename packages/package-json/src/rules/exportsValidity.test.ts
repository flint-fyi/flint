import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.exportsValidity, {
	invalid: [
		{
			code: `
{
  "exports": null
}
`,
			snapshot: `
{
  "exports": null
             ~~~~
             Invalid exports: the value is \`null\`, but should be an \`object\` or \`string\`.
}
`,
		},
		{
			code: `
{
  "exports": 123
}
`,
			snapshot: `
{
  "exports": 123
             ~~~
             Invalid exports: the type should be \`object\` or \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "exports": ["./index.js"]
}
`,
			snapshot: `
{
  "exports": ["./index.js"]
             ~~~~~~~~~~~~~~
             Invalid exports: the type should be \`object\` or \`string\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "exports": ""
}
`,
			snapshot: `
{
  "exports": ""
             ~~
             Invalid exports: the value is empty, but should be an entry point path.
}
`,
		},
		{
			code: `
{
  "exports": {
    "./invalid": 123
  }
}
`,
			snapshot: `
{
  "exports": {
    "./invalid": 123
                 ~~~
                 Invalid exports: the value of "./invalid" should be either an entry point path or an object of export conditions.
  }
}
`,
		},
		{
			code: `
{
  "exports": {
    "./invalid": ""
  }
}
`,
			snapshot: `
{
  "exports": {
    "./invalid": ""
                 ~~
                 Invalid exports: the value of "./invalid" is empty, but should be an entry point path.
  }
}
`,
		},
		{
			code: `
{
  "exports": {
    "": "invalid"
  }
}
`,
			snapshot: `
{
  "exports": {
    "": "invalid"
        ~~~~~~~~~
        Invalid exports: property 0 has an empty key, but should be an export condition.
  }
}
`,
		},
		{
			code: `
{
  "exports": {
    "": "invalid",
    "   ": "invalid"
  }
}
`,
			snapshot: `
{
  "exports": {
    "": "invalid",
        ~~~~~~~~~
        Invalid exports: property 0 has an empty key, but should be an export condition.
    "   ": "invalid"
           ~~~~~~~~~
           Invalid exports: property 1 has an empty key, but should be an export condition.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "exports": "./index.js"
}`,
		`{
  "exports": {
    ".": "./index.js"
  }
}`,
		`{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  }
}`,
	],
});
