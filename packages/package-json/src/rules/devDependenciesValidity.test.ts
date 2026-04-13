import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.devDependenciesValidity, {
	invalid: [
		{
			code: `{
  "devDependencies": null
}`,
			snapshot: `{
  "devDependencies": null
                     ~~~~
                     Invalid devDependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "devDependencies": 123
}`,
			snapshot: `{
  "devDependencies": 123
                     ~~~
                     Invalid devDependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "devDependencies": "./script.js"
}`,
			snapshot: `{
  "devDependencies": "./script.js"
                     ~~~~~~~~~~~~~
                     Invalid devDependencies: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "devDependencies": []
}`,
			snapshot: `{
  "devDependencies": []
                     ~~
                     Invalid devDependencies: the type should be \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "devDependencies": {
    "david": "bowie",
    "trent": 123,
    "the-fragile": null,
    "pink-floyd": {},
    "childish-gambino": "workspace"
  }
}`,
			snapshot: `{
  "devDependencies": {
    "david": "bowie",
    ~~~~~~~~~~~~~~~~
    Invalid devDependencies: invalid version range for dependency david: bowie.
    "trent": 123,
    ~~~~~~~~~~~~
    Invalid devDependencies: dependency version for trent should be a string: 123.
    "the-fragile": null,
    ~~~~~~~~~~~~~~~~~~~
    Invalid devDependencies: dependency version for the-fragile should be a string: null.
    "pink-floyd": {},
    ~~~~~~~~~~~~~~~~
    Invalid devDependencies: dependency version for pink-floyd should be a string: [object Object].
    "childish-gambino": "workspace"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Invalid devDependencies: invalid version range for dependency childish-gambino: workspace.
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
  "devDependencies": {}
}`,
		},
		{
			code: `{
  "devDependencies": {
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
