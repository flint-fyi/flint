process.argv.push("content-mapper");
await import(new URL("../bin/vize", import.meta.resolve("vize")).href);
