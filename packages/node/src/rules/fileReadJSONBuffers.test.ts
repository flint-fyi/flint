import rule from "./fileReadJSONBuffers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import * as fs from "node:fs/promises";
const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
`,
			snapshot: `
import * as fs from "node:fs/promises";
const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
                                                                   ~~~~~~
                                                                   Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./data.json', 'utf-8'));
`,
			snapshot: `
import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./data.json', 'utf-8'));
                                                         ~~~~~~~
                                                         Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
import * as fs from "node:fs";
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
`,
			snapshot: `
import * as fs from "node:fs";
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
                                                           ~~~~~~
                                                           Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
import * as fs from "node:fs";
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
`,
			snapshot: `
import * as fs from "node:fs";
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
                                                               ~~~~~~~
                                                               Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'utf8'}));
`,
			snapshot: `
import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'utf8'}));
                                                         ~~~~~~~~~~~~~~~~~~
                                                         Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
		{
			code: `
import * as fs from "node:fs";
const config = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf-8'}));
`,
			snapshot: `
import * as fs from "node:fs";
const config = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf-8'}));
                                                           ~~~~~~~~~~~~~~~~~~~
                                                           Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.
`,
		},
	],
	valid: [
		`import * as fs from "node:fs/promises";
const packageJson = JSON.parse((await fs.readFile('./package.json')).toString());`,
		`import * as fs from "node:fs";
const data = JSON.parse(fs.readFileSync('./data.json').toString());`,
		`import * as fs from "node:fs/promises";
declare const signal: AbortSignal;
const promise = fs.readFile('./package.json', {encoding: 'utf8', signal});`,
		`import * as fs from "node:fs/promises";
const text = await fs.readFile('./file.txt', 'utf8');`,
		`import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./file.json', 'latin1'));`,
		`import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./file.json', 'ascii'));`,
		`import * as fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile('./file.json', {encoding: 'latin1'}));`,
		`JSON.parse('{"key": "value"}');`,
		`import * as fs from "node:fs";
const text = fs.readFileSync('./file.txt', 'utf8');`,
		`import * as fs from "node:fs/promises";
const promise = fs.readFile('./package.json', 'utf8'); const data = JSON.parse(await promise);`,
		`declare const customReader: any;
const data = JSON.parse(await customReader.readFile('./file.json', 'utf8'));
export {};`,
	],
});
