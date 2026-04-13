import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.typeValidity, {
	invalid: [
		{
			code: `{
  "type": null
}`,
			snapshot: `{
  "type": null
          ~~~~
          Invalid type: the value is \`null\`, but should be a \`string\`.
}`,
		},
		{
			code: `{
  "type": 123
}`,
			snapshot: `{
  "type": 123
          ~~~
          Invalid type: the type should be a \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "type": {}
}`,
			snapshot: `{
  "type": {}
          ~~
          Invalid type: the type should be a \`string\`, not \`object\`.
}`,
		},
		{
			code: `{
  "type": []
}`,
			snapshot: `{
  "type": []
          ~~
          Invalid type: the type should be a \`string\`, not \`array\`.
}`,
		},
		{
			code: `{
  "type": true
}`,
			snapshot: `{
  "type": true
          ~~~~
          Invalid type: the type should be a \`string\`, not \`boolean\`.
}`,
		},
		{
			code: `{
  "type": ""
}`,
			snapshot: `{
  "type": ""
          ~~
          Invalid type: the value is empty, but should be one of: commonjs, module.
}`,
		},
		{
			code: `{
  "type": "   "
}`,
			snapshot: `{
  "type": "   "
          ~~~~~
          Invalid type: the value is empty, but should be one of: commonjs, module.
}`,
		},
		{
			code: `{
  "type": "esm"
}`,
			snapshot: `{
  "type": "esm"
          ~~~~~
          Invalid type: the value "esm" is not valid. Valid types are: commonjs, module.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "type": "module"
}`,
		},
		{
			code: `{
  "type": "commonjs"
}`,
		},
	],
});
