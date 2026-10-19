import type {
	PlaygroundFile,
	PlaygroundRequest,
	PlaygroundResponse,
} from "~/playground/types.ts";
import { useEffect, useRef, useState } from "react";

const lintDelay = 250;
const lintTimeout = 20_000;

export interface PlaygroundResponseState {
	isPending: boolean;
	response: PlaygroundResponse | undefined;
}

/**
 * Lints files in a web worker, ignoring responses for outdated files.
 * The worker is replaced if it fails to load or takes too long to lint.
 */
export function usePlaygroundResponse(
	files: PlaygroundFile[],
): PlaygroundResponseState {
	const [requestId, setRequestId] = useState(0);
	const [response, setResponse] = useState<PlaygroundResponse>();
	const cancelTimeout = useRef<() => void>(undefined);
	const latestRequestId = useRef(0);
	const workerRef = useRef<Worker>(undefined);

	function fail(error: string): void {
		workerRef.current?.terminate();
		workerRef.current = undefined;
		setResponse({ error, id: latestRequestId.current, kind: "failure" });
	}

	function getWorker(): Worker {
		if (workerRef.current) {
			return workerRef.current;
		}

		const worker = new Worker(
			new URL("../../playground/playgroundWorker.ts", import.meta.url),
			{ type: "module" },
		);

		worker.addEventListener(
			"message",
			(event: MessageEvent<PlaygroundResponse>) => {
				if (event.data.id !== latestRequestId.current) {
					return;
				}

				cancelTimeout.current?.();
				setResponse(event.data);
			},
		);

		worker.addEventListener("error", () => {
			cancelTimeout.current?.();
			fail("The playground's linter failed to load. Edit a file to retry.");
		});

		workerRef.current = worker;

		return worker;
	}

	useEffect(() => {
		getWorker();

		return (): void => {
			cancelTimeout.current?.();
			workerRef.current?.terminate();
			workerRef.current = undefined;
		};
	}, []);

	useEffect(() => {
		const id = (latestRequestId.current += 1);
		setRequestId(id);

		const delay = setTimeout(() => {
			getWorker().postMessage({ files, id } satisfies PlaygroundRequest);

			cancelTimeout.current?.();
			const timeout = setTimeout(() => {
				fail("Linting took too long, so it was stopped.");
			}, lintTimeout);
			cancelTimeout.current = (): void => {
				clearTimeout(timeout);
			};
		}, lintDelay);

		return (): void => {
			clearTimeout(delay);
		};
	}, [files]);

	return { isPending: response?.id !== requestId, response };
}
