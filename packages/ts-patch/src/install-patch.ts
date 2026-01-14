import fs from "node:fs";
import { createRequire } from "node:module";

import { transformTscContent } from "./shared.ts";

const require = createRequire(import.meta.url);
const typescriptPath = require.resolve("typescript");

const originalReadFileSync = fs.readFileSync;
// @ts-expect-error - TypeScript doesn't understand that the overloads do match up.
fs.readFileSync = (...args) => {
	const res = originalReadFileSync(...args);
	if (args[0] === typescriptPath) {
		return transformTscContent(res.toString());
	}
	return res;
};
require("typescript");
fs.readFileSync = originalReadFileSync;
