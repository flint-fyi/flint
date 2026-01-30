import { createCommentDirectiveAlreadyDisabled } from "./createCommentDirectiveAlreadyDisabled.ts";
import { createCommentDirectiveFileAfterContent } from "./createCommentDirectiveFileAfterContent.ts";
import { createCommentDirectiveNoSelection } from "./createCommentDirectiveNoSelection.ts";
import { createCommentDirectiveNotPreviouslyDisabled } from "./createCommentDirectiveNotPreviouslyDisabled.ts";
import { createCommentDirectiveUnknown } from "./createCommentDirectiveUnknown.ts";
import { createCommentDirectiveUnused } from "./createCommentDirectiveUnused.ts";

export const directiveReports = {
	createAlreadyDisabled: createCommentDirectiveAlreadyDisabled,
	createFileAfterContent: createCommentDirectiveFileAfterContent,
	createNoSelection: createCommentDirectiveNoSelection,
	createNotPreviouslyDisabled: createCommentDirectiveNotPreviouslyDisabled,
	createUnknown: createCommentDirectiveUnknown,
	createUnused: createCommentDirectiveUnused,
};
