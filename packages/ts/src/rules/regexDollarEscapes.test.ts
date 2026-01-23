import rule from "./regexDollarEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"price".replace(/p/, "$");
`,
			output: `
"price".replace(/p/, "$$");
`,
			snapshot: `
"price".replace(/p/, "$");
                      ~
                      This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(/a/v, "$");
`,
			output: `
"abc".replace(/a/v, "$$");
`,
			snapshot: `
"abc".replace(/a/v, "$");
                     ~
                     This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replaceAll(/a/g, "$");
`,
			output: `
"abc".replaceAll(/a/g, "$$");
`,
			snapshot: `
"abc".replaceAll(/a/g, "$");
                        ~
                        This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(/./, "$ $$ $");
`,
			output: `
"abc".replace(/./, "$$ $$ $$");
`,
			snapshot: `
"abc".replace(/./, "$ $$ $");
                    ~
                    This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
                         ~
                         This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(/(?<name>.)/, "$<name> $");
`,
			output: `
"abc".replace(/(?<name>.)/, "$<name> $$");
`,
			snapshot: `
"abc".replace(/(?<name>.)/, "$<name> $");
                                     ~
                                     This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(/./, "$x");
`,
			output: `
"abc".replace(/./, "$$x");
`,
			snapshot: `
"abc".replace(/./, "$x");
                    ~
                    This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(new RegExp("."), "$");
`,
			output: `
"abc".replace(new RegExp("."), "$$");
`,
			snapshot: `
"abc".replace(new RegExp("."), "$");
                                ~
                                This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(RegExp("."), "$");
`,
			output: `
"abc".replace(RegExp("."), "$$");
`,
			snapshot: `
"abc".replace(RegExp("."), "$");
                            ~
                            This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
		{
			code: `
"abc".replace(/(?<name>.)/, "$<name");
`,
			output: `
"abc".replace(/(?<name>.)/, "$$<name");
`,
			snapshot: `
"abc".replace(/(?<name>.)/, "$<name");
                             ~
                             This unescaped \`$\` is an invalid substitution pattern matcher. Use \`$$\` to represent a literal \`$\` in replacement strings.
`,
		},
	],
	valid: [
		`"abc".replace(/a/, "$$");`,
		`"abc".foo(/./, "$");`,
		`"abc".replace(/./, variable);`,
		`"abc".replace(foo, "$");`,
		`foo.replace(/./, "$");`,
		`"abc".replace(/./, "$&$&");`,
		`"abc".replace(/./, "$\`$'");`,
		`"abc".replace(/(.)/, "$1");`,
		`"abc".replace(/(?<name>.)/, "$<name>");`,
		String.raw`"abc".replace(/[a]/v, "$$");`,
		`"abc".replace(/./, "$1$2");`,
		`"abc".replace(/./, "$99");`,
		`"abc".replace("a", "$");`,
	],
});
