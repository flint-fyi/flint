import rule from "./fileReadJSONBuffers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
`,
			snapshot: `
const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
                                                                   ~~~~~~
                                                                   Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
const data = JSON.parse(await fs.readFile('./data.json', 'utf-8'));
`,
			snapshot: `
const data = JSON.parse(await fs.readFile('./data.json', 'utf-8'));
                                                         ~~~~~~~
                                                         Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
`,
			snapshot: `
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
                                                           ~~~~~~
                                                           Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
`,
			snapshot: `
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
                                                               ~~~~~~~
                                                               Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'utf8'}));
`,
			snapshot: `
const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'utf8'}));
                                                         ~~~~~~~~~~~~~~~~~~
                                                         Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
const config = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf-8'}));
`,
			snapshot: `
const config = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf-8'}));
                                                           ~~~~~~~~~~~~~~~~~~~
                                                           Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
	],
	valid: [
		`const packageJson = JSON.parse(await fs.readFile('./package.json'));`,
		`const data = JSON.parse(fs.readFileSync('./data.json'));`,
		`const promise = fs.readFile('./package.json', {encoding: 'utf8', signal});`,
		`const text = await fs.readFile('./file.txt', 'utf8');`,
		`const data = JSON.parse(await fs.readFile('./file.json', 'buffer'));`,
		`const data = JSON.parse(await fs.readFile('./file.json', 'gbk'));`,
		`const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'gbk'}));`,
		`JSON.parse('{"key": "value"}');`,
		`const text = fs.readFileSync('./file.txt', 'utf8');`,
		`const promise = fs.readFile('./package.json', 'utf8'); const data = JSON.parse(await promise);`,
		`const data = JSON.parse(await customReader.readFile('./file.json', 'utf8'));`,
	],
});
