import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.publishConfigValidity, {
	invalid: [
		{
			code: `{
  "publishConfig": null
}`,
			snapshot: `{
  "publishConfig": null
                   ~~~~
                   Invalid publishConfig: the value is \`null\`, but should be an \`object\`.
}`,
		},
		{
			code: `{
  "publishConfig": 123
}`,
			snapshot: `{
  "publishConfig": 123
                   ~~~
                   Invalid publishConfig: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "publishConfig": "string"
}`,
			snapshot: `{
  "publishConfig": "string"
                   ~~~~~~~~
                   Invalid publishConfig: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "publishConfig": ["array", "of", "values"]
}`,
			snapshot: `{
  "publishConfig": ["array", "of", "values"]
                   ~~~~~~~~~~~~~~~~~~~~~~~~~
                   Invalid publishConfig: the type should be \`object\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": "not right",
    "bin": "",
    "cpu": ["", "   "],
    "directory": "",
    "exports": {
      "": "./dist/index.js",
      "./secondary": ""
    },
    "main": "",
    "provenance": null,
    "tag": ""
  }
}`,
			snapshot: `{
  "publishConfig": {
    "access": "not right",
    ~~~~~~~~~~~~~~~~~~~~~
    Invalid publishConfig: the value "not right" is not valid. Valid types are: public, restricted.
    "bin": "",
    ~~~~~~~~~
    Invalid publishConfig: the value is empty, but should be a relative path.
    "cpu": ["", "   "],
    "directory": "",
    ~~~~~~~~~~~~~~~
    Invalid publishConfig: the value is empty, but should be the path to a subdirectory.
    "exports": {
      "": "./dist/index.js",
      "./secondary": ""
    },
    "main": "",
    ~~~~~~~~~~
    Invalid publishConfig: the value is empty, but should be the path to the package's main module.
    "provenance": null,
    ~~~~~~~~~~~~~~~~~~
    Invalid publishConfig: the value is \`null\`, but should be a \`boolean\`.
    "tag": ""
    ~~~~~~~~~
    Invalid publishConfig: the value is empty, but should be a release tag.
  }
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": "",
    "bin": 123,
    "cpu": 123,
    "directory": 123,
    "exports": {
      "": 123,
      "./secondary": null
    },
    "main": 123,
    "provenance": 123,
    "tag": 123
  }
}`,
			snapshot: `{
  "publishConfig": {
    "access": "",
    ~~~~~~~~~~~~
    Invalid publishConfig: the value is empty, but should be "public" or "restricted".
    "bin": 123,
    ~~~~~~~~~~
    Invalid publishConfig: the type should be \`string\` or \`object\`, not \`number\`.
    "cpu": 123,
    ~~~~~~~~~~
    Invalid publishConfig: the type should be \`Array\`, not \`number\`.
    "directory": 123,
    ~~~~~~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`number\`.
    "exports": {
      "": 123,
      "./secondary": null
    },
    "main": 123,
    ~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`number\`.
    "provenance": 123,
    ~~~~~~~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`boolean\`, not \`number\`.
    "tag": 123
    ~~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`number\`.
  }
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": [],
    "directory": [],
    "provenance": [],
    "tag": []
  }
}`,
			snapshot: `{
  "publishConfig": {
    "access": [],
    ~~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
    "directory": [],
    ~~~~~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
    "provenance": [],
    ~~~~~~~~~~~~~~~~
    Invalid publishConfig: the type should be a \`boolean\`, not \`Array\`.
    "tag": []
    ~~~~~~~~~
    Invalid publishConfig: the type should be a \`string\`, not \`Array\`.
  }
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "publishConfig": {}
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": "restricted",
    "bin": "./bin/cli.js",
    "cpu": ["arm64", "x64"],
    "directory": "dist",
    "exports": {
      ".": "./dist/index.js",
      "./secondary": "./dist/secondary.js"
    },
    "main": "./dist/index.js",
    "provenance": true,
    "tag": "dev"
  }
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": null,
    "cpu": [],
    "exports": "./dist/index.js"
  }
}`,
		},
	],
});
