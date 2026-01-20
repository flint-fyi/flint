import rule from "./irregularWhitespaces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value\u00a0= 1;
`,
			snapshot: `
const value\u00a0= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u1680= 1;
`,
			snapshot: `
const value\u1680= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u2000= 1;
`,
			snapshot: `
const value\u2000= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u200b= 1;
`,
			snapshot: `
const value\u200b= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u3000= 1;
`,
			snapshot: `
const value\u3000= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u205f= 1;
`,
			snapshot: `
const value\u205f= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u202f= 1;
`,
			snapshot: `
const value\u202f= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\ufeff= 1;
`,
			snapshot: `
const value\ufeff= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u000c= 1;
`,
			snapshot: `
const value\u000c= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u000b= 1;
`,
			snapshot: `
const value\u000b= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u0085= 1;
`,
			snapshot: `
const value\u0085= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u180e= 1;
`,
			snapshot: `
const value\u180e= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const a\u00a0= 1;
const b\u00a0= 2;
`,
			snapshot: `
const a\u00a0= 1;
       ~
       Irregular whitespace characters can cause unexpected behavior and display issues.
const b\u00a0= 2;
       ~
       Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u2028= 1;
`,
			snapshot: `
const value\u2028= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value\u2029= 1;
`,
			snapshot: `
const value\u2029= 1;
           ~
           Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value = \`\u00a0\`;
`,
			snapshot: `
const value = \`\u00a0\`;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const x = 1;
const value = \`\u00a0\${x}\u00a0\`;
`,
			snapshot: `
const x = 1;
const value = \`\u00a0\${x}\u00a0\`;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
                    ~
                    Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
const value = /\u00a0/;
`,
			snapshot: `
const value = /\u00a0/;
               ~
               Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
		{
			code: `
// Comment\u00a0with irregular space
const value = 1;
`,
			snapshot: `
// Comment\u00a0with irregular space
          ~
          Irregular whitespace characters can cause unexpected behavior and display issues.
const value = 1;
`,
		},
		{
			code: `
/* Block\u00a0comment */
const value = 1;
`,
			snapshot: `
/* Block\u00a0comment */
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
			code: `const value = \`\u00a0\`;`,
			options: { skipTemplates: true },
		},
		{
			code: `const x = 1; const value = \`\u00a0\${x}\u00a0\`;`,
			options: { skipTemplates: true },
		},
		{
			code: `const value = /\u00a0/;`,
			options: { skipRegularExpressions: true },
		},
		{
			code: `// Comment\u00a0with irregular space`,
			options: { skipComments: true },
		},
		{
			code: `/* Block\u00a0comment */`,
			options: { skipComments: true },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const element = <div>\u00a0</div>;
`,
			fileName: "file.tsx",
			snapshot: `
const element = <div>\u00a0</div>;
                     ~
                     Irregular whitespace characters can cause unexpected behavior and display issues.
`,
		},
	],
	valid: [
		{
			code: `const element = <div>\u00a0</div>;`,
			fileName: "file.tsx",
			options: { skipJSXText: true },
		},
	],
});
