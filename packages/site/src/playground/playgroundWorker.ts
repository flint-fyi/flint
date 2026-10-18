import { lintPlaygroundFiles } from "./lintPlaygroundFiles.ts";
import type { PlaygroundRequest, PlaygroundResponse } from "./types.ts";

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

function lintNextRequest(): void {
	const request = nextRequest;
	if (!request) {
		isLinting = false;
		return;
	}

	isLinting = true;
	nextRequest = undefined;

	lintPlaygroundFiles(request.files).then(
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
