import markdownIt from "markdown-it";
import type { ReactElement } from "react";

const renderer = markdownIt();

export interface InlineMarkdownProps {
	className?: string;
	markdown: string;
}

export function InlineMarkdown({
	className,
	markdown,
}: InlineMarkdownProps): ReactElement {
	return (
		<span
			className={className}
			dangerouslySetInnerHTML={{
				__html: renderer.renderInline(markdown),
			}}
		/>
	);
}
