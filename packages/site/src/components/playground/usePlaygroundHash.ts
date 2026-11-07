import {
	decodePlaygroundHash,
	encodePlaygroundHash,
	type PlaygroundState,
} from "~/playground/playgroundHash.ts";
import { useEffect, useRef, useState } from "react";

const writeDelay = 250;

export interface PlaygroundHash {
	copyLink: () => Promise<void>;
	dismissInvalidHash: () => void;
	hasInvalidHash: boolean;
	loadCount: number;
}

/**
 * Keeps the URL hash in sync with the playground's files, so links can share them.
 * The page hides the playground while a shared hash loads, to avoid flashing the default files.
 */
export function usePlaygroundHash(
	state: PlaygroundState,
	isDefaultState: boolean,
	onLoad: (state: PlaygroundState) => void,
): PlaygroundHash {
	const [hasInvalidHash, setHasInvalidHash] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [loadCount, setLoadCount] = useState(0);
	const onLoadRef = useRef(onLoad);

	onLoadRef.current = onLoad;

	useEffect(() => {
		function applyLoadedState(
			loadedState: false | PlaygroundState | undefined,
		): void {
			if (loadedState) {
				onLoadRef.current(loadedState);
				setLoadCount((count) => count + 1);
			} else if (loadedState === false) {
				history.replaceState(history.state, "", location.pathname);
			}

			setHasInvalidHash(loadedState === false);
			setIsLoaded(true);
		}

		function load(): void {
			decodePlaygroundHash(location.hash).then(applyLoadedState, () => {
				applyLoadedState(false);
			});
		}

		load();
		addEventListener("hashchange", load);

		return (): void => {
			removeEventListener("hashchange", load);
		};
	}, []);

	useEffect(() => {
		if (isLoaded) {
			document.documentElement.classList.remove("playground-loading");
		}
	}, [isLoaded, loadCount]);

	useEffect(() => {
		if (!isLoaded || isDefaultState) {
			return;
		}

		let isCancelled = false;
		const timeout = setTimeout(() => {
			encodePlaygroundHash(state).then(
				(hash) => {
					if (!isCancelled && hash !== location.hash) {
						history.replaceState(history.state, "", hash);
					}
				},
				() => {
					// Sharing is optional, so the playground keeps working without it.
				},
			);
		}, writeDelay);

		return (): void => {
			isCancelled = true;
			clearTimeout(timeout);
		};
	}, [hasInvalidHash, isDefaultState, isLoaded, state]);

	return {
		copyLink: async () => {
			// Safari only allows clipboard writes that start during a click,
			// so the link is written as a promise rather than awaited first.
			const link = encodePlaygroundHash(state).then((hash) => {
				history.replaceState(history.state, "", hash);
				return new Blob([location.href], { type: "text/plain" });
			});

			await navigator.clipboard.write([
				new ClipboardItem({ "text/plain": link }),
			]);
		},
		dismissInvalidHash: () => {
			setHasInvalidHash(false);
		},
		hasInvalidHash,
		loadCount,
	};
}
