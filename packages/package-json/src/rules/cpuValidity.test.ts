import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.cpuValidity, {
	invalid: [
		{
			code: `{
  "cpu": null
}`,
			snapshot: `{
  "cpu": null
         ~~~~
         Invalid cpu: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "cpu": 123
}`,
			snapshot: `{
  "cpu": 123
         ~~~
         Invalid cpu: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "cpu": {}
}`,
			snapshot: `{
  "cpu": {}
         ~~
         Invalid cpu: the type should be \`Array\`, not \`object\`.
}`,
		},
		{
			code: `{
  "cpu": "./script.js"
}`,
			snapshot: `{
  "cpu": "./script.js"
         ~~~~~~~~~~~~~
         Invalid cpu: the type should be \`Array\`, not \`string\`.
}`,
		},
		{
			code: `{
  "cpu": ["", true, 123, {}, []]
}`,
			snapshot: `{
  "cpu": ["", true, 123, {}, []]
          ~~
          Invalid cpu: item at index 0 is empty, but should be the name of a CPU architecture.
              ~~~~
              Invalid cpu: item at index 1 should be a string, not \`boolean\`.
                    ~~~
                    Invalid cpu: item at index 2 should be a string, not \`number\`.
                         ~~
                         Invalid cpu: item at index 3 should be a string, not \`object\`.
                             ~~
                             Invalid cpu: item at index 4 should be a string, not \`object\`.
}`,
		},
		{
			code: `{
  "cpu": ["silver-mt-zion", "nin"]
}`,
			snapshot: `{
  "cpu": ["silver-mt-zion", "nin"]
          ~~~~~~~~~~~~~~~~
          Invalid cpu: the value "silver-mt-zion" is not valid. Valid CPU values are: arm, arm64, ia32, loong64, mips, mipsel, ppc64, riscv64, s390, s390x, x64.
                            ~~~~~
                            Invalid cpu: the value "nin" is not valid. Valid CPU values are: arm, arm64, ia32, loong64, mips, mipsel, ppc64, riscv64, s390, s390x, x64.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "cpu": []
}`,
		},
		{
			code: `{
  "cpu": ["arm", "x64"]
}`,
		},
	],
});
