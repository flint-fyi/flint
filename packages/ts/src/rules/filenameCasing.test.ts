import rule from "./filenameCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1;
`,
			fileName: "myFile.ts",
			snapshot: `


Filename \`myFile.ts\` does not match kebab case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "MyFile.ts",
			snapshot: `


Filename \`MyFile.ts\` does not match kebab case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "my_file.ts",
			snapshot: `


Filename \`my_file.ts\` does not match kebab case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "myFile.test.ts",
			snapshot: `


Filename \`myFile.test.ts\` does not match kebab case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "my-file.ts",
			options: { cases: { camelCase: true } },
			snapshot: `


Filename \`my-file.ts\` does not match camel case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "my-file.ts",
			options: { cases: { pascalCase: true } },
			snapshot: `


Filename \`my-file.ts\` does not match pascal case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "my-file.ts",
			options: { cases: { snakeCase: true } },
			snapshot: `


Filename \`my-file.ts\` does not match snake case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "my-file.ts",
			options: { cases: { camelCase: true, pascalCase: true } },
			snapshot: `


Filename \`my-file.ts\` does not match camel case or pascal case.
const value = 1;
`,
		},
		{
			code: `
const value = 1;
`,
			fileName: "MyComponent.test.ts",
			options: { multipleFileExtensions: false },
			snapshot: `


Filename \`MyComponent.test.ts\` does not match kebab case.
const value = 1;
`,
		},
	],
	valid: [
		{ code: `const value = 1;`, fileName: "my-file.ts" },
		{ code: `const value = 1;`, fileName: "my-file.test.ts" },
		{ code: `const value = 1;`, fileName: "index.ts" },
		{ code: `const value = 1;`, fileName: "index.tsx" },
		{
			code: `const value = 1;`,
			fileName: "myFile.ts",
			options: { cases: { camelCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "MyFile.ts",
			options: { cases: { pascalCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "my_file.ts",
			options: { cases: { snakeCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "_private.ts",
			options: { cases: { camelCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "__setup.ts",
			options: { cases: { camelCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "MyComponent.ts",
			options: { cases: { camelCase: true, pascalCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "myComponent.ts",
			options: { cases: { camelCase: true, pascalCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "CHANGELOG.ts",
			options: { ignore: ["^CHANGELOG"] },
		},
		{
			code: `const value = 1;`,
			fileName: "MyComponent.test.ts",
			options: { cases: { pascalCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "my-component.test-utils.ts",
		},
		{ code: `const value = 1;`, fileName: "file.ts" },
		{ code: `const value = 1;`, fileName: "file.d.ts" },
		{
			code: `const value = 1;`,
			fileName: "my_long_file_name.ts",
			options: { cases: { snakeCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "myLongFileName.ts",
			options: { cases: { camelCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "MyLongFileName.ts",
			options: { cases: { pascalCase: true } },
		},
		{
			code: `const value = 1;`,
			fileName: "my-long-file-name.ts",
		},
		{
			code: `const value = 1;`,
			fileName: "___.ts",
		},
		{
			code: `const value = 1;`,
			fileName: "___private.ts",
			options: { cases: { camelCase: true } },
		},
	],
});
