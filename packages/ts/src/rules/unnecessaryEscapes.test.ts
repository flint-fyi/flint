import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryEscapes.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
const value = "\a";
`,
			output: `
const value = "a";
`,
			snapshot: String.raw`
const value = "\a";
               ~~
               Unnecessary escape for character 'a'.
`,
		},
		{
			code: String.raw`
const value = "\d";
`,
			output: `
const value = "d";
`,
			snapshot: String.raw`
const value = "\d";
               ~~
               Unnecessary escape for character 'd'.
`,
		},
		{
			code: String.raw`
const value = "\e";
`,
			output: `
const value = "e";
`,
			snapshot: String.raw`
const value = "\e";
               ~~
               Unnecessary escape for character 'e'.
`,
		},
		{
			code: String.raw`
const value = "\g";
`,
			output: `
const value = "g";
`,
			snapshot: String.raw`
const value = "\g";
               ~~
               Unnecessary escape for character 'g'.
`,
		},
		{
			code: String.raw`
const value = "\h";
`,
			output: `
const value = "h";
`,
			snapshot: String.raw`
const value = "\h";
               ~~
               Unnecessary escape for character 'h'.
`,
		},
		{
			code: String.raw`
const value = "\i";
`,
			output: `
const value = "i";
`,
			snapshot: String.raw`
const value = "\i";
               ~~
               Unnecessary escape for character 'i'.
`,
		},
		{
			code: String.raw`
const value = "\j";
`,
			output: `
const value = "j";
`,
			snapshot: String.raw`
const value = "\j";
               ~~
               Unnecessary escape for character 'j'.
`,
		},
		{
			code: String.raw`
const value = "\k";
`,
			output: `
const value = "k";
`,
			snapshot: String.raw`
const value = "\k";
               ~~
               Unnecessary escape for character 'k'.
`,
		},
		{
			code: String.raw`
const value = "\l";
`,
			output: `
const value = "l";
`,
			snapshot: String.raw`
const value = "\l";
               ~~
               Unnecessary escape for character 'l'.
`,
		},
		{
			code: String.raw`
const value = "\m";
`,
			output: `
const value = "m";
`,
			snapshot: String.raw`
const value = "\m";
               ~~
               Unnecessary escape for character 'm'.
`,
		},
		{
			code: String.raw`
const value = "\o";
`,
			output: `
const value = "o";
`,
			snapshot: String.raw`
const value = "\o";
               ~~
               Unnecessary escape for character 'o'.
`,
		},
		{
			code: String.raw`
const value = "\p";
`,
			output: `
const value = "p";
`,
			snapshot: String.raw`
const value = "\p";
               ~~
               Unnecessary escape for character 'p'.
`,
		},
		{
			code: String.raw`
const value = "\q";
`,
			output: `
const value = "q";
`,
			snapshot: String.raw`
const value = "\q";
               ~~
               Unnecessary escape for character 'q'.
`,
		},
		{
			code: String.raw`
const value = "\s";
`,
			output: `
const value = "s";
`,
			snapshot: String.raw`
const value = "\s";
               ~~
               Unnecessary escape for character 's'.
`,
		},
		{
			code: String.raw`
const value = "\w";
`,
			output: `
const value = "w";
`,
			snapshot: String.raw`
const value = "\w";
               ~~
               Unnecessary escape for character 'w'.
`,
		},
		{
			code: String.raw`
const value = "\y";
`,
			output: `
const value = "y";
`,
			snapshot: String.raw`
const value = "\y";
               ~~
               Unnecessary escape for character 'y'.
`,
		},
		{
			code: String.raw`
const value = "\z";
`,
			output: `
const value = "z";
`,
			snapshot: String.raw`
const value = "\z";
               ~~
               Unnecessary escape for character 'z'.
`,
		},
		{
			code: String.raw`
const value = "\A";
`,
			output: `
const value = "A";
`,
			snapshot: String.raw`
const value = "\A";
               ~~
               Unnecessary escape for character 'A'.
`,
		},
		{
			code: String.raw`
const value = '\a';
`,
			output: `
const value = 'a';
`,
			snapshot: String.raw`
const value = '\a';
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
			code: String.raw`
const value = "\#";
`,
			output: `
const value = "#";
`,
			snapshot: String.raw`
const value = "\#";
               ~~
               Unnecessary escape for character '#'.
`,
		},
		{
			code: String.raw`
const value = "\%";
`,
			output: `
const value = "%";
`,
			snapshot: String.raw`
const value = "\%";
               ~~
               Unnecessary escape for character '%'.
`,
		},
		{
			code: String.raw`
const value = "\@";
`,
			output: `
const value = "@";
`,
			snapshot: String.raw`
const value = "\@";
               ~~
               Unnecessary escape for character '@'.
`,
		},
		{
			code: String.raw`
const value = "\[";
`,
			output: `
const value = "[";
`,
			snapshot: String.raw`
const value = "\[";
               ~~
               Unnecessary escape for character '['.
`,
		},
		{
			code: String.raw`
const value = "\]";
`,
			output: `
const value = "]";
`,
			snapshot: String.raw`
const value = "\]";
               ~~
               Unnecessary escape for character ']'.
`,
		},
		{
			code: String.raw`
const value = "\{";
`,
			output: `
const value = "{";
`,
			snapshot: String.raw`
const value = "\{";
               ~~
               Unnecessary escape for character '{'.
`,
		},
		{
			code: String.raw`
const value = "\}";
`,
			output: `
const value = "}";
`,
			snapshot: String.raw`
const value = "\}";
               ~~
               Unnecessary escape for character '}'.
`,
		},
		{
			code: String.raw`
const value = "\(";
`,
			output: `
const value = "(";
`,
			snapshot: String.raw`
const value = "\(";
               ~~
               Unnecessary escape for character '('.
`,
		},
		{
			code: String.raw`
const value = "\)";
`,
			output: `
const value = ")";
`,
			snapshot: String.raw`
const value = "\)";
               ~~
               Unnecessary escape for character ')'.
`,
		},
		{
			code: String.raw`
const value = "\ ";
`,
			output: `
const value = " ";
`,
			snapshot: String.raw`
const value = "\ ";
               ~~
               Unnecessary escape for character ' '.
`,
		},
		{
			code: String.raw`
const value = "\!";
`,
			output: `
const value = "!";
`,
			snapshot: String.raw`
const value = "\!";
               ~~
               Unnecessary escape for character '!'.
`,
		},
	],
	valid: [
		String.raw`const value = "\n";`,
		String.raw`const value = "\t";`,
		String.raw`const value = "\r";`,
		String.raw`const value = "\b";`,
		String.raw`const value = "\f";`,
		String.raw`const value = "\v";`,
		String.raw`const value = "\\";`,
		String.raw`const value = "\'";`,
		String.raw`const value = "\"";`,
		String.raw`const value = "\0";`,
		String.raw`const value = "\xA9";`,
		String.raw`const value = "\uD834";`,
		String.raw`const value = "\u{1D306}";`,
		String.raw`const value = "\cA";`,
		String.raw`const value = '\n';`,
		String.raw`const value = '\t';`,
		String.raw`const value = '\\';`,
		String.raw`const value = '\'';`,
		String.raw`const value = '\"';`,
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
		String.raw`const value = "\1";`,
		String.raw`const value = "\2";`,
		String.raw`const value = "\3";`,
		String.raw`const value = "\4";`,
		String.raw`const value = "\5";`,
		String.raw`const value = "\6";`,
		String.raw`const value = "\7";`,
		String.raw`const value = "\8";`,
		String.raw`const value = "\9";`,
	],
});
