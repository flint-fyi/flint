import { useRef, type JSX } from "react";

import styles from "./PlaygroundSeparator.module.css";

export interface PlaygroundSeparatorProps {
	label: string;
	onReset: () => void;
	onResize: (delta: number) => void;
	onResizeStart: () => void;
	orientation: "horizontal" | "vertical";
	value: number;
}

const keyboardStep = 24;

/**
 * A draggable divider between two panes, which also resizes with arrow keys.
 */
export function PlaygroundSeparator({
	label,
	onReset,
	onResize,
	onResizeStart,
	orientation,
	value,
}: PlaygroundSeparatorProps): JSX.Element {
	const dragStart = useRef<number>(undefined);
	const [decreaseKey, increaseKey] =
		orientation === "vertical"
			? ["ArrowLeft", "ArrowRight"]
			: ["ArrowUp", "ArrowDown"];

	function getPosition(event: React.PointerEvent): number {
		return orientation === "vertical" ? event.clientX : event.clientY;
	}

	return (
		<div
			aria-label={label}
			aria-orientation={orientation}
			aria-valuemax={100}
			aria-valuemin={0}
			aria-valuenow={Math.round(value)}
			className={styles.separator}
			data-orientation={orientation}
			onDoubleClick={onReset}
			onKeyDown={(event) => {
				const direction =
					event.key === decreaseKey ? -1 : event.key === increaseKey ? 1 : 0;
				if (!direction) {
					return;
				}

				event.preventDefault();
				onResizeStart();
				onResize(direction * keyboardStep);
			}}
			onPointerDown={(event) => {
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				dragStart.current = getPosition(event);
				onResizeStart();
			}}
			onPointerMove={(event) => {
				if (dragStart.current !== undefined) {
					onResize(getPosition(event) - dragStart.current);
				}
			}}
			onLostPointerCapture={() => {
				dragStart.current = undefined;
			}}
			role="separator"
			tabIndex={0}
		/>
	);
}
