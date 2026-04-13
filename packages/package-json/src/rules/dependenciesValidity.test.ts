import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.dependenciesValidity, {
	invalid: [
		{
			code: `{
  "dependencies": null
}`,
			snapshot: `{
  "dependencies": null
                  ~~~~
                  Invalid dependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "dependencies": 123
}`,
			snapshot: `{
  "dependencies": 123
                  ~~~
                  Invalid dependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "dependencies": "./script.js"
}`,
			snapshot: `{
  "dependencies": "./script.js"
                  ~~~~~~~~~~~~~
                  Invalid dependencies: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "dependencies": []
}`,
			snapshot: `{
  "dependencies": []
                  ~~
                  Invalid dependencies: the type should be \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "dependencies": {
    "david": "bowie",
    "trent": 123,
    "the-fragile": null,
    "pink-floyd": {},
    "childish-gambino": "workspace"
  }
}`,
			snapshot: `{
  "dependencies": {
    "david": "bowie",
    ~~~~~~~~~~~~~~~~
    Invalid dependencies: invalid version range for dependency david: bowie.
    "trent": 123,
    ~~~~~~~~~~~~
    Invalid dependencies: dependency version for trent should be a string: 123.
    "the-fragile": null,
    ~~~~~~~~~~~~~~~~~~~
    Invalid dependencies: dependency version for the-fragile should be a string: null.
    "pink-floyd": {},
    ~~~~~~~~~~~~~~~~
    Invalid dependencies: dependency version for pink-floyd should be a string: [object Object].
    "childish-gambino": "workspace"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Invalid dependencies: invalid version range for dependency childish-gambino: workspace.
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
  "dependencies": {}
}`,
		},
		{
			code: `{
  "dependencies": {
    "silver-mt-zion": "^1.2.3",
    "nin": "file:./nin",
    "gybe": "catalog:",
    "radiohead": "git+https://github.com/user/repo.git",
    "sigur-ros": "https://example.com/sigur-ros.tgz",
    "explosions-in-the-sky": "workspace:^",
    "alt-j": "workspace:~",
    "run-the-jewels": "workspace:*",
    "thee-silver-mt-zion": "workspace:^1.2.3",
    "efrim-manuel-menuck": "npm:bar@^1.0.0"
  }
}`,
		},
	],
});
