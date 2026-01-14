import type * as mdast from "mdast";
import type { Point, Position } from "unist";

export interface MarkdownNodesByName extends RootContentMapWithChildren {
	root: WithPosition<mdast.Root>;
}

/**
 * A version of {@link Point} where the `offset` always exists.
 */
export interface PointWithOffset extends Point {
	offset: number;
}

/**
 * A version of {@link Position} where the `end` and `start` points include offsets.
 */
export interface PositionWithOffsets extends Position {
	end: PointWithOffset;
	start: PointWithOffset;
}

/**
 * A version of {@link mdast.RootContentMap} that includes position information for each node.
 */
export type RootContentMapWithChildren = {
	[K in keyof mdast.RootContentMap]: WithPosition<mdast.RootContentMap[K]>;
};

export type WithPosition<T> = T & { position: PositionWithOffsets };
