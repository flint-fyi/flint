import { runPlayground } from "./runPlayground.ts";
import type {
	PlaygroundFailure,
	PlaygroundRequest,
	PlaygroundResult,
} from "./types.ts";

globalThis.addEventListener(
	"message",
	({ data }: MessageEvent<PlaygroundRequest>) => {
		try {
			const result: PlaygroundResult = runPlayground(
				data.files,
				data.activePath,
				data.requestId,
			);
			globalThis.postMessage(result);
		} catch (error) {
			const failure: PlaygroundFailure = {
				error: error instanceof Error ? error.message : String(error),
				requestId: data.requestId,
			};
			globalThis.postMessage(failure);
		}
	},
);
