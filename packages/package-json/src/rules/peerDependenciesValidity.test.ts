import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.peerDependenciesValidity, {
	invalid: [
		{
			code: `{
  "peerDependencies": null
}`,
			snapshot: `{
  "peerDependencies": null
                      ~~~~
                      Invalid peerDependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "peerDependencies": 123
}`,
			snapshot: `{
  "peerDependencies": 123
                      ~~~
                      Invalid peerDependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "peerDependencies": "./script.js"
}`,
			snapshot: `{
  "peerDependencies": "./script.js"
                      ~~~~~~~~~~~~~
                      Invalid peerDependencies: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "peerDependencies": []
}`,
			snapshot: `{
  "peerDependencies": []
                      ~~
                      Invalid peerDependencies: the type should be \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "peerDependencies": {
    "david": "bowie",
    "trent": 123,
    "the-fragile": null,
    "pink-floyd": {},
    "childish-gambino": "workspace"
  }
}`,
			snapshot: `{
  "peerDependencies": {
    "david": "bowie",
    ~~~~~~~~~~~~~~~~
    Invalid peerDependencies: invalid version range for dependency david: bowie.
    "trent": 123,
    ~~~~~~~~~~~~
    Invalid peerDependencies: dependency version for trent should be a string: 123.
    "the-fragile": null,
    ~~~~~~~~~~~~~~~~~~~
    Invalid peerDependencies: dependency version for the-fragile should be a string: null.
    "pink-floyd": {},
    ~~~~~~~~~~~~~~~~
    Invalid peerDependencies: dependency version for pink-floyd should be a string: [object Object].
    "childish-gambino": "workspace"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Invalid peerDependencies: invalid version range for dependency childish-gambino: workspace.
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
  "peerDependencies": {}
}`,
		},
		{
			code: `{
  "peerDependencies": {
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
