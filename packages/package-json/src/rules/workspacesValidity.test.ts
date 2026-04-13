import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.workspacesValidity, {
	invalid: [
		{
			code: `{
  "workspaces": null
}`,
			snapshot: `{
  "workspaces": null
                ~~~~
                Invalid workspaces: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "workspaces": 123
}`,
			snapshot: `{
  "workspaces": 123
                ~~~
                Invalid workspaces: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "workspaces": {}
}`,
			snapshot: `{
  "workspaces": {}
                ~~
                Invalid workspaces: the type should be \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "workspaces": []
}`,
		},
		{
			code: `{
  "workspaces": ["packages/*"]
}`,
		},
	],
});
