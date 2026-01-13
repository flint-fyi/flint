/**
 * The column and line of a character in a source file, as visualized to users.
 */
export interface ColumnAndLineWithoutRaw {
	/**
	 * Column in a source file (0-indexed integer).
	 */
	column: number;

	/**
	 * Line in a source file (0-indexed integer).
	 */
	line: number;
}

/**
 * The column and line of a character in a source file, as visualized to users.
 */
export interface ColumnAndLine extends ColumnAndLineWithoutRaw {
	/**
	 * The original raw character position in the source file (0-indexed integer).
	 */
	raw: number;
}

/**
 * A range of characters in a source file, as included in a report.
 */
export interface CharacterReportRange {
	/** 0-indexed */
	begin: number;
	/** 0-indexed */
	end: number;
}
