import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.publishConfigValidity, {
	invalid: [
		{
			code: `
{
  "publishConfig": null
}
`,
			snapshot: `
{
  "publishConfig": null
                   ~~~~
                   Invalid publishConfig: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "publishConfig": 123
}
`,
			snapshot: `
{
  "publishConfig": 123
                   ~~~
                   Invalid publishConfig: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "publishConfig": "string"
}
`,
			snapshot: `
{
  "publishConfig": "string"
                   ~~~~~~~~
                   Invalid publishConfig: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "access": "not right"
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "access": "not right"
              ~~~~~~~~~~~
              Invalid publishConfig: the value "not right" is not valid. Valid types are: public, restricted.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "access": ""
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "access": ""
              ~~
              Invalid publishConfig: the value is empty, but should be "public" or "restricted".
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "access": []
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "access": []
              ~~
              Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "bin": ""
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "bin": ""
           ~~
           Invalid publishConfig: the value is empty, but should be a relative path.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "bin": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "bin": 123
           ~~~
           Invalid publishConfig: the type should be \`string\` or \`object\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "cpu": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "cpu": 123
           ~~~
           Invalid publishConfig: the type should be \`Array\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "directory": ""
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "directory": ""
                 ~~
                 Invalid publishConfig: the value is empty, but should be the path to a subdirectory.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "directory": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "directory": 123
                 ~~~
                 Invalid publishConfig: the type should be a \`string\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "directory": []
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "directory": []
                 ~~
                 Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "main": ""
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "main": ""
            ~~
            Invalid publishConfig: the value is empty, but should be the path to the package's main module.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "main": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "main": 123
            ~~~
            Invalid publishConfig: the type should be a \`string\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "provenance": null
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "provenance": null
                  ~~~~
                  Invalid publishConfig: the value is \`null\`, but should be a \`boolean\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "provenance": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "provenance": 123
                  ~~~
                  Invalid publishConfig: the type should be a \`boolean\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "provenance": []
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "provenance": []
                  ~~
                  Invalid publishConfig: the type should be a \`boolean\`, not \`Array\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "tag": ""
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "tag": ""
           ~~
           Invalid publishConfig: the value is empty, but should be a release tag.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "tag": 123
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "tag": 123
           ~~~
           Invalid publishConfig: the type should be a \`string\`, not \`number\`.
  }
}
`,
		},
		{
			code: `
{
  "publishConfig": {
    "tag": []
  }
}
`,
			snapshot: `
{
  "publishConfig": {
    "tag": []
           ~~
           Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "publishConfig": {}
}`,
		`{
  "publishConfig": {
    "access": "restricted"
  }
}`,
		`{
  "publishConfig": {
    "access": null
  }
}`,
		`{
  "publishConfig": {
    "bin": "./bin/cli.js"
  }
}`,
		`{
  "publishConfig": {
    "cpu": ["arm64", "x64"]
  }
}`,
		`{
  "publishConfig": {
    "cpu": []
  }
}`,
		`{
  "publishConfig": {
    "directory": "dist"
  }
}`,
		`{
  "publishConfig": {
    "exports": "./dist/index.js"
  }
}`,
		`{
  "publishConfig": {
    "exports": {
      ".": "./dist/index.js",
      "./secondary": "./dist/secondary.js"
    }
  }
}`,
		`{
  "publishConfig": {
    "main": "./dist/index.js"
  }
}`,
		`{
  "publishConfig": {
    "provenance": true
  }
}`,
		`{
  "publishConfig": {
    "tag": "dev"
  }
}`,
	],
});
