import type {
	CommentDirective,
	CommentDirectiveWithinFile,
} from "../types/directives.ts";

export function isCommentDirectiveType(type: string) {
	return (
		type === "disable-file" ||
		type === "disable-lines-begin" ||
		type === "disable-lines-end" ||
		type === "disable-next-line"
	);
}

export function isCommentDirectiveWithinFile(
	directive: CommentDirective,
): directive is CommentDirectiveWithinFile {
	return (
		directive.type === "disable-lines-begin" ||
		directive.type === "disable-lines-end" ||
		directive.type === "disable-next-line"
	);
}
