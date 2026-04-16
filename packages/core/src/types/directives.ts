import type { NormalizedReportRangeObject } from "./reports.ts";

export interface CommentDirective {
	range: NormalizedReportRangeObject;
	selections: string[];
	type: CommentDirectiveType;
}

export type CommentDirectiveType =
	| "disable-file"
	| CommentDirectiveTypeWithinFile;

export type CommentDirectiveTypeWithinFile =
	| "disable-lines-begin"
	| "disable-lines-end"
	| "disable-next-line";

export interface CommentDirectiveWithinFile extends CommentDirective {
	type: CommentDirectiveTypeWithinFile;
}
