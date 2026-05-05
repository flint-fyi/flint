import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryEscapes.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = "\\a";
`,
			output: `
const value = "a";
`,
			snapshot: `
const value = "\\a";
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = "\\d";
`,
			output: `
const value = "d";
`,
			snapshot: `
const value = "\\d";
               ~~
               Unnecessary escape for character 'd'.
`,
		},
		{
			code: `
const value = "\\e";
`,
			output: `
const value = "e";
`,
			snapshot: `
const value = "\\e";
               ~~
               Unnecessary escape for character 'e'.
`,
		},
		{
			code: `
const value = "\\g";
`,
			output: `
const value = "g";
`,
			snapshot: `
const value = "\\g";
               ~~
               Unnecessary escape for character 'g'.
`,
		},
		{
			code: `
const value = "\\h";
`,
			output: `
const value = "h";
`,
			snapshot: `
const value = "\\h";
               ~~
               Unnecessary escape for character 'h'.
`,
		},
		{
			code: `
const value = "\\i";
`,
			output: `
const value = "i";
`,
			snapshot: `
const value = "\\i";
               ~~
               Unnecessary escape for character 'i'.
`,
		},
		{
			code: `
const value = "\\j";
`,
			output: `
const value = "j";
`,
			snapshot: `
const value = "\\j";
               ~~
               Unnecessary escape for character 'j'.
`,
		},
		{
			code: `
const value = "\\k";
`,
			output: `
const value = "k";
`,
			snapshot: `
const value = "\\k";
               ~~
               Unnecessary escape for character 'k'.
`,
		},
		{
			code: `
const value = "\\l";
`,
			output: `
const value = "l";
`,
			snapshot: `
const value = "\\l";
               ~~
               Unnecessary escape for character 'l'.
`,
		},
		{
			code: `
const value = "\\m";
`,
			output: `
const value = "m";
`,
			snapshot: `
const value = "\\m";
               ~~
               Unnecessary escape for character 'm'.
`,
		},
		{
			code: `
const value = "\\o";
`,
			output: `
const value = "o";
`,
			snapshot: `
const value = "\\o";
               ~~
               Unnecessary escape for character 'o'.
`,
		},
		{
			code: `
const value = "\\p";
`,
			output: `
const value = "p";
`,
			snapshot: `
const value = "\\p";
               ~~
               Unnecessary escape for character 'p'.
`,
		},
		{
			code: `
const value = "\\q";
`,
			output: `
const value = "q";
`,
			snapshot: `
const value = "\\q";
               ~~
               Unnecessary escape for character 'q'.
`,
		},
		{
			code: `
const value = "\\s";
`,
			output: `
const value = "s";
`,
			snapshot: `
const value = "\\s";
               ~~
               Unnecessary escape for character 's'.
`,
		},
		{
			code: `
const value = "\\w";
`,
			output: `
const value = "w";
`,
			snapshot: `
const value = "\\w";
               ~~
               Unnecessary escape for character 'w'.
`,
		},
		{
			code: `
const value = "\\y";
`,
			output: `
const value = "y";
`,
			snapshot: `
const value = "\\y";
               ~~
               Unnecessary escape for character 'y'.
`,
		},
		{
			code: `
const value = "\\z";
`,
			output: `
const value = "z";
`,
			snapshot: `
const value = "\\z";
               ~~
               Unnecessary escape for character 'z'.
`,
		},
		{
			code: `
const value = "\\A";
`,
			output: `
const value = "A";
`,
			snapshot: `
const value = "\\A";
               ~~
               Unnecessary escape for character 'A'.
`,
		},
		{
			code: `
const value = '\\a';
`,
			output: `
const value = 'a';
`,
			snapshot: `
const value = '\\a';
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = \`\\a\`;
`,
			output: `
const value = \`a\`;
`,
			snapshot: `
const value = \`\\a\`;
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = \`before \\a after\`;
`,
			output: `
const value = \`before a after\`;
`,
			snapshot: `
const value = \`before \\a after\`;
                      ~~
                      Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = \`\${x} \\a\`;
`,
			output: `
const value = \`\${x} a\`;
`,
			snapshot: `
const value = \`\${x} \\a\`;
                    ~~
                    Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = \`\\a \${x}\`;
`,
			output: `
const value = \`a \${x}\`;
`,
			snapshot: `
const value = \`\\a \${x}\`;
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = \`\\a \${x} \\b\`;
`,
			output: `
const value = \`a \${x} \\b\`;
`,
			snapshot: `
const value = \`\\a \${x} \\b\`;
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: `
const value = "\\#";
`,
			output: `
const value = "#";
`,
			snapshot: `
const value = "\\#";
               ~~
               Unnecessary escape for character '#'.
`,
		},
		{
			code: `
const value = "\\%";
`,
			output: `
const value = "%";
`,
			snapshot: `
const value = "\\%";
               ~~
               Unnecessary escape for character '%'.
`,
		},
		{
			code: `
const value = "\\@";
`,
			output: `
const value = "@";
`,
			snapshot: `
const value = "\\@";
               ~~
               Unnecessary escape for character '@'.
`,
		},
		{
			code: `
const value = "\\[";
`,
			output: `
const value = "[";
`,
			snapshot: `
const value = "\\[";
               ~~
               Unnecessary escape for character '['.
`,
		},
		{
			code: `
const value = "\\]";
`,
			output: `
const value = "]";
`,
			snapshot: `
const value = "\\]";
               ~~
               Unnecessary escape for character ']'.
`,
		},
		{
			code: `
const value = "\\{";
`,
			output: `
const value = "{";
`,
			snapshot: `
const value = "\\{";
               ~~
               Unnecessary escape for character '{'.
`,
		},
		{
			code: `
const value = "\\}";
`,
			output: `
const value = "}";
`,
			snapshot: `
const value = "\\}";
               ~~
               Unnecessary escape for character '}'.
`,
		},
		{
			code: `
const value = "\\(";
`,
			output: `
const value = "(";
`,
			snapshot: `
const value = "\\(";
               ~~
               Unnecessary escape for character '('.
`,
		},
		{
			code: `
const value = "\\)";
`,
			output: `
const value = ")";
`,
			snapshot: `
const value = "\\)";
               ~~
               Unnecessary escape for character ')'.
`,
		},
		{
			code: `
const value = "\\ ";
`,
			output: `
const value = " ";
`,
			snapshot: `
const value = "\\ ";
               ~~
               Unnecessary escape for character ' '.
`,
		},
		{
			code: `
const value = "\\!";
`,
			output: `
const value = "!";
`,
			snapshot: `
const value = "\\!";
               ~~
               Unnecessary escape for character '!'.
`,
		},
	],
	valid: [
		`const value = "\\n";`,
		`const value = "\\t";`,
		`const value = "\\r";`,
		`const value = "\\b";`,
		`const value = "\\f";`,
		`const value = "\\v";`,
		`const value = "\\\\";`,
		`const value = "\\'";`,
		`const value = "\\"";`,
		`const value = "\\0";`,
		`const value = "\\xA9";`,
		`const value = "\\uD834";`,
		`const value = "\\u{1D306}";`,
		`const value = "\\cA";`,
		`const value = '\\n';`,
		`const value = '\\t';`,
		`const value = '\\\\';`,
		`const value = '\\'';`,
		`const value = '\\"';`,
		`const value = \`\\n\`;`,
		`const value = \`\\t\`;`,
		`const value = \`\\\\\`;`,
		`const value = \`\\'\`;`,
		`const value = \`\\"\`;`,
		`const value = \`\\\`\`;`,
		`const value = "plain text";`,
		`const value = 'plain text';`,
		`const value = \`plain text\`;`,
		`const value = \`\${variable}\`;`,
		`const value = "\\1";`,
		`const value = "\\2";`,
		`const value = "\\3";`,
		`const value = "\\4";`,
		`const value = "\\5";`,
		`const value = "\\6";`,
		`const value = "\\7";`,
		`const value = "\\8";`,
		`const value = "\\9";`,
	],
});
