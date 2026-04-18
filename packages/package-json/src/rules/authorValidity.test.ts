import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.authorValidity, {
	invalid: [
		{
			code: `
{
  "author": null
}
`,
			snapshot: `
{
  "author": null
            ~~~~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
}
`,
		},
		{
			code: `
{
  "author": 123
}
`,
			snapshot: `
{
  "author": 123
            ~~~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
}
`,
		},
		{
			code: `
{
  "author": true
}
`,
			snapshot: `
{
  "author": true
            ~~~~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
}
`,
		},
		{
			code: `
{
  "author": []
}
`,
			snapshot: `
{
  "author": []
            ~~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
}
`,
		},
		{
			code: `
{
  "author": ""
}
`,
			snapshot: `
{
  "author": ""
            ~~
            Invalid author: person should have a name.
}
`,
		},
		{
			code: `
{
  "author": "   "
}
`,
			snapshot: `
{
  "author": "   "
            ~~~~~
            Invalid author: person should have a name.
}
`,
		},
		{
			code: `
{
  "author": "John <invalid>"
}
`,
			snapshot: `
{
  "author": "John <invalid>"
            ~~~~~~~~~~~~~~~~
            Invalid author: email is not valid: invalid.
}
`,
		},
		{
			code: `
{
  "author": "John (not-url)"
}
`,
			snapshot: `
{
  "author": "John (not-url)"
            ~~~~~~~~~~~~~~~~
            Invalid author: url is not valid: not-url.
}
`,
		},
		{
			code: `
{
  "author": "<john@example.com>"
}
`,
			snapshot: `
{
  "author": "<john@example.com>"
            ~~~~~~~~~~~~~~~~~~~~
            Invalid author: person should have a name.
}
`,
		},
		{
			code: `
{
  "author": {}
}
`,
			snapshot: `
{
  "author": {}
            ~~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
}
`,
		},
		{
			code: `
{
  "author": {
    "email": "john@example.com"
  }
}
`,
			snapshot: `
{
  "author": {
            ~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
    "email": "john@example.com"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  }
  ~
}
`,
		},
		{
			code: `
{
  "author": {
    "name": ""
  }
}
`,
			snapshot: `
{
  "author": {
    "name": ""
    ~~~~~~~~~~
    Invalid author: name should not be empty.
  }
}
`,
		},
		{
			code: `
{
  "author": {
    "name": "    "
  }
}
`,
			snapshot: `
{
  "author": {
    "name": "    "
    ~~~~~~~~~~~~~~
    Invalid author: name should not be empty.
  }
}
`,
		},
		{
			code: `
{
  "author": {
    "name": "John",
    "email": "invalid"
  }
}
`,
			snapshot: `
{
  "author": {
    "name": "John",
    "email": "invalid"
    ~~~~~~~~~~~~~~~~~~
    Invalid author: email is not valid: invalid.
  }
}
`,
		},
		{
			code: `
{
  "author": {
    "name": "John",
    "url": "invalid"
  }
}
`,
			snapshot: `
{
  "author": {
    "name": "John",
    "url": "invalid"
    ~~~~~~~~~~~~~~~~
    Invalid author: url is not valid: invalid.
  }
}
`,
		},
		{
			code: `
{
  "author": "John <invalid-email> (invalid-url)"
}
`,
			snapshot: `
{
  "author": "John <invalid-email> (invalid-url)"
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Invalid author: email is not valid: invalid-email.
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Invalid author: url is not valid: invalid-url.
}
`,
		},
	],
	valid: [
		`
{}`,
		`
{
  "author": "John Doe" }
`,
		`
{
  "author": "John <john@example.com>" }
`,
		`
{
  "author": "John (https://example.com)" }
`,
		`
{
  "author": "John <john@example.com> (https://example.com)" }
`,
		`
{
  "author": {
    "name": "John"
  }
}
`,
		`
{
  "author": {
    "name": "John",
    "email": "john@example.com"
  }
}
`,
		`
{
  "author": {
    "name": "John",
    "url": "https://example.com"
  }
}
`,
		`
{
  "author": {
    "name": "John",
    "email": "john@example.com",
    "url": "https://example.com"
  }
}
`,
	],
});
