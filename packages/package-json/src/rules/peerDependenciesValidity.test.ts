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
  "peerDependencies": []
}`,
			snapshot: `{
  "peerDependencies": []
                      ~~
                      Invalid peerDependencies: the type should be \`object\`, not \`array\`.
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
    "react": "^18.0.0"
  }
}`,
		},
	],
});
