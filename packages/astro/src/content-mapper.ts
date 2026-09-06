import { runAstroContentMapper } from "@flint.fyi/astro-language/content-mapper";

// This file is the exec'd entry for the content mapper, so it must actively
// start the server rather than relying on the language package's main-module
// guard (which never matches when re-exported through this wrapper).
await runAstroContentMapper();
