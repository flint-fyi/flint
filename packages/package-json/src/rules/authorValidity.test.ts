import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

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
  "author": "Name <invalid>"
}
`,
			snapshot: `
{
  "author": "Name <invalid>"
            ~~~~~~~~~~~~~~~~
            Invalid author: email is not valid: invalid.
}
`,
		},
		{
			code: `
{
  "author": "Name (not-url)"
}
`,
			snapshot: `
{
  "author": "Name (not-url)"
            ~~~~~~~~~~~~~~~~
            Invalid author: url is not valid: not-url.
}
`,
		},
		{
			code: `
{
  "author": "<name@example.com>"
}
`,
			snapshot: `
{
  "author": "<name@example.com>"
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
    "email": "name@example.com"
  }
}
`,
			snapshot: `
{
  "author": {
            ~
            Invalid author: the type should be a \`string\` or an \`object\` with at least a \`name\` property.
    "email": "name@example.com"
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
            ~~
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
            ~~~~~~
            Invalid author: name should not be empty.
  }
}
`,
		},
		{
			code: `
{
  "author": {
    "name": "Name",
    "email": "invalid"
  }
}
`,
			snapshot: `
{
  "author": {
    "name": "Name",
    "email": "invalid"
             ~~~~~~~~~
             Invalid author: email is not valid: invalid.
  }
}
`,
		},
		{
			code: `
{
  "author": {
    "name": "Name",
    "url": "invalid"
  }
}
`,
			snapshot: `
{
  "author": {
    "name": "Name",
    "url": "invalid"
           ~~~~~~~~~
           Invalid author: url is not valid: invalid.
  }
}
`,
		},
		{
			code: `
{
  "author": "Name <invalid-email> (invalid-url)"
}
`,
			snapshot: `
{
  "author": "Name <invalid-email> (invalid-url)"
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
  "author": "First Last" }
`,
		`
{
  "author": "Name <name@example.com>" }
`,
		`
{
  "author": "Name (https://example.com)" }
`,
		`
{
  "author": "Name <name@example.com> (https://example.com)" }
`,
		`
{
  "author": {
    "name": "Name"
  }
}
`,
		`
{
  "author": {
    "name": "Name",
    "email": "name@example.com"
  }
}
`,
		`
{
  "author": {
    "name": "Name",
    "url": "https://example.com"
  }
}
`,
		`
{
  "author": {
    "name": "Name",
    "email": "name@example.com",
    "url": "https://example.com"
  }
}
`,
	],
});
