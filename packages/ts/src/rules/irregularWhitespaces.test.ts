import rule from "./irregularWhitespaces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value\u{A0}= 1;
`,
			snapshot: `
const value\u{A0}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{1680}= 1;
`,
			snapshot: `
const value\u{1680}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{2000}= 1;
`,
			snapshot: `
const value\u{2000}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{200B}= 1;
`,
			snapshot: `
const value\u{200B}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{3000}= 1;
`,
			snapshot: `
const value\u{3000}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{205F}= 1;
`,
			snapshot: `
const value\u{205F}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{202F}= 1;
`,
			snapshot: `
const value\u{202F}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{FEFF}= 1;
`,
			snapshot: `
const value\u{FEFF}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{C}= 1;
`,
			snapshot: `
const value\u{C}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{B}= 1;
`,
			snapshot: `
const value\u{B}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{85}= 1;
`,
			snapshot: `
const value\u{85}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{180E}= 1;
`,
			snapshot: `
const value\u{180E}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const a\u{A0}= 1;
const b\u{A0}= 2;
`,
			snapshot: `
const a\u{A0}= 1;
       ~
       Irregular whitespace characters can cause unexpected behavior and display issues.
const b\u{A0}= 2;
       ~
       Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{2028}= 1;
`,
			snapshot: `
const value\u{2028}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u{2029}= 1;
`,
			snapshot: `
const value\u{2029}= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value = \`\u{A0}\`;
`,
			snapshot: `
const value = \`\u{A0}\`;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const x = 1;
const value = \`\u{A0}\${x}\u{A0}\`;
`,
			snapshot: `
const x = 1;
const value = \`\u{A0}\${x}\u{A0}\`;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
                    ~
                    Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value = /\u{A0}/;
`,
			snapshot: `
const value = /\u{A0}/;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
// Comment\u{A0}with irregular space
const value = 1;
`,
			snapshot: `
// Comment\u{A0}with irregular space
          ~
          Irregular whitespace characters can cause unexpected behavior and display issues.
const value = 1;
`,
		},
		{
			code: `
/* Block\u{A0}comment */
const value = 1;
`,
			snapshot: `
/* Block\u{A0}comment */
        ~
        Irregular whitespace characters can cause unexpected behavior and display issues.
const value = 1;
`,
		},
	],
	valid: [
		`const value = 1;`,
		`const value = "text with spaces";`,
		`const value = \`template literal\`;`,
		`const value = /regular expression/;`,
		`// Comment with regular spaces`,
		`/* Block comment */`,
		{
			code: `const value = \`\u{A0}\`;`,
			options: { skipTemplates: true },
		},
		{
			code: `const x = 1; const value = \`\u{A0}\${x}\u{A0}\`;`,
			options: { skipTemplates: true },
		},
		{
			code: `const value = /\u{A0}/;`,
			options: { skipRegularExpressions: true },
		},
		{
			code: `// Comment\u{A0}with irregular space`,
			options: { skipComments: true },
		},
		{
			code: `/* Block\u{A0}comment */`,
			options: { skipComments: true },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const element = <div>\u{A0}</div>;
`,
			fileName: "file.tsx",
			snapshot: `
const element = <div>\u{A0}</div>;
                     ~
                     Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
	],
	valid: [
		{
			code: `const element = <div>\u{A0}</div>;`,
			fileName: "file.tsx",
			options: { skipJSXText: true },
		},
	],
});
