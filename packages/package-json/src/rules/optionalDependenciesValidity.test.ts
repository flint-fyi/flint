import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.optionalDependenciesValidity, {
	invalid: [
		{
			code: `{
  "optionalDependencies": null
}`,
			snapshot: `{
  "optionalDependencies": null
                          ~~~~
                          Invalid optionalDependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "optionalDependencies": 123
}`,
			snapshot: `{
  "optionalDependencies": 123
                          ~~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "optionalDependencies": "./script.js"
}`,
			snapshot: `{
  "optionalDependencies": "./script.js"
                          ~~~~~~~~~~~~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "optionalDependencies": []
}`,
			snapshot: `{
  "optionalDependencies": []
                          ~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "optionalDependencies": {
    "david": "bowie",
    "trent": 123,
    "the-fragile": null,
    "pink-floyd": {},
    "childish-gambino": "workspace"
  }
}`,
			snapshot: `{
  "optionalDependencies": {
    "david": "bowie",
    ~~~~~~~~~~~~~~~~
    Invalid optionalDependencies: invalid version range for dependency david: bowie.
    "trent": 123,
    ~~~~~~~~~~~~
    Invalid optionalDependencies: dependency version for trent should be a string: 123.
    "the-fragile": null,
    ~~~~~~~~~~~~~~~~~~~
    Invalid optionalDependencies: dependency version for the-fragile should be a string: null.
    "pink-floyd": {},
    ~~~~~~~~~~~~~~~~
    Invalid optionalDependencies: dependency version for pink-floyd should be a string: [object Object].
    "childish-gambino": "workspace"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Invalid optionalDependencies: invalid version range for dependency childish-gambino: workspace.
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
  "optionalDependencies": {}
}`,
		},
		{
			code: `{
  "optionalDependencies": {
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
