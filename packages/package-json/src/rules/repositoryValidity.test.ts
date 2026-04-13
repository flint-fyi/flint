import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.repositoryValidity, {
	invalid: [
		{
			code: `{
  "repository": null
}`,
			snapshot: `{
  "repository": null
                ~~~~
                Invalid repository: the value is \`null\`, but should be an \`object\` or a \`string\`.
}`,
		},
		{
			code: `{
  "repository": 123
}`,
			snapshot: `{
  "repository": 123
                ~~~
                Invalid repository: the type should be \`object\` or \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "repository": ["git", "url"]
}`,
			snapshot: `{
  "repository": ["git", "url"]
                ~~~~~~~~~~~~~~
                Invalid repository: the type should be \`object\` or \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "repository": ""
}`,
			snapshot: `{
  "repository": ""
                ~~
                Invalid repository: the value is empty, but should be repository shorthand string.
}`,
		},
		{
			code: `{
  "repository": {
    "type": "git",
    "url": 123
  }
}`,
			snapshot: `{
  "repository": {
    "type": "git",
    "url": 123
    ~~~~~~~~~~
    Invalid repository: the value of property "url" should be a string.
  }
}`,
		},
		{
			code: `{
  "repository": {
    "directory": "packages/lib-a"
  }
}`,
			snapshot: `{
  "repository": {
                ~
                Invalid repository: repository is missing property "type", which should be the type of repository this is (e.g. "git").
                ~
                ~
                Invalid repository: repository is missing property "url", which should be the url to a repository (e.g. "git+https://github.com/npm/cli.git").
                
    "directory": "packages/lib-a"
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  }
  ~
}`,
		},
		{
			code: `{
  "repository": "svn:npm/example"
}`,
			snapshot: `{
  "repository": "svn:npm/example"
                ~~~~~~~~~~~~~~~~~
                Invalid repository: the value "svn:npm/example" is invalid; it should be the shorthand for a repository (e.g. "github:npm/example").
}`,
		},
		{
			code: `{
  "repository": "eslint-plugin-package-json"
}`,
			snapshot: `{
  "repository": "eslint-plugin-package-json"
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Invalid repository: the value "eslint-plugin-package-json" is invalid; it should be the shorthand for a repository (e.g. "github:npm/example").
}`,
		},
		{
			code: `{
  "repository": "git:npm/example"
}`,
			snapshot: `{
  "repository": "git:npm/example"
                ~~~~~~~~~~~~~~~~~
                Invalid repository: the value "git:npm/example" is invalid; it should be the shorthand for a repository (e.g. "github:npm/example").
}`,
		},
		{
			code: `{
  "repository": "github:npm/example/repo"
}`,
			snapshot: `{
  "repository": "github:npm/example/repo"
                ~~~~~~~~~~~~~~~~~~~~~~~~~
                Invalid repository: the value "github:npm/example/repo" is invalid; it should be the shorthand for a repository (e.g. "github:npm/example").
}`,
		},
		{
			code: `{
  "repository": "org/user/repo"
}`,
			snapshot: `{
  "repository": "org/user/repo"
                ~~~~~~~~~~~~~~~
                Invalid repository: the value "org/user/repo" is invalid; it should be the shorthand for a repository (e.g. "github:npm/example").
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		...[
			"git+https://github.com/michaelfaith/eslint-plugin-package-json.git",
			"https://github.com/michaelfaith/eslint-plugin-package-json",
			"https://github.com/michaelfaith/eslint-plugin-package-json.git",
			"http://github.com/michaelfaith/eslint-plugin-package-json.git",
			"git://github.com/michaelfaith/eslint-plugin-package-json.git",
			"git://github.com/michaelfaith/eslint-plugin-package-json",
			"git@github.com:michaelfaith/eslint-plugin-package-json.git",
		].flatMap((value) => [
			{
				code: `{
  "repository": {
    "type": "git",
    "url": "${value}",
    "directory": "packages/a"
  }
}`,
				name: `${value} (with directory)`,
			},
			{
				code: `{
  "repository": {
    "type": "git",
    "url": "${value}"
  }
}`,
				name: `${value} (without directory)`,
			},
		]),
		...[
			"npm/example",
			"github:npm/example",
			"gist:11081aaa281",
			"bitbucket:user/repo",
			"gitlab:user/repo",
			"github:some-user/some-repo",
			"github:user-name/repo-name",
			"some-user/some-repo",
			"user-name/repo.js",
			"bitbucket:my-org/my-repo",
			"gitlab:some.user/some.repo",
		].map((value) => ({
			code: `{
  "repository": "${value}"
}`,
			name: value,
		})),
	],
});
