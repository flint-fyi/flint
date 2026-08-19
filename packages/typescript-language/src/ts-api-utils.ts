import { createRequire } from "node:module";

import type * as tsutils from "ts-api-utils";

// ts-api-utils' ESM build imports `typescript`, which makes Node run
// cjs-module-lexer over all ~9MB of it. Its CJS build `require`s TypeScript
// instead, reusing the instance already in the require cache.
const require = createRequire(import.meta.url);

const tsApiUtils = require("ts-api-utils") as typeof tsutils;

export default tsApiUtils;
