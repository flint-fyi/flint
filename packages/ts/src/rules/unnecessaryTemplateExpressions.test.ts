import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTemplateExpressions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = "test";
const result = \`\${value}\`;
`,
			snapshot: `
const value = "test";
const result = \`\${value}\`;
               ~
               This template expression can be replaced with a simpler expression.
`,
		},
		{
			code: `
const count = 42;
const message = \`\${count}\`;
`,
			snapshot: `
const count = 42;
const message = \`\${count}\`;
                ~
                This template expression can be replaced with a simpler expression.
`,
		},
		{
			code: `
function getValue() {
    return "result";
}
const output = \`\${getValue()}\`;
`,
			snapshot: `
function getValue() {
    return "result";
}
const output = \`\${getValue()}\`;
               ~
               This template expression can be replaced with a simpler expression.
`,
		},
		{
			code: `
const identifier = true;
const text = \`\${identifier}\`;
`,
			snapshot: `
const identifier = true;
const text = \`\${identifier}\`;
             ~
             This template expression can be replaced with a simpler expression.
`,
		},
	],
	valid: [
		`const message = \`Hello \${name}\`;`,
		`const message = \`\${firstName} \${lastName}\`;`,
		`const message = \`Value: \${value}\`;`,
		`const message = \`\${value} is the result\`;`,
		`const plain = "just a string";`,
		`const plain = \`just a template\`;`,
		`
const name = "World";
const greeting = \`Hello \${name}!\`;
`,
		`
const first = "John";
const last = "Doe";
const full = \`\${first} \${last}\`;
`,
	],
});
