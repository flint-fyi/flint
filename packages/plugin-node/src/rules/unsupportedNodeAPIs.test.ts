import { ruleTester } from "./ruleTester.ts";
import rule from "./unsupportedNodeAPIs.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import * as fs from "fs/promises";
`,
			options: { minVersion: "8.0.0" },
			snapshot: `
import * as fs from "fs/promises";
                    ~~~~~~~~~~~~~
                    The \`fs/promises\` API is not available in Node.js 8.0.0.
`,
		},
		{
			code: `
import fsPromises from "node:fs/promises";
`,
			options: { minVersion: "9.0.0" },
			snapshot: `
import fsPromises from "node:fs/promises";
                       ~~~~~~~~~~~~~~~~~~
                       The \`fs/promises\` API is not available in Node.js 9.0.0.
`,
		},
		{
			code: `
import * as timers from "timers/promises";
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
import * as timers from "timers/promises";
                        ~~~~~~~~~~~~~~~~~
                        The \`timers/promises\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as test from "node:test";
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
import * as test from "node:test";
                      ~~~~~~~~~~~
                      The \`test\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
const fs = require("fs/promises");
`,
			options: { minVersion: "8.0.0" },
			snapshot: `
const fs = require("fs/promises");
                   ~~~~~~~~~~~~~
                   The \`fs/promises\` API is not available in Node.js 8.0.0.
`,
		},
		{
			code: `
const test = require("node:test");
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
const test = require("node:test");
                     ~~~~~~~~~~~
                     The \`test\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
import * as fs from "fs";
fs.promises;
`,
			options: { minVersion: "8.0.0" },
			snapshot: `
import * as fs from "fs";
fs.promises;
~~~~~~~~~~~
The \`fs.promises\` API is not available in Node.js 8.0.0.
`,
		},
		{
			code: `
import * as fs from "node:fs";
fs.rm("file.txt");
`,
			options: { minVersion: "12.0.0" },
			snapshot: `
import * as fs from "node:fs";
fs.rm("file.txt");
~~~~~
The \`fs.rm\` API is not available in Node.js 12.0.0.
`,
		},
		{
			code: `
import * as fs from "fs";
fs.promises.rm("file.txt");
`,
			options: { minVersion: "12.0.0" },
			snapshot: `
import * as fs from "fs";
fs.promises.rm("file.txt");
~~~~~~~~~~~~~~
The \`fs.promises.rm\` API is not available in Node.js 12.0.0.
`,
		},
		{
			code: `
const fs = require("fs");
fs.cp("source", "dest");
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
const fs = require("fs");
fs.cp("source", "dest");
~~~~~
The \`fs.cp\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as crypto from "crypto";
crypto.webcrypto;
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
import * as crypto from "crypto";
crypto.webcrypto;
~~~~~~~~~~~~~~~~
The \`crypto.webcrypto\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as crypto from "node:crypto";
crypto.randomUUID();
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
import * as crypto from "node:crypto";
crypto.randomUUID();
~~~~~~~~~~~~~~~~~
The \`crypto.randomUUID\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as stream from "stream";
stream.promises;
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
import * as stream from "stream";
stream.promises;
~~~~~~~~~~~~~~~
The \`stream.promises\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as util from "util";
util.parseArgs({});
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
import * as util from "util";
util.parseArgs({});
~~~~~~~~~~~~~~
The \`util.parseArgs\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
globalThis.value;
`,
			options: { minVersion: "10.0.0" },
			snapshot: `
globalThis.value;
~~~~~~~~~~
The \`globalThis\` API is not available in Node.js 10.0.0.
`,
		},
		{
			code: `
const value = globalThis;
`,
			options: { minVersion: "10.0.0" },
			snapshot: `
const value = globalThis;
              ~~~~~~~~~~
              The \`globalThis\` API is not available in Node.js 10.0.0.
`,
		},
		{
			code: `
new Blob([]);
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
new Blob([]);
    ~~~~
    The \`Blob\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
fetch("https://example.com");
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
fetch("https://example.com");
~~~~~
The \`fetch\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
const response = new Response("body");
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
const response = new Response("body");
                     ~~~~~~~~
                     The \`Response\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
structuredClone({ value: 1 });
`,
			options: { minVersion: "16.0.0" },
			snapshot: `
structuredClone({ value: 1 });
~~~~~~~~~~~~~~~
The \`structuredClone\` API is not available in Node.js 16.0.0.
`,
		},
		{
			code: `
const encoded = atob("dGVzdA==");
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
const encoded = atob("dGVzdA==");
                ~~~~
                The \`atob\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
const channel = new BroadcastChannel("test");
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
const channel = new BroadcastChannel("test");
                    ~~~~~~~~~~~~~~~~
                    The \`BroadcastChannel\` API is not available in Node.js 14.0.0.
`,
		},
		{
			code: `
import * as process from "process";
process.loadEnvFile();
`,
			options: { minVersion: "20.0.0" },
			snapshot: `
import * as process from "process";
process.loadEnvFile();
~~~~~~~~~~~~~~~~~~~
The \`process.loadEnvFile\` API is not available in Node.js 20.0.0.
`,
		},
		{
			code: `
import * as buffer from "buffer";
buffer.Blob;
`,
			options: { minVersion: "14.0.0" },
			snapshot: `
import * as buffer from "buffer";
buffer.Blob;
~~~~~~~~~~~
The \`buffer.Blob\` API is not available in Node.js 14.0.0.
`,
		},
	],
	valid: [
		{
			code: `import * as fs from "fs/promises";`,
			options: { minVersion: "10.0.0" },
		},
		{
			code: `import * as fs from "node:fs/promises";`,
			options: { minVersion: "14.0.0" },
		},
		{
			code: `import * as test from "node:test";`,
			options: { minVersion: "18.0.0" },
		},
		{
			code: `const fs = require("fs/promises");`,
			options: { minVersion: "10.0.0" },
		},
		{
			code: `
import * as fs from "fs";
fs.promises;
`,
			options: { minVersion: "10.0.0" },
		},
		{
			code: `
import * as fs from "fs";
fs.rm("file.txt");
`,
			options: { minVersion: "14.14.0" },
		},
		{
			code: `
import * as fs from "fs";
fs.promises.rm("file.txt");
`,
			options: { minVersion: "14.14.0" },
		},
		{
			code: `
import * as crypto from "crypto";
crypto.webcrypto;
`,
			options: { minVersion: "15.0.0" },
		},
		{
			code: `globalThis.value;`,
			options: { minVersion: "12.0.0" },
		},
		{
			code: `new Blob([]);`,
			options: { minVersion: "15.7.0" },
		},
		{
			code: `fetch("https://example.com");`,
			options: { minVersion: "18.0.0" },
		},
		{
			code: `structuredClone({ value: 1 });`,
			options: { minVersion: "17.0.0" },
		},
		// Non-Node.js modules should be ignored
		{
			code: `import * as fs from "fs-extra";`,
			options: { minVersion: "8.0.0" },
		},
		{
			code: `const fs = require("fs-extra");`,
			options: { minVersion: "8.0.0" },
		},
		// Same-named user variables should not be flagged
		{
			code: `
const fetch = () => {};
fetch();
export {};
`,
			options: { minVersion: "14.0.0" },
		},
		{
			code: `
import fs from "fs";
fs.readFile("file.txt");
`,
			options: { minVersion: "8.0.0" },
		},
		// Regular fs methods that have been available for a long time
		{
			code: `
import * as fs from "fs";
fs.readFileSync("file.txt");
`,
			options: { minVersion: "8.0.0" },
		},
		// Base module imports should not be flagged (only subpaths)
		{
			code: `import * as crypto from "crypto";`,
			options: { minVersion: "8.0.0" },
		},
		{
			code: `import * as stream from "node:stream";`,
			options: { minVersion: "8.0.0" },
		},
		// Dynamic require is not flagged (can't track)
		{
			code: `
const moduleName = "fs";
const fs = require(moduleName);
`,
			options: { minVersion: "8.0.0" },
		},
	],
});
