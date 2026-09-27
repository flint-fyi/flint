import { runSvelteContentMapper } from "@flint.fyi/svelte-language/content-mapper";

// This file is the exec'd entry for the content mapper, so it must actively
// start the server: the language package's own entry guard never matches when
// re-exported through this wrapper.
await runSvelteContentMapper();
