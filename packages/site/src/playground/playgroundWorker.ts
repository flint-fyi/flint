import { createVFSLinterHost, LintSession } from "@flint.fyi/core";
import type { PlaygroundRequest, PlaygroundResponse } from "./types.ts";
import { json } from "@flint.fyi/json";
import { ts } from "@flint.fyi/ts";
import { jsx } from "@flint.fyi/jsx";

// @typescript-eslint/project-service reads these Node.js globals when creating
// a project service, even though Flint's TypeScript server host replaces them.
if (!("setImmediate" in globalThis)) {
	Object.assign(globalThis, {
		clearImmediate: clearTimeout,
		setImmediate: setTimeout,
	});
}

let isLinting = false;
let nextRequest: PlaygroundRequest | undefined;

globalThis.addEventListener(
	"message",
	(event: MessageEvent<PlaygroundRequest>) => {
		nextRequest = event.data;

		if (!isLinting) {
			lintNextRequest();
		}
	},
);

const host = createVFSLinterHost({
	caseSensitive: true,
	cwd: "/",
});

const session = await LintSession.create({
	// todo this should be parsed dymanically from flint.config.ts to a blob
	// and packages ideally provided by an import map but i don't think it's possible from a worker??
	// Right we'll need https://github.com/guybedford/es-module-shims
	// Or webcontainers 🤔
	filePath: `/flint.config.ts`,
	use: [
		{
			files: ["**/*.json"]
		,	rules: json.presets.logical
		}, {
			files: ["**/*.{j,t}s{,x}"]
		,	rules: [ts.presets.logical, ts.presets.stylistic]
		}, {
			files: ["**/*.{j,t}sx"]
		,	rules: [jsx.presets.logical, jsx.presets.stylistic],
		},
	],
}, host);



function lintNextRequest(): void {
	const request = nextRequest;
	if (!request) {
		isLinting = false;
		return;
	}

	isLinting = true;
	nextRequest = undefined;

	 session.lintFiles(request.files.map(i => i.name)).then(
		(files) => {
			postResponse({ files, id: request.id, kind: "success" });
			lintNextRequest();
		},
		(error: unknown) => {
			postResponse({
				error: error instanceof Error ? error.message : String(error),
				id: request.id,
				kind: "failure",
			});
			lintNextRequest();
		},
	);
}

function postResponse(response: PlaygroundResponse): void {
	globalThis.postMessage(response);
}
