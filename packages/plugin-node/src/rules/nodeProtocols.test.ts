import rule from "./nodeProtocols.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import fs from "fs";
`,
			snapshot: `
import fs from "fs";
               ~~~~
               Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import path from "path";
`,
			snapshot: `
import path from "path";
                 ~~~~~~
                 Prefer the more explicit \`node:path\` over \`path\`.
`,
		},
		{
			code: `
import { readFile } from "fs";
`,
			snapshot: `
import { readFile } from "fs";
                         ~~~~
                         Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import { promises } from "fs";
`,
			snapshot: `
import { promises } from "fs";
                         ~~~~
                         Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import * as fs from "fs";
`,
			snapshot: `
import * as fs from "fs";
                    ~~~~
                    Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import fsPromises from "fs/promises";
`,
			snapshot: `
import fsPromises from "fs/promises";
                       ~~~~~~~~~~~~~
                       Prefer the more explicit \`node:fs/promises\` over \`fs/promises\`.
`,
		},
		{
			code: `
import { readFile } from "fs/promises";
`,
			snapshot: `
import { readFile } from "fs/promises";
                         ~~~~~~~~~~~~~
                         Prefer the more explicit \`node:fs/promises\` over \`fs/promises\`.
`,
		},
		{
			code: `
import crypto from "crypto";
`,
			snapshot: `
import crypto from "crypto";
                   ~~~~~~~~
                   Prefer the more explicit \`node:crypto\` over \`crypto\`.
`,
		},
		{
			code: `
import { createHash } from "crypto";
`,
			snapshot: `
import { createHash } from "crypto";
                           ~~~~~~~~
                           Prefer the more explicit \`node:crypto\` over \`crypto\`.
`,
		},
		{
			code: `
import assert from "assert";
`,
			snapshot: `
import assert from "assert";
                   ~~~~~~~~
                   Prefer the more explicit \`node:assert\` over \`assert\`.
`,
		},
		{
			code: `
import assert from "assert/strict";
`,
			snapshot: `
import assert from "assert/strict";
                   ~~~~~~~~~~~~~~~
                   Prefer the more explicit \`node:assert/strict\` over \`assert/strict\`.
`,
		},
		{
			code: `
const fs = require("fs");
`,
			snapshot: `
const fs = require("fs");
                   ~~~~
                   Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const fs = require("fs");
`,
			snapshot: `
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const fs = require("fs");
                   ~~~~
                   Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
const path = require("path");
`,
			snapshot: `
const path = require("path");
                     ~~~~~~
                     Prefer the more explicit \`node:path\` over \`path\`.
`,
		},
		{
			code: `
const { readFile } = require("fs");
`,
			snapshot: `
const { readFile } = require("fs");
                             ~~~~
                             Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import fs = require("fs");
`,
			snapshot: `
import fs = require("fs");
                    ~~~~
                    Prefer the more explicit \`node:fs\` over \`fs\`.
`,
		},
		{
			code: `
import path = require("path");
`,
			snapshot: `
import path = require("path");
                      ~~~~~~
                      Prefer the more explicit \`node:path\` over \`path\`.
`,
		},
	],
	valid: [
		`import fs from "node:fs";`,
		`import path from "node:path";`,
		`import { readFile } from "node:fs";`,
		`import { promises } from "node:fs";`,
		`import * as fs from "node:fs";`,
		`import fsPromises from "node:fs/promises";`,
		`import { readFile } from "node:fs/promises";`,
		`import crypto from "node:crypto";`,
		`import { createHash } from "node:crypto";`,
		`import assert from "node:assert";`,
		`import assert from "node:assert/strict";`,
		`const fs = require("node:fs");`,
		`const path = require("node:path");`,
		`const { readFile } = require("node:fs");`,
		`import fs = require("node:fs");`,
		`import path = require("node:path");`,
		`import customFs from "custom-fs";`,
		`import myPath from "./my-path";`,
		`const custom = require("custom-module");`,
		`const relative = require("./relative");`,
		`
function require(moduleName: string) {}
require("path");
		`,
	],
});
