import { getPlaygroundParser } from "~/playground/getPlaygroundParser.ts";
import { initialFiles } from "~/playground/initialFiles.ts";
import type { PlaygroundRange } from "~/playground/types.ts";
import { useEffect, useRef, useState, type JSX } from "react";

import { getPlaygroundFileType, playgroundParserNames } from "./fileTypes.ts";
import styles from "./Playground.module.css";
import { PlaygroundAst } from "./PlaygroundAst.tsx";
import { PlaygroundEditor } from "./PlaygroundEditor.tsx";
import { PlaygroundFiles } from "./PlaygroundFiles.tsx";
import { PlaygroundReports } from "./PlaygroundReports.tsx";
import { PlaygroundSeparator } from "./PlaygroundSeparator.tsx";
import { usePlaygroundHash } from "./usePlaygroundHash.ts";
import { usePlaygroundLayout } from "./usePlaygroundLayout.ts";
import { usePlaygroundResponse } from "./usePlaygroundResponse.ts";
import type { FinalizedFileResults } from "@flint.fyi/core";

type PlaygroundView = "ast" | "astJson" | "reports";

const copiedDuration = 2000;
const initialActiveFileName = "index.ts";

const views: [PlaygroundView, string][] = [
	["reports", "Reports"],
	["ast", "AST"],
	["astJson", "AST JSON"],
];

export function Playground(): JSX.Element {
	const [files, setFiles] = useState(initialFiles);
	const [activeFileName, setActiveFileName] = useState(initialActiveFileName);
	const [copyStatus, setCopyStatus] = useState<"copied" | "failed">();
	const [hasSelectedFile, setHasSelectedFile] = useState(false);
	const [selection, setSelection] = useState<PlaygroundRange>();
	const [view, setView] = useState<PlaygroundView>("reports");
	const { isPending, response } = usePlaygroundResponse(files);
	const editorRef = useRef<HTMLElement>(null);
	const outputRef = useRef<HTMLElement>(null);
	const layout = usePlaygroundLayout(editorRef, outputRef);

	useEffect(() => {
		if (!copyStatus) {
			return;
		}

		const timeout = setTimeout(() => {
			setCopyStatus(undefined);
		}, copiedDuration);

		return (): void => {
			clearTimeout(timeout);
		};
	}, [copyStatus]);
	const hash = usePlaygroundHash(
		{ activeFileName, files },
		files === initialFiles && activeFileName === initialActiveFileName,
		(state) => {
			setFiles(state.files);
			setActiveFileName(state.activeFileName);
			setSelection(undefined);
		},
	);
	const activeFile = files.find((file) => file.name === activeFileName);
	const activeParser = activeFile && getPlaygroundParser(activeFile.name);
	const activeFileType = activeFile && getPlaygroundFileType(activeFile.name);
	const fileResults = response?.kind === "success" ? response.files : new Map<string, FinalizedFileResults>();
	const activeResult = fileResults.get(activeFileName);
	const reports = activeResult?.reports;

	function selectFile(fileName: string): void {
		setActiveFileName(fileName);
		setHasSelectedFile(true);
		setSelection(undefined);
	}

	function renderOutput(): JSX.Element {
		if (!response) {
			return <p className={styles.status}>Loading Flint…</p>;
		}

		if (response.kind === "failure") {
			return (
				<p className={styles.status} role="alert">
					Flint failed to lint these files: {response.error}
				</p>
			);
		}

		if (!activeResult || !activeParser) {
			return <p className={styles.status}>Linting…</p>;
		}

		if (view === "reports") {
			return (
				<PlaygroundReports
					parserName={playgroundParserNames[activeParser]}
					onSelect={setSelection}
					reports={activeResult.reports}
				/>
			);
		}

		if (!activeResult.ast) {
			return (
				<p className={styles.status}>
					Fix the syntax errors in this file to see its AST.
				</p>
			);
		}

		return view === "ast" ? (
			<PlaygroundAst ast={activeResult.ast} onSelect={setSelection} />
		) : (
			<pre className={styles.json}>
				{JSON.stringify(activeResult.ast, undefined, 2)}
			</pre>
		);
	}

	return (
		<div className={styles.playground} style={layout.style}>
			<nav aria-label="Files" className={styles.filesPane}>
				{hash.hasInvalidHash && (
					<div className={styles.notice} role="alert">
						<p>This link's files couldn't be loaded.</p>
						<button
							className={styles.noticeButton}
							onClick={hash.dismissInvalidHash}
							type="button"
						>
							Dismiss
						</button>
					</div>
				)}
				<PlaygroundFiles
					activeFileName={activeFileName}
					files={files}
					onAdd={(fileName) => {
						if (files.some((file) => file.name === fileName)) {
							return;
						}

						setFiles([...files, { code: "", name: fileName }]);
						selectFile(fileName);
					}}
					onDelete={(fileName) => {
						const remainingFiles = files.filter(
							(file) => file.name !== fileName,
						);

						setFiles(remainingFiles);

						if (fileName === activeFileName && remainingFiles[0]) {
							selectFile(remainingFiles[0].name);
						}
					}}
					onRename={(fileName, newFileName) => {
						setFiles(
							files.map((file) =>
								file.name === fileName ? { ...file, name: newFileName } : file,
							),
						);

						if (fileName === activeFileName) {
							selectFile(newFileName);
						}
					}}
					onSelect={selectFile}
				/>
			</nav>
			<PlaygroundSeparator {...layout.filesSeparator} />
			<section aria-label="Editor" className={styles.pane} ref={editorRef}>
				<div className={styles.toolbar}>
					<span className={styles.fileTitle}>{activeFileName}</span>
					<div className={styles.toolbarEnd}>
						{activeFileType && (
							<span className={styles.fileTypeName}>{activeFileType.name}</span>
						)}
						<button
							className={styles.shareButton}
							onClick={() => {
								hash.copyLink().then(
									() => {
										setCopyStatus("copied");
									},
									() => {
										setCopyStatus("failed");
									},
								);
							}}
							type="button"
						>
							{copyStatus === "copied" ? Icon.Check : Icon.Link}
							<span aria-live="polite">
								{copyStatus === "copied"
									? "Copied"
									: copyStatus === "failed"
										? "Copy failed"
										: "Copy link"}
							</span>
						</button>
					</div>
				</div>
				{activeFile && activeParser && activeFileType && (
					<div
						className={styles.editorTransition}
						key={`${hash.loadCount}:${activeFile.name}`}
					>
						<PlaygroundEditor
							autoFocus={hasSelectedFile}
							editorSupport={activeFileType.editorSupport}
							fileName={activeFile.name}
							initialCode={activeFile.code}
							parserName={playgroundParserNames[activeParser]}
							onChange={(code) => {
								setFiles((previous) =>
									previous.map((file) =>
										file.name === activeFile.name ? { ...file, code } : file,
									),
								);
							}}
							reports={reports}
							selection={selection}
						/>
					</div>
				)}
			</section>
			<PlaygroundSeparator {...layout.editorSeparator} />
			<section aria-label="Output" className={styles.pane} ref={outputRef}>
				<div className={styles.toolbar}>
					<div aria-label="Output view" className={styles.views} role="group">
						{views.map(([value, label]) => (
							<button
								aria-pressed={view === value}
								className={styles.viewButton}
								key={value}
								onClick={() => {
									setView(value);
								}}
								type="button"
							>
								{label}
								{value === "reports" && (
									// Reserves the count's space before the first lint.
									<span
										aria-hidden={!reports || undefined}
										className={styles.count}
										data-placeholder={!reports || undefined}
									>
										{` (${reports?.length ?? 0})`}
									</span>
								)}
							</button>
						))}
					</div>
					{isPending && response && (
						<span className={styles.pending}>Linting…</span>
					)}
				</div>
				<div
					aria-busy={isPending}
					aria-label={views.find(([value]) => value === view)?.[1]}
					className={styles.output}
					role="region"
					tabIndex={0}
				>
					<div
						className={styles.outputContent}
						key={`${activeFileName}:${view}`}
					>
						{renderOutput()}
					</div>
				</div>
				<p className="sr-only" role="status">
					{reports &&
						!isPending &&
						`${reports.length} ${reports.length === 1 ? "report" : "reports"} in ${activeFileName}`}
				</p>
			</section>
		</div>
	);
}
