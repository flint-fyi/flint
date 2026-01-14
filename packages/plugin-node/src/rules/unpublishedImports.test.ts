import nodePath from "node:path";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unpublishedImports.ts";

const testDir = nodePath.dirname(import.meta.filename);
const fixtureDir = nodePath.join(testDir, "fixtures/unpublishedImports");
const privateFixtureDir = nodePath.join(
	testDir,
	"fixtures/unpublishedImports-private",
);
const dualFixtureDir = nodePath.join(
	testDir,
	"fixtures/unpublishedImports-dual",
);
const fileName = nodePath.join(fixtureDir, "test.ts");
const privateFileName = nodePath.join(privateFixtureDir, "test.ts");
const dualFileName = nodePath.join(dualFixtureDir, "test.ts");

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import devDep from "some-dev-dependency";
`,
			fileName,
			snapshot: `
import devDep from "some-dev-dependency";
                   ~~~~~~~~~~~~~~~~~~~~~
                   "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import { something } from "some-dev-dependency";
`,
			fileName,
			snapshot: `
import { something } from "some-dev-dependency";
                          ~~~~~~~~~~~~~~~~~~~~~
                          "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import * as devDep from "some-dev-dependency";
`,
			fileName,
			snapshot: `
import * as devDep from "some-dev-dependency";
                        ~~~~~~~~~~~~~~~~~~~~~
                        "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
export { something } from "some-dev-dependency";
`,
			fileName,
			snapshot: `
export { something } from "some-dev-dependency";
                          ~~~~~~~~~~~~~~~~~~~~~
                          "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
export * from "some-dev-dependency";
`,
			fileName,
			snapshot: `
export * from "some-dev-dependency";
              ~~~~~~~~~~~~~~~~~~~~~
              "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
const dep = require("some-dev-dependency");
`,
			fileName,
			snapshot: `
const dep = require("some-dev-dependency");
                    ~~~~~~~~~~~~~~~~~~~~~
                    "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import devDep from "some-dev-dependency/subpath";
`,
			fileName,
			snapshot: `
import devDep from "some-dev-dependency/subpath";
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import devDep from "@scope/some-dev-dependency";
`,
			fileName,
			snapshot: `
import devDep from "@scope/some-dev-dependency";
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   "@scope/some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import devDep from "@scope/some-dev-dependency/subpath";
`,
			fileName,
			snapshot: `
import devDep from "@scope/some-dev-dependency/subpath";
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   "@scope/some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import devDep = require("some-dev-dependency");
`,
			fileName,
			snapshot: `
import devDep = require("some-dev-dependency");
                        ~~~~~~~~~~~~~~~~~~~~~
                        "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import "some-dev-dependency";
`,
			fileName,
			snapshot: `
import "some-dev-dependency";
       ~~~~~~~~~~~~~~~~~~~~~
       "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
		{
			code: `
import { type Type, value } from "some-dev-dependency";
`,
			fileName,
			snapshot: `
import { type Type, value } from "some-dev-dependency";
                                 ~~~~~~~~~~~~~~~~~~~~~
                                 "some-dev-dependency" is listed in devDependencies but this file is published.
`,
		},
	],
	valid: [
		{ code: `import prodDep from "some-prod-dependency";`, fileName },
		{ code: `import { something } from "some-prod-dependency";`, fileName },
		{ code: `import * as prodDep from "some-prod-dependency";`, fileName },
		{ code: `export { something } from "some-prod-dependency";`, fileName },
		{ code: `export * from "some-prod-dependency";`, fileName },
		{ code: `const dep = require("some-prod-dependency");`, fileName },
		{ code: `import prodDep from "some-prod-dependency/subpath";`, fileName },
		{ code: `import scopedDep from "@scope/some-prod-dependency";`, fileName },
		{
			code: `import scopedDep from "@scope/some-prod-dependency/subpath";`,
			fileName,
		},
		{ code: `import fs from "node:fs";`, fileName },
		{ code: `import path from "node:path";`, fileName },
		{ code: `import fs from "fs";`, fileName },
		{ code: `import path from "path";`, fileName },
		{ code: `import local from "./local";`, fileName },
		{ code: `import parent from "../parent";`, fileName },
		{ code: `import absolute from "/absolute/path";`, fileName },
		{ code: `import peerDep from "some-peer-dependency";`, fileName },
		{ code: `import optionalDep from "some-optional-dependency";`, fileName },
		// Private packages should be skipped
		{
			code: `import devDep from "some-dev-dependency";`,
			fileName: privateFileName,
		},
		// Type-only imports
		{ code: `import type { Type } from "some-dev-dependency";`, fileName },
		{ code: `import { type Type } from "some-dev-dependency";`, fileName },
		// Unknown packages (not in any deps) - no error, not our concern
		{ code: `import unknown from "unknown-package";`, fileName },
		// Side-effect only imports from devDependencies are still flagged (tested in invalid)
		// Dual dependencies (in both dependencies and devDependencies) - no error
		{
			code: `import dual from "dual-dependency";`,
			fileName: dualFileName,
		},
	],
});
