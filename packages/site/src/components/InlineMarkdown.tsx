import markdownIt from "markdown-it";

const renderer = markdownIt();

export interface InlineMarkdownProps {
	className?: string;
	markdown: string;
}

export function InlineMarkdown({ className, markdown }: InlineMarkdownProps) {
	return (
		<span
			className={className}
			dangerouslySetInnerHTML={{
				__html: renderer.renderInline(markdown),
			}}
		/>
	);
}
