import {
	HighlightStyle,
	syntaxHighlighting,
	type LanguageSupport,
} from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { EditorView, tooltips } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { PlaygroundReport } from "~/playground/types.ts";
import { basicSetup } from "codemirror";
import { useEffect, useRef, useState, type JSX } from "react";

import styles from "./PlaygroundEditor.module.css";
import { renderDiagnosticMessage } from "./renderDiagnosticMessage.ts";
import type { PlaygroundRange } from "./types.ts";

export interface PlaygroundEditorProps {
	autoFocus: boolean;
	editorSupport: () => LanguageSupport;
	fileName: string;
	initialCode: string;
	languageName: string;
	onChange: (code: string) => void;
	reports: PlaygroundReport[] | undefined;
	selection: PlaygroundRange | undefined;
}

const editorTheme = EditorView.theme({
	"&": {
		backgroundColor: "var(--sl-color-black)",
		color: "var(--sl-color-white)",
		fontSize: "var(--playground-code-size)",
		height: "100%",
	},
	"&.cm-focused": {
		outline: "none",
	},
	"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
		{
			backgroundColor: "var(--sl-color-accent-low)",
		},
	".cm-activeLine, .cm-activeLineGutter": {
		backgroundColor:
			"color-mix(in srgb, var(--sl-color-gray-6) 60%, transparent)",
	},
	".cm-content": {
		caretColor: "var(--sl-color-accent-high)",
		fontFamily: "var(--__sl-font-mono)",
	},
	".cm-cursor": {
		borderLeftColor: "var(--sl-color-accent-high)",
	},
	".cm-foldGutter .cm-gutterElement > span": {
		display: "inline-block",
		fontSize: 0,
	},
	".cm-foldGutter .cm-gutterElement > span::before": {
		content: '"›"',
		display: "inline-block",
		fontSize: "var(--sl-text-code)",
		transform: "rotate(90deg)",
	},
	".cm-foldGutter .cm-gutterElement > span[title='Unfold line']::before": {
		transform: "none",
	},
	".cm-gutters": {
		backgroundColor: "var(--sl-color-gray-6)",
		borderInlineEnd: "1px solid var(--sl-color-hairline)",
		color: "var(--sl-color-gray-3)",
	},
	".cm-scroller": {
		fontFamily: "var(--__sl-font-mono)",
	},
	".cm-diagnostic-error": {
		borderInlineStartColor: "var(--playground-color-error)",
	},
	".cm-diagnostic-warning": {
		borderInlineStartColor: "var(--playground-color-warning)",
	},
	".cm-lint-marker-error": {
		background: "var(--playground-error-marker) center / contain no-repeat",
		content: "normal",
	},
	".cm-lint-marker-warning": {
		background: "var(--playground-warning-marker) center / contain no-repeat",
		content: "normal",
	},
	".cm-lintRange-error": {
		backgroundImage: "var(--playground-squiggle-error)",
	},
	".cm-lintRange-warning": {
		backgroundImage: "var(--playground-squiggle-warning)",
	},
	".cm-playground-diagnostic-details": {
		color: "var(--sl-color-gray-2)",
		fontFamily: "var(--__sl-font-mono)",
		fontSize: "var(--sl-text-code-sm)",
		marginBlockStart: "0.25rem",
	},
	".cm-playground-diagnostic-details a": {
		color: "inherit",
	},
	".cm-playground-diagnostic-details a:hover": {
		color: "var(--sl-color-white)",
	},
	".cm-playground-diagnostic-source": {
		fontFamily: "var(--__sl-font)",
		fontWeight: "600",
	},
	".cm-tooltip": {
		backgroundColor: "var(--sl-color-gray-6)",
		border: "1px solid var(--sl-color-gray-5)",
		borderRadius: "0.1875rem",
		boxShadow: "0 0.5rem 1.5rem rgb(0 0 0 / 0.2)",
		color: "var(--sl-color-white)",
		overflow: "hidden",
	},
	".cm-tooltip code": {
		backgroundColor: "var(--sl-color-gray-5)",
		borderRadius: "0.25rem",
		fontFamily: "var(--__sl-font-mono)",
		fontSize: "var(--sl-text-code-sm)",
		padding: "0.0625rem 0.25rem",
	},
	".cm-diagnostic": {
		padding: "0.375rem 0.625rem",
	},
});

const highlightStyle = HighlightStyle.define([
	{
		color: "var(--playground-syntax-comment)",
		fontStyle: "italic",
		tag: tags.comment,
	},
	{
		color: "var(--playground-syntax-keyword)",
		tag: [tags.keyword, tags.operatorKeyword, tags.modifier],
	},
	{
		color: "var(--playground-syntax-string)",
		tag: [tags.string, tags.special(tags.string), tags.regexp],
	},
	{
		color: "var(--playground-syntax-literal)",
		tag: [tags.number, tags.bool, tags.null, tags.atom],
	},
	{
		color: "var(--playground-syntax-type)",
		tag: [
			tags.function(tags.variableName),
			tags.function(tags.propertyName),
			tags.typeName,
			tags.className,
		],
	},
]);

export function PlaygroundEditor({
	autoFocus,
	editorSupport,
	fileName,
	initialCode,
	languageName,
	onChange,
	reports,
	selection,
}: PlaygroundEditorProps): JSX.Element {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);
	const onChangeRef = useRef(onChange);
	const viewRef = useRef<EditorView>(undefined);

	onChangeRef.current = onChange;

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const view = new EditorView({
			doc: initialCode,
			extensions: [
				basicSetup,
				editorSupport(),
				lintGutter(),
				tooltips({
					// Keeps tooltips from rising behind the site header.
					tooltipSpace: (view) => ({
						bottom: innerHeight,
						left: 0,
						right: innerWidth,
						top: view.dom.getBoundingClientRect().top,
					}),
				}),
				editorTheme,
				syntaxHighlighting(highlightStyle),
				EditorView.contentAttributes.of({
					"aria-label": `Contents of ${fileName}`,
					tabindex: "0",
				}),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onChangeRef.current(update.state.doc.toString());
					}
				}),
			],
			parent: containerRef.current,
		});

		viewRef.current = view;
		setIsReady(true);

		if (autoFocus) {
			view.focus();
		}

		return (): void => {
			view.destroy();
		};
	}, []);

	useEffect(() => {
		const view = viewRef.current;
		if (!view || !reports) {
			return;
		}

		const documentLength = view.state.doc.length;

		view.dispatch(
			setDiagnostics(
				view.state,
				reports.map((report) => ({
					from: Math.min(report.begin, documentLength),
					message: report.message,
					renderMessage: () => renderDiagnosticMessage(report, languageName),
					severity: report.source === "language" ? "error" : "warning",
					to: Math.min(report.end, documentLength),
				})),
			),
		);
	}, [languageName, reports]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view || !selection) {
			return;
		}

		const documentLength = view.state.doc.length;

		view.dispatch({
			scrollIntoView: true,
			selection: {
				anchor: Math.min(selection.begin, documentLength),
				head: Math.min(selection.end, documentLength),
			},
		});
		view.focus();
	}, [selection]);

	return (
		<div className={styles.editor} ref={containerRef}>
			{!isReady && <pre className={styles.fallback}>{initialCode}</pre>}
		</div>
	);
}
