import {
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
	type CSSProperties,
	type RefObject,
} from "react";

import type { PlaygroundSeparatorProps } from "./PlaygroundSeparator.tsx";

type Orientation = PlaygroundSeparatorProps["orientation"];

// Wide layouts place panes side by side, separated by vertical dividers.
const wideQuery = "(width >= 50rem)";

const defaultEditorFraction = 0.55;
const editorFractionBounds = [0.2, 0.8] as const;

const defaultFilesSizes: Record<Orientation, number> = {
	horizontal: 112,
	vertical: 200,
};
const filesSizeBounds: Record<Orientation, readonly [number, number]> = {
	horizontal: [64, 320],
	vertical: [120, 400],
};

export interface PlaygroundLayout {
	editorRef: RefObject<HTMLElement | null>;
	editorSeparator: PlaygroundSeparatorProps;
	filesSeparator: PlaygroundSeparatorProps;
	outputRef: RefObject<HTMLElement | null>;
	style: CSSProperties;
}

export function usePlaygroundLayout(): PlaygroundLayout {
	const orientation: Orientation = useSyncExternalStore(
		subscribeToWideQuery,
		() => (matchMedia(wideQuery).matches ? "vertical" : "horizontal"),
		() => "vertical",
	);
	const [editorFraction, setEditorFraction] = useState(defaultEditorFraction);
	const [filesSizes, setFilesSizes] = useState(defaultFilesSizes);
	const keyboardInset = useKeyboardInset();
	const editorRef = useRef<HTMLElement>(null);
	const outputRef = useRef<HTMLElement>(null);
	const resizeStart = useRef({ editorSize: 0, filesSize: 0, total: 0 });
	const filesSize = filesSizes[orientation];
	const [minimumFilesSize, maximumFilesSize] = filesSizeBounds[orientation];

	function getSize(element: HTMLElement | null): number {
		const rect = element?.getBoundingClientRect();
		if (!rect) {
			return 0;
		}

		return orientation === "vertical" ? rect.width : rect.height;
	}

	return {
		editorRef,
		editorSeparator: {
			label: "Resize editor",
			onReset: () => {
				setEditorFraction(defaultEditorFraction);
			},
			onResize: (delta) => {
				const { editorSize, total } = resizeStart.current;
				if (total) {
					setEditorFraction(
						clamp((editorSize + delta) / total, ...editorFractionBounds),
					);
				}
			},
			onResizeStart: () => {
				const editorSize = getSize(editorRef.current);

				resizeStart.current = {
					...resizeStart.current,
					editorSize,
					total: editorSize + getSize(outputRef.current),
				};
			},
			orientation,
			value: editorFraction * 100,
		},
		filesSeparator: {
			label: "Resize files",
			onReset: () => {
				setFilesSizes(defaultFilesSizes);
			},
			onResize: (delta) => {
				setFilesSizes({
					...filesSizes,
					[orientation]: clamp(
						resizeStart.current.filesSize + delta,
						minimumFilesSize,
						maximumFilesSize,
					),
				});
			},
			onResizeStart: () => {
				resizeStart.current = { ...resizeStart.current, filesSize };
			},
			orientation,
			value:
				((filesSize - minimumFilesSize) /
					(maximumFilesSize - minimumFilesSize)) *
				100,
		},
		outputRef,
		style: {
			"--playground-editor-size": `${editorFraction}fr`,
			"--playground-files-size": `${filesSize}px`,
			"--playground-keyboard-inset": `${keyboardInset}px`,
			"--playground-output-size": `${1 - editorFraction}fr`,
		} as CSSProperties,
	};
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}

function subscribeToWideQuery(onChange: () => void): () => void {
	const mediaQueryList = matchMedia(wideQuery);

	mediaQueryList.addEventListener("change", onChange);

	return (): void => {
		mediaQueryList.removeEventListener("change", onChange);
	};
}

/**
 * Measures how much of the layout viewport an on-screen keyboard covers,
 * since mobile browsers such as iOS Safari don't resize the page for one.
 */
function useKeyboardInset(): number {
	const [keyboardInset, setKeyboardInset] = useState(0);

	useEffect(() => {
		const { visualViewport } = globalThis;
		if (!visualViewport) {
			return;
		}

		function updateKeyboardInset(): void {
			if (!visualViewport || Math.abs(visualViewport.scale - 1) > 0.01) {
				setKeyboardInset(0);
				return;
			}

			setKeyboardInset(
				Math.max(
					0,
					Math.round(
						innerHeight - visualViewport.height - visualViewport.offsetTop,
					),
				),
			);
		}

		visualViewport.addEventListener("resize", updateKeyboardInset);
		visualViewport.addEventListener("scroll", updateKeyboardInset);

		return (): void => {
			visualViewport.removeEventListener("resize", updateKeyboardInset);
			visualViewport.removeEventListener("scroll", updateKeyboardInset);
		};
	}, []);

	return keyboardInset;
}
