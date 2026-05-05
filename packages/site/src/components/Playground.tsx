import { javascript } from "@codemirror/lang-javascript";
import {
	type Diagnostic as CmDiagnostic,
	forceLinting,
	lintGutter,
	linter,
} from "@codemirror/lint";
import { type EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import clsx from "clsx";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
} from "react";

import severityErrorIcon from "../assets/playground/severity-error.svg?url";
import severityWarningIcon from "../assets/playground/severity-warning.svg?url";
import styles from "./Playground.module.css";
import type {
	PlaygroundAstNode,
	PlaygroundDiagnostic,
	PlaygroundDiagnosticCategory,
	PlaygroundFailure,
	PlaygroundRequest,
	PlaygroundResult,
} from "../playground/types.ts";

const SEVERITY_ICON_URLS: Partial<
	Record<PlaygroundDiagnosticCategory, string>
> = {
	error: severityErrorIcon,
	warning: severityWarningIcon,
};

const DEFAULT_PLAYGROUND_TSX = `import { pi } from "./math";

const message: string = pi;

function greet(name: string) {
	debugger;
	if (name == "Flint") {}
	return "Hello, " + name;
}

const helper = function () {
	return message;
};

greet(message);
const options = { helper: helper };
`;

const DEFAULT_MATH_TS = `export const pi = 3;
`;

/** Default virtual project (paths + contents). */
const DEFAULT_FILES: Record<string, string> = {
	"/math.ts": DEFAULT_MATH_TS,
	"/playground.tsx": DEFAULT_PLAYGROUND_TSX,
};

const INITIAL_PATHS = ["/playground.tsx", "/math.ts"];

const MIN_SIDEBAR_WIDTH = 128;
const MIN_MAIN_WIDTH = 320;
const MIN_OUTPUT_WIDTH = 280;
const MIN_EDITOR_PERCENT = 25;
const MAX_EDITOR_PERCENT = 85;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

interface SharedWorkspace {
	activePath: string;
	files: Record<string, string>;
	paths: string[];
}

type DiagnosticsTab = "console" | "diagnostics";

/** Compact layout: one top tab strip (Settings → Code → Diagnostics → Console → AST). */
type PlaygroundCompactTab =
	| "ast"
	| "code"
	| "console"
	| "diagnostics"
	| "settings";

const COMPACT_LAYOUT_MAX_CSS_PX = 999;

function useCompactPlaygroundLayout(): boolean {
	const [compact, setCompact] = useState(() => {
		if (typeof globalThis.matchMedia !== "function") {
			return false;
		}

		return globalThis.matchMedia(`(max-width: ${COMPACT_LAYOUT_MAX_CSS_PX}px)`)
			.matches;
	});

	useEffect(() => {
		if (typeof globalThis.matchMedia !== "function") {
			return;
		}

		const mq = globalThis.matchMedia(
			`(max-width: ${COMPACT_LAYOUT_MAX_CSS_PX}px)`,
		);

		const sync = () => {
			setCompact(mq.matches);
		};

		sync();
		mq.addEventListener("change", sync);

		return () => {
			mq.removeEventListener("change", sync);
		};
	}, []);

	return compact;
}

/** Stable id suffix for file path (use in tab `id` attributes). */
function filePathTabIdSuffix(path: string): string {
	let out = "";

	for (const char of path) {
		out += /^[a-z0-9]$/iu.test(char) ? char.toLowerCase() : "-";
	}

	const slug = out.replace(/-+/gu, "-").replace(/^-+|-+$/gu, "");

	return slug.length > 0 ? slug : "file";
}

function encodeWorkspace(workspace: SharedWorkspace): string {
	const json = JSON.stringify(workspace);
	const utf8 = new TextEncoder().encode(json);
	let binary = "";
	for (const byte of utf8) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/u, "");
}

function decodeWorkspace(encoded: string): SharedWorkspace | undefined {
	try {
		const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const binary = atob(
			padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="),
		);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		const json = new TextDecoder().decode(bytes);
		const parsed = JSON.parse(json) as Partial<SharedWorkspace>;

		if (
			!parsed ||
			typeof parsed.activePath !== "string" ||
			!Array.isArray(parsed.paths) ||
			!parsed.files ||
			typeof parsed.files !== "object"
		) {
			return undefined;
		}

		return {
			activePath: parsed.activePath,
			files: parsed.files as Record<string, string>,
			paths: parsed.paths as string[],
		};
	} catch {
		return undefined;
	}
}

function isDefaultWorkspace(
	paths: string[],
	files: Record<string, string>,
	activePath: string,
): boolean {
	if (activePath !== "/playground.tsx") {
		return false;
	}

	if (paths.length !== INITIAL_PATHS.length) {
		return false;
	}

	for (let i = 0; i < INITIAL_PATHS.length; i++) {
		if (paths[i] !== INITIAL_PATHS[i]) {
			return false;
		}
	}

	for (const path of INITIAL_PATHS) {
		if ((files[path] ?? "") !== (DEFAULT_FILES[path] ?? "")) {
			return false;
		}
	}

	return true;
}

/** Matches workspace after Clear: single empty `/playground.tsx` only. */
function isClearedWorkspace(
	paths: string[],
	files: Record<string, string>,
): boolean {
	if (paths.length !== 1 || paths[0] !== "/playground.tsx") {
		return false;
	}

	if (Object.keys(files).length !== 1) {
		return false;
	}

	return files["/playground.tsx"] === "";
}

/**
 * Forwards wheel events that land anywhere in `panelRef` (including its tab
 * strip and any inner element that would otherwise capture wheel) to
 * `scrollerRef`. Capture phase + non-passive so we run before any descendant
 * scroll container can claim the event.
 */
function useWheelForward(
	panelRef: RefObject<HTMLElement | null>,
	scrollerRef: RefObject<HTMLElement | null>,
): void {
	useEffect(() => {
		const panel = panelRef.current;
		const scroller = scrollerRef.current;

		if (!panel || !scroller) {
			return;
		}

		const handler = (event: WheelEvent) => {
			let deltaX = event.deltaX;
			let deltaY = event.deltaY;

			if (event.deltaMode === 1) {
				deltaX *= 16;
				deltaY *= 16;
			} else if (event.deltaMode === 2) {
				deltaX *= scroller.clientWidth;
				deltaY *= scroller.clientHeight;
			}

			if (deltaX === 0 && deltaY === 0) {
				return;
			}

			event.preventDefault();
			scroller.scrollBy({ left: deltaX, top: deltaY });
		};

		panel.addEventListener("wheel", handler, {
			capture: true,
			passive: false,
		});

		return () => {
			panel.removeEventListener("wheel", handler, { capture: true });
		};
	}, [panelRef, scrollerRef]);
}

function useStarlightTheme(): "light" | "dark" {
	const [theme, setTheme] = useState<"light" | "dark">(() =>
		typeof document === "undefined" ||
		document.documentElement.dataset.theme === "light"
			? "light"
			: "dark",
	);

	useEffect(() => {
		const root = document.documentElement;

		const sync = () => {
			setTheme(root.dataset.theme === "light" ? "light" : "dark");
		};

		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, {
			attributeFilter: ["data-theme"],
			attributes: true,
		});

		return () => {
			observer.disconnect();
		};
	}, []);

	return theme;
}

function cmSeverity(
	category: PlaygroundDiagnosticCategory,
): CmDiagnostic["severity"] {
	switch (category) {
		case "error": {
			return "error";
		}
		case "warning": {
			return "warning";
		}
		case "suggestion": {
			return "hint";
		}
		default: {
			return "info";
		}
	}
}

function toCmDiagnostics(
	diagnostics: PlaygroundDiagnostic[],
	fileName: string,
	docLength: number,
): CmDiagnostic[] {
	const out: CmDiagnostic[] = [];

	for (const diagnostic of diagnostics) {
		if (diagnostic.fileName !== fileName) {
			continue;
		}

		const from = Math.max(0, Math.min(diagnostic.start, docLength));
		const to = Math.max(from, Math.min(diagnostic.end, docLength));
		const ruleLabel = `${diagnostic.source}:${diagnostic.code}`;
		const docsHref = getRuleDocsHref(diagnostic);

		out.push({
			from,
			message: `${ruleLabel} — ${diagnostic.message}`,
			renderMessage: () => {
				const wrap = document.createElement("span");
				wrap.className = styles.cmDiagnosticMessage;

				if (docsHref) {
					const link = document.createElement("a");
					link.className = styles.cmDiagnosticCodeLink;
					link.href = docsHref;
					link.textContent = ruleLabel;
					link.title = `View docs for ${ruleLabel}`;
					wrap.appendChild(link);
				} else {
					const code = document.createElement("strong");
					code.className = styles.cmDiagnosticCode;
					code.textContent = ruleLabel;
					wrap.appendChild(code);
				}

				wrap.appendChild(document.createTextNode(` — ${diagnostic.message}`));

				return wrap;
			},
			severity: cmSeverity(diagnostic.category),
			to: from === to ? Math.min(docLength, from + 1) : to,
		});
	}

	return out;
}

function categoryRank(category: PlaygroundDiagnosticCategory): number {
	switch (category) {
		case "error": {
			return 0;
		}
		case "warning": {
			return 1;
		}
		case "suggestion": {
			return 2;
		}
		default: {
			return 3;
		}
	}
}

function sortDiagnostics(
	files: Record<string, string>,
	diagnostics: PlaygroundDiagnostic[],
): PlaygroundDiagnostic[] {
	return [...diagnostics].toSorted((a, b) => {
		const byFile = a.fileName.localeCompare(b.fileName);
		if (byFile !== 0) {
			return byFile;
		}

		const byRank = categoryRank(a.category) - categoryRank(b.category);
		if (byRank !== 0) {
			return byRank;
		}

		const textA = files[a.fileName] ?? "";
		const textB = files[b.fileName] ?? "";
		const lineA = getLocation(textA, a.start).line;
		const lineB = getLocation(textB, b.start).line;

		if (lineA !== lineB) {
			return lineA - lineB;
		}

		return a.start - b.start;
	});
}

function getLocation(code: string, position: number) {
	const before = code.slice(0, position);
	const lines = before.split("\n");
	const lastLine = lines.at(-1) ?? "";

	return {
		column: lastLine.length + 1,
		line: lines.length,
	};
}

function getLineSnippet(code: string, lineNumber: number): string {
	const line = code.split("\n").at(lineNumber - 1);

	if (line === undefined) {
		return "";
	}

	const trimmed = line.trimEnd();
	return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
}

function getSourceLine(code: string, lineNumber: number): string {
	return code.split("\n").at(lineNumber - 1) ?? "";
}

function getCaretMarker(
	diagnostic: PlaygroundDiagnostic,
	location: { column: number; line: number },
	sourceLine: string,
): string {
	const lineLength = Math.max(1, sourceLine.length);
	const markerStart = clamp(location.column, 1, lineLength);
	const markerLength = clamp(
		diagnostic.end - diagnostic.start,
		1,
		Math.max(1, lineLength - markerStart + 1),
	);

	return `${" ".repeat(markerStart - 1)}${"^".repeat(markerLength)}`;
}

const RULE_DOCS_CATEGORIES = new Set([
	"astro",
	"browser",
	"flint",
	"json",
	"jsx",
	"md",
	"node",
	"package-json",
	"performance",
	"spelling",
	"ts",
	"yaml",
]);

function getRuleDocsHref(diagnostic: PlaygroundDiagnostic): string | undefined {
	if (diagnostic.source !== "flint") {
		return undefined;
	}

	const slashIndex = diagnostic.code.indexOf("/");
	if (slashIndex <= 0) {
		return undefined;
	}

	const category = diagnostic.code.slice(0, slashIndex);
	const rule = diagnostic.code.slice(slashIndex + 1);

	if (!rule || !RULE_DOCS_CATEGORIES.has(category)) {
		return undefined;
	}

	return `/rules/${category}/${rule}`.toLowerCase();
}

function categoryShortLabel(category: PlaygroundDiagnosticCategory): string {
	switch (category) {
		case "error": {
			return "Error";
		}
		case "warning": {
			return "Warning";
		}
		case "suggestion": {
			return "Hint";
		}
		default: {
			return "Info";
		}
	}
}

const severitySurface: Record<PlaygroundDiagnosticCategory, string> = {
	error: styles.sevError,
	warning: styles.sevWarning,
	info: styles.sevInfo,
	suggestion: styles.sevSuggestion,
};

const severityDotClass: Record<PlaygroundDiagnosticCategory, string> = {
	error: styles.dotError,
	warning: styles.dotWarning,
	info: styles.dotInfo,
	suggestion: styles.dotSuggestion,
};

function Diagnostics({
	diagnostics,
	files,
	onGoTo,
}: {
	diagnostics: PlaygroundDiagnostic[];
	files: Record<string, string>;
	onGoTo: (fileName: string, start: number) => void;
}) {
	if (!diagnostics.length) {
		return <p className={styles.empty}>No diagnostics found.</p>;
	}

	return (
		<ul className={styles.diagnostics}>
			{diagnostics.map((diagnostic) => {
				const sourceText = files[diagnostic.fileName] ?? "";
				const location = getLocation(sourceText, diagnostic.start);
				const snippet = getLineSnippet(sourceText, location.line);
				const docsHref = getRuleDocsHref(diagnostic);
				const ruleLabel = `${diagnostic.source}:${diagnostic.code}`;
				const goToSource = () => {
					onGoTo(diagnostic.fileName, diagnostic.start);
				};

				return (
					<li
						key={`${diagnostic.fileName}-${diagnostic.source}-${diagnostic.code}-${diagnostic.start}`}
					>
						<div
							aria-label={`${categoryShortLabel(diagnostic.category)} in ${diagnostic.fileName} at line ${location.line}: ${diagnostic.message}`}
							className={clsx(
								styles.diagnostic,
								severitySurface[diagnostic.category],
							)}
							onClick={goToSource}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									goToSource();
								}
							}}
							role="button"
							tabIndex={0}
						>
							<div className={styles.diagnosticHeader}>
								{docsHref ? (
									<a
										className={clsx(
											styles.diagnosticCode,
											styles.diagnosticCodeLink,
										)}
										href={docsHref}
										onClick={(event) => {
											event.stopPropagation();
										}}
										title={`View docs for ${ruleLabel}`}
									>
										{ruleLabel}
									</a>
								) : (
									<span className={styles.diagnosticCode}>{ruleLabel}</span>
								)}
								<span className={styles.diagnosticMessage}>
									{diagnostic.message}
								</span>
							</div>
							<div className={styles.diagnosticMeta}>
								<span className={styles.diagnosticLocation}>
									{diagnostic.fileName}
									<span className={styles.diagnosticLocationSep}>:</span>
									<span className={styles.diagnosticLocationLn}>
										{location.line}:{location.column}
									</span>
								</span>
							</div>
							{snippet ? (
								<pre className={styles.diagnosticSnippet}>{snippet}</pre>
							) : null}
						</div>
					</li>
				);
			})}
		</ul>
	);
}

function ConsoleDiagnostics({
	diagnostics,
	files,
	onGoTo,
}: {
	diagnostics: PlaygroundDiagnostic[];
	files: Record<string, string>;
	onGoTo: (fileName: string, start: number) => void;
}) {
	if (!diagnostics.length) {
		return (
			<div className={styles.consoleEmpty}>
				<span className={styles.consolePrompt}>$</span> flint
				<br />
				<span className={styles.consoleSuccess}>No diagnostics found.</span>
			</div>
		);
	}

	return (
		<div className={styles.consoleLog} role="log">
			<div className={styles.consoleCommand}>
				<span className={styles.consolePrompt}>$</span> flint
			</div>
			{diagnostics.map((diagnostic) => {
				const sourceText = files[diagnostic.fileName] ?? "";
				const location = getLocation(sourceText, diagnostic.start);
				const sourceLine = getSourceLine(sourceText, location.line);
				const marker = getCaretMarker(diagnostic, location, sourceLine);
				const docsHref = getRuleDocsHref(diagnostic);
				const ruleLabel = `${diagnostic.source}/${diagnostic.code}`;
				const goToSource = () => {
					onGoTo(diagnostic.fileName, diagnostic.start);
				};

				return (
					<div
						aria-label={`${categoryShortLabel(diagnostic.category)} in ${diagnostic.fileName} at line ${location.line}: ${diagnostic.message}`}
						className={styles.consoleDiagnostic}
						key={`${diagnostic.fileName}-${diagnostic.source}-${diagnostic.code}-${diagnostic.start}`}
						onClick={goToSource}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								goToSource();
							}
						}}
						role="button"
						tabIndex={0}
					>
						<div className={styles.consoleMeta}>
							<span className={styles.consoleLocation}>
								{diagnostic.fileName}:{location.line}:{location.column}
							</span>
							{docsHref ? (
								<a
									className={clsx(styles.consoleRule, styles.consoleRuleLink)}
									href={docsHref}
									onClick={(event) => {
										event.stopPropagation();
									}}
									title={`View docs for ${ruleLabel}`}
								>
									{ruleLabel}
								</a>
							) : (
								<span className={styles.consoleRule}>{ruleLabel}</span>
							)}
							<span className={styles.consoleBadge}>
								{categoryShortLabel(diagnostic.category)}
							</span>
						</div>
						<div
							className={clsx(
								styles.consoleMessage,
								severityDotClass[diagnostic.category],
							)}
						>
							{SEVERITY_ICON_URLS[diagnostic.category] ? (
								<img
									alt=""
									aria-hidden="true"
									className={styles.consoleIcon}
									src={SEVERITY_ICON_URLS[diagnostic.category]}
								/>
							) : (
								<span
									aria-hidden="true"
									className={clsx(
										styles.consoleIcon,
										severityDotClass[diagnostic.category],
									)}
								/>
							)}
							{diagnostic.message}
						</div>
						<pre className={styles.consoleFrame}>
							<code>
								{`${location.line.toString().padStart(4, " ")} | ${sourceLine}\n     | ${marker}`}
							</code>
						</pre>
					</div>
				);
			})}
		</div>
	);
}

function AstTree({ depth, node }: { depth: number; node: PlaygroundAstNode }) {
	const [open, setOpen] = useState(depth < 1);
	const hasChildren = !!node.children.length;

	return (
		<div className={styles.astNode}>
			<div className={styles.astRow}>
				{hasChildren ? (
					<button
						aria-expanded={open}
						className={styles.astToggle}
						onClick={() => {
							setOpen(!open);
						}}
						type="button"
					>
						<span className={styles.astToggleIcon}>{open ? "▾" : "▸"}</span>
					</button>
				) : (
					<span className={styles.astToggleSpacer} aria-hidden />
				)}
				<span className={styles.astKind}>{node.kind}</span>
				{node.text != null ? (
					<code className={styles.astText}>{node.text}</code>
				) : null}
				<span className={styles.astRange} title="Span in source">
					{node.pos}:{node.end}
				</span>
			</div>
			{open && hasChildren ? (
				<div className={styles.astChildren}>
					{node.children.map((child, index) => (
						<AstTree
							depth={depth + 1}
							key={`${child.pos}-${child.kind}-${index}`}
							node={child}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}

type AstViewMode = "node" | "json";

function Ast({
	activePath,
	ast,
	theme,
}: {
	activePath: string;
	ast: PlaygroundAstNode | undefined;
	theme: "dark" | "light";
}) {
	const [viewMode, setViewMode] = useState<AstViewMode>("node");
	const astJson = useMemo(
		() => (ast ? JSON.stringify(ast, null, 2) : ""),
		[ast],
	);
	const astJsonExtensions = useMemo(() => [javascript()], []);

	if (!ast) {
		return <p className={styles.empty}>AST is not available yet.</p>;
	}

	return (
		<div className={styles.astRoot}>
			<div className={styles.astToolbar}>
				<p className={styles.astCaption} title={`Root: ${activePath}`}>
					Root: {activePath}
				</p>
				<div className={styles.astViewToggle} aria-label="AST view mode">
					<button
						aria-pressed={viewMode === "node"}
						className={styles.astViewButton}
						onClick={() => {
							setViewMode("node");
						}}
						type="button"
					>
						Node
					</button>
					<button
						aria-pressed={viewMode === "json"}
						className={styles.astViewButton}
						onClick={() => {
							setViewMode("json");
						}}
						type="button"
					>
						JSON
					</button>
				</div>
			</div>
			<div className={styles.astBody}>
				{viewMode === "node" ? (
					<div className={styles.astTreeScroll}>
						<AstTree depth={0} node={ast} />
					</div>
				) : (
					<CodeMirror
						basicSetup={{
							foldGutter: true,
							highlightActiveLine: false,
							highlightActiveLineGutter: false,
							lineNumbers: true,
						}}
						className={clsx(styles.codeMirror, styles.astJsonEditor)}
						editable={false}
						extensions={astJsonExtensions}
						height="100%"
						theme={theme}
						value={astJson}
					/>
				)}
			</div>
		</div>
	);
}

interface PlaygroundSettingsContentProps {
	activePath: string;
	addFile: () => void;
	clearWorkspace: () => void;
	commitRename: (oldPath: string, rawName: string) => void;
	completeRemoveFile: (path: string) => void;
	copyShareUrl: () => void;
	copyState: "copied" | "idle";
	clearWorkspaceDisabled: boolean;
	paths: string[];
	removeFile: (path: string) => void;
	renameInputRef: RefObject<HTMLInputElement | null>;
	removingPaths: Set<string>;
	renamingPath: string | null;
	resetWorkspace: () => void;
	resetWorkspaceDisabled: boolean;
	setActivePath: Dispatch<SetStateAction<string>>;
	setRenamingPath: Dispatch<SetStateAction<string | null>>;
	skipRenameCommit: { current: boolean };
}

function PlaygroundSettingsContent({
	activePath,
	addFile,
	clearWorkspace,
	copyShareUrl,
	copyState,
	clearWorkspaceDisabled,
	paths,
	commitRename,
	completeRemoveFile,
	removeFile,
	removingPaths,
	renameInputRef,
	renamingPath,
	resetWorkspace,
	resetWorkspaceDisabled,
	setActivePath,
	setRenamingPath,
	skipRenameCommit,
}: PlaygroundSettingsContentProps) {
	return (
		<>
			<div className={styles.settingsPanel}>
				<button
					className={styles.sidebarButton}
					disabled={clearWorkspaceDisabled}
					onClick={clearWorkspace}
					title={
						clearWorkspaceDisabled
							? "Workspace is already cleared"
							: "Remove all files and keep one empty playground file"
					}
					type="button"
				>
					Clear
				</button>
				<button
					className={styles.sidebarButton}
					disabled={resetWorkspaceDisabled}
					onClick={resetWorkspace}
					title={
						resetWorkspaceDisabled
							? "Already using the default example workspace"
							: "Restore the default example files"
					}
					type="button"
				>
					Reset
				</button>
				<button
					className={clsx(
						styles.sidebarButton,
						styles.sidebarButtonCopyUrl,
						copyState === "copied" && styles.sidebarButtonCopyUrlDone,
					)}
					onClick={copyShareUrl}
					type="button"
				>
					{copyState === "copied" ? (
						<>
							<span
								aria-hidden="true"
								className={styles.sidebarButtonCopiedMark}
							>
								✓
							</span>
							<span>Copied</span>
						</>
					) : (
						"Copy URL"
					)}
				</button>
			</div>

			<div aria-label="Virtual project files" className={styles.fileExplorer}>
				<div className={styles.fileExplorerHeader}>
					<span className={styles.fileExplorerTitle}>Files</span>
					<button
						aria-label="New file"
						className={styles.fileExplorerAdd}
						onClick={addFile}
						type="button"
					>
						+
					</button>
				</div>
				<ul className={styles.fileList}>
					{paths.map((path) => {
						const label = path.replace(/^\//u, "");
						const isActive = path === activePath;
						const isRenaming = renamingPath === path;
						const isRemoving = removingPaths.has(path);
						const canRemove =
							paths.filter((p) => !removingPaths.has(p)).length > 1;

						return (
							<li
								className={clsx(
									styles.fileListItem,
									isRemoving && styles.fileListItemRemoving,
								)}
								key={path}
								onAnimationEnd={() => {
									if (isRemoving) {
										completeRemoveFile(path);
									}
								}}
							>
								<div
									className={clsx(
										styles.fileRow,
										isActive && styles.fileRowActive,
										isRenaming && styles.fileRowRenaming,
										isRemoving && styles.fileRowRemoving,
									)}
								>
									{isRenaming ? (
										<input
											aria-label={`Rename ${path}`}
											className={styles.fileRowRenameInput}
											defaultValue={label}
											key={path}
											title={label}
											onBlur={(event) => {
												if (skipRenameCommit.current) {
													skipRenameCommit.current = false;
													setRenamingPath(null);

													return;
												}

												commitRename(path, event.target.value);
												setRenamingPath(null);
											}}
											onKeyDown={(event) => {
												if (event.key === "Enter") {
													event.currentTarget.blur();
												} else if (event.key === "Escape") {
													event.preventDefault();
													skipRenameCommit.current = true;
													setRenamingPath(null);
												}
											}}
											ref={renameInputRef}
										/>
									) : (
										<button
											className={styles.fileRowMain}
											onClick={() => {
												setActivePath(path);
											}}
											title={label}
											type="button"
										>
											<span className={styles.fileRowMainLabel}>{label}</span>
										</button>
									)}
									{!isRenaming ? (
										<div className={styles.fileRowActions}>
											<button
												className={clsx(
													styles.fileRowBtn,
													styles.fileRowBtnRename,
												)}
												onClick={() => {
													setRenamingPath(path);
												}}
												type="button"
											>
												rename
											</button>
											{canRemove ? (
												<button
													aria-label={`Remove ${path}`}
													className={clsx(
														styles.fileRowBtn,
														styles.fileRowBtnDanger,
													)}
													onClick={(event) => {
														event.stopPropagation();
														removeFile(path);
													}}
													type="button"
												>
													×
												</button>
											) : null}
										</div>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</>
	);
}

export function Playground() {
	const starlightTheme = useStarlightTheme();
	const [error, setError] = useState<string>();
	const [files, setFiles] = useState<Record<string, string>>(() => ({
		...DEFAULT_FILES,
	}));
	const [paths, setPaths] = useState<string[]>(() => [...INITIAL_PATHS]);
	const [activePath, setActivePath] = useState("/playground.tsx");
	const [result, setResult] = useState<PlaygroundResult>();
	const requestId = useRef(0);
	const workerRef = useRef<Worker | undefined>(undefined);
	const editorViewRef = useRef<EditorView | null>(null);
	const resultRef = useRef<PlaygroundResult | undefined>(undefined);
	const pendingGoTo = useRef<{ fileName: string; pos: number } | null>(null);
	const renameInputRef = useRef<HTMLInputElement | null>(null);
	const skipRenameCommit = useRef(false);
	const workspaceRef = useRef<HTMLDivElement | null>(null);
	const mainColumnRef = useRef<HTMLDivElement | null>(null);
	const diagnosticsPanelRef = useRef<HTMLDivElement | null>(null);
	const diagnosticsBodyRef = useRef<HTMLDivElement | null>(null);
	useWheelForward(diagnosticsPanelRef, diagnosticsBodyRef);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [removingPaths, setRemovingPaths] = useState<Set<string>>(
		() => new Set(),
	);
	const [sidebarWidth, setSidebarWidth] = useState(184);
	const [mainWidth, setMainWidth] = useState(680);
	const [editorPercent, setEditorPercent] = useState(62);
	const [diagnosticsTab, setDiagnosticsTab] =
		useState<DiagnosticsTab>("diagnostics");
	const compactLayout = useCompactPlaygroundLayout();
	const [compactTab, setCompactTab] = useState<PlaygroundCompactTab>("code");
	resultRef.current = result;

	const extensions = useMemo(() => {
		const isJsx = activePath.endsWith(".tsx") || activePath.endsWith(".jsx");

		return [
			javascript({
				jsx: isJsx,
				typescript: true,
			}),
			linter((view) =>
				toCmDiagnostics(
					resultRef.current?.diagnostics ?? [],
					activePath,
					view.state.doc.length,
				),
			),
			lintGutter(),
		];
	}, [activePath]);

	useEffect(() => {
		const hash = globalThis.location.hash.replace(/^#/u, "");
		if (hash) {
			const workspace = decodeWorkspace(hash);
			if (workspace && !!workspace.paths.length) {
				setFiles(workspace.files);
				setPaths(workspace.paths);
				setActivePath(
					workspace.paths.includes(workspace.activePath)
						? workspace.activePath
						: workspace.paths[0]!,
				);

				return;
			}
		}

		const params = new URLSearchParams(globalThis.location.search);
		const initialCode = params.get("code");
		const initialFile = params.get("file");

		if (initialCode != null) {
			const path = initialFile ?? "/playground.tsx";
			setFiles((prev) => ({ ...prev, [path]: initialCode }));
			setActivePath(path);
			setPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
		} else if (initialFile != null) {
			setActivePath(initialFile);
		}
	}, []);

	useEffect(() => {
		const worker = new Worker(
			new URL("../playground/playgroundWorker.ts", import.meta.url),
			{ type: "module" },
		);

		worker.addEventListener(
			"message",
			({ data }: MessageEvent<PlaygroundFailure | PlaygroundResult>) => {
				if (data.requestId !== requestId.current) {
					return;
				}

				if ("error" in data) {
					setError(data.error);

					return;
				}

				setError(undefined);
				setResult(data);
			},
		);

		workerRef.current = worker;

		return () => {
			worker.terminate();
			workerRef.current = undefined;
		};
	}, []);

	const focusEditor = useCallback((pos: number) => {
		const view = editorViewRef.current;

		if (!view) {
			return;
		}

		view.focus();
		view.dispatch({
			selection: { anchor: pos },
			scrollIntoView: true,
		});
	}, []);

	useEffect(() => {
		const pending = pendingGoTo.current;
		if (!pending || pending.fileName !== activePath) {
			return;
		}

		pendingGoTo.current = null;
		const id = globalThis.setTimeout(() => {
			focusEditor(pending.pos);
		}, 0);

		return () => {
			clearTimeout(id);
		};
	}, [activePath, files, focusEditor]);

	useEffect(() => {
		if (!renamingPath) {
			return;
		}

		const id = globalThis.requestAnimationFrame(() => {
			const input = renameInputRef.current;
			if (!input) {
				return;
			}

			input.focus();
			input.select();
			input.scrollLeft = 0;

			globalThis.requestAnimationFrame(() => {
				input.scrollLeft = 0;
			});
		});

		return () => {
			globalThis.cancelAnimationFrame(id);
		};
	}, [renamingPath]);

	useEffect(() => {
		if (renamingPath && !paths.includes(renamingPath)) {
			setRenamingPath(null);
		}
	}, [paths, renamingPath]);

	useEffect(() => {
		const worker = workerRef.current;

		if (!worker) {
			return;
		}

		const handle = globalThis.setTimeout(() => {
			const nextRequestId = requestId.current + 1;
			requestId.current = nextRequestId;
			const request: PlaygroundRequest = {
				activePath,
				files: paths.map((path) => ({
					content: files[path] ?? "",
					path,
				})),
				requestId: nextRequestId,
			};
			worker.postMessage(request);

			const filesForShare: Record<string, string> = {};
			for (const path of paths) {
				filesForShare[path] = files[path] ?? "";
			}

			if (isDefaultWorkspace(paths, filesForShare, activePath)) {
				globalThis.history.replaceState(null, "", globalThis.location.pathname);
			} else {
				const hash = encodeWorkspace({
					activePath,
					files: filesForShare,
					paths,
				});
				globalThis.history.replaceState(
					null,
					"",
					`${globalThis.location.pathname}#${hash}`,
				);
			}
		}, 180);

		return () => {
			globalThis.clearTimeout(handle);
		};
	}, [activePath, files, paths]);

	const diagnostics = result?.diagnostics ?? [];
	const sortedDiagnostics = useMemo(
		() => sortDiagnostics(files, diagnostics),
		[files, diagnostics],
	);

	useEffect(() => {
		const view = editorViewRef.current;

		if (!view) {
			return;
		}

		forceLinting(view);
	}, [activePath, diagnostics]);

	const goToDiagnostic = useCallback(
		(fileName: string, pos: number) => {
			if (fileName !== activePath) {
				pendingGoTo.current = { fileName, pos };
				setActivePath(fileName);

				return;
			}

			focusEditor(pos);
		},
		[activePath, focusEditor],
	);

	const addFile = useCallback(() => {
		setPaths((prevPaths) => {
			let n = 2;
			let newPath = `/untitled-${n}.ts`;

			while (prevPaths.includes(newPath)) {
				n++;
				newPath = `/untitled-${n}.ts`;
			}

			setFiles((prevFiles) => ({
				...prevFiles,
				[newPath]: "",
			}));
			setActivePath(newPath);
			setRenamingPath(newPath);

			return [...prevPaths, newPath];
		});
	}, []);

	const completeRemoveFile = useCallback((path: string) => {
		setPaths((prev) => prev.filter((p) => p !== path));
		setFiles((prev) => {
			const { [path]: _removed, ...rest } = prev;

			return rest;
		});
		setRemovingPaths((prev) => {
			if (!prev.has(path)) {
				return prev;
			}

			const next = new Set(prev);
			next.delete(path);

			return next;
		});
	}, []);

	const removeFile = useCallback(
		(path: string) => {
			const availablePaths = paths.filter((p) => !removingPaths.has(p));
			if (availablePaths.length <= 1 || removingPaths.has(path)) {
				return;
			}

			const nextPaths = availablePaths.filter((p) => p !== path);
			setRemovingPaths((prev) => new Set(prev).add(path));
			globalThis.setTimeout(() => {
				completeRemoveFile(path);
			}, 180);

			if (activePath === path) {
				setActivePath(nextPaths[0]!);
			}
		},
		[activePath, completeRemoveFile, paths, removingPaths],
	);

	const commitRename = useCallback(
		(oldPath: string, rawName: string) => {
			const base = rawName.trim().replace(/^\/+/u, "");
			if (!base || base.includes("/")) {
				return;
			}

			const newPath = `/${base}`;
			if (newPath === oldPath || paths.includes(newPath)) {
				return;
			}

			setPaths((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
			setFiles((prev) => {
				const { [oldPath]: renamed, ...rest } = prev;

				return { ...rest, [newPath]: renamed ?? "" };
			});

			if (activePath === oldPath) {
				setActivePath(newPath);
			}

			const pending = pendingGoTo.current;
			if (pending?.fileName === oldPath) {
				pendingGoTo.current = { fileName: newPath, pos: pending.pos };
			}
		},
		[activePath, paths],
	);

	const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

	const clearWorkspace = useCallback(() => {
		setFiles({ "/playground.tsx": "" });
		setPaths(["/playground.tsx"]);
		setActivePath("/playground.tsx");
	}, []);

	const resetWorkspace = useCallback(() => {
		setFiles({ ...DEFAULT_FILES });
		setPaths([...INITIAL_PATHS]);
		setActivePath("/playground.tsx");
	}, []);

	const copyShareUrl = useCallback(() => {
		const filesForShare: Record<string, string> = {};
		for (const path of paths) {
			filesForShare[path] = files[path] ?? "";
		}

		const url = `${globalThis.location.origin}${globalThis.location.pathname}#${encodeWorkspace(
			{
				activePath,
				files: filesForShare,
				paths,
			},
		)}`;

		navigator.clipboard.writeText(url).then(() => {
			setCopyState("copied");
			globalThis.setTimeout(() => {
				setCopyState("idle");
			}, 1500);
		});
	}, [activePath, files, paths]);

	const startColumnResize = useCallback(
		(handle: "left" | "right", event: ReactPointerEvent<HTMLButtonElement>) => {
			const workspace = workspaceRef.current;

			if (!workspace) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);
			event.preventDefault();

			const startX = event.clientX;
			const startSidebarWidth = sidebarWidth;
			const startMainWidth = mainWidth;
			const workspaceWidth = workspace.getBoundingClientRect().width;

			const onPointerMove = (moveEvent: PointerEvent) => {
				const delta = moveEvent.clientX - startX;

				if (handle === "left") {
					const maxSidebarWidth =
						workspaceWidth - MIN_MAIN_WIDTH - MIN_OUTPUT_WIDTH;
					const nextSidebarWidth = clamp(
						startSidebarWidth + delta,
						MIN_SIDEBAR_WIDTH,
						Math.max(MIN_SIDEBAR_WIDTH, maxSidebarWidth),
					);
					setSidebarWidth(nextSidebarWidth);

					return;
				}

				const maxMainWidth = workspaceWidth - sidebarWidth - MIN_OUTPUT_WIDTH;
				const nextMainWidth = clamp(
					startMainWidth + delta,
					MIN_MAIN_WIDTH,
					Math.max(MIN_MAIN_WIDTH, maxMainWidth),
				);
				setMainWidth(nextMainWidth);
			};

			const onPointerUp = () => {
				globalThis.removeEventListener("pointermove", onPointerMove);
				globalThis.removeEventListener("pointerup", onPointerUp);
			};

			globalThis.addEventListener("pointermove", onPointerMove);
			globalThis.addEventListener("pointerup", onPointerUp, { once: true });
		},
		[mainWidth, sidebarWidth],
	);

	const startRowResize = useCallback(
		(event: ReactPointerEvent<HTMLButtonElement>) => {
			const mainColumn = mainColumnRef.current;

			if (!mainColumn) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);
			event.preventDefault();

			const startY = event.clientY;
			const startEditorPercent = editorPercent;
			const mainHeight = mainColumn.getBoundingClientRect().height;

			const onPointerMove = (moveEvent: PointerEvent) => {
				const deltaPercent = ((moveEvent.clientY - startY) / mainHeight) * 100;
				setEditorPercent(
					clamp(
						startEditorPercent + deltaPercent,
						MIN_EDITOR_PERCENT,
						MAX_EDITOR_PERCENT,
					),
				);
			};

			const onPointerUp = () => {
				globalThis.removeEventListener("pointermove", onPointerMove);
				globalThis.removeEventListener("pointerup", onPointerUp);
			};

			globalThis.addEventListener("pointermove", onPointerMove);
			globalThis.addEventListener("pointerup", onPointerUp, { once: true });
		},
		[editorPercent],
	);

	const activeSource = files[activePath] ?? "";

	const workspaceIsDefault = useMemo(
		() => isDefaultWorkspace(paths, files, activePath),
		[activePath, files, paths],
	);

	const workspaceIsCleared = useMemo(
		() => isClearedWorkspace(paths, files),
		[files, paths],
	);

	const playgroundSettingsProps: PlaygroundSettingsContentProps = {
		activePath,
		addFile,
		clearWorkspace,
		clearWorkspaceDisabled: workspaceIsCleared,
		commitRename,
		completeRemoveFile,
		copyShareUrl,
		copyState,
		paths,
		removeFile,
		renameInputRef,
		removingPaths,
		renamingPath,
		resetWorkspace,
		resetWorkspaceDisabled: workspaceIsDefault,
		setActivePath,
		setRenamingPath,
		skipRenameCommit,
	};

	return (
		<section className={styles.playground} aria-label="Flint playground">
			{compactLayout ? (
				<div className={styles.workspaceCompact}>
					<div
						className={styles.compactMainTabBar}
						role="tablist"
						aria-label="Playground"
					>
						<button
							aria-controls="pg-compact-pane-settings"
							aria-selected={compactTab === "settings"}
							className={styles.compactTab}
							id="pg-compact-tab-settings"
							onClick={() => {
								setCompactTab("settings");
							}}
							role="tab"
							type="button"
						>
							Settings
						</button>
						<button
							aria-controls="pg-compact-pane-code"
							aria-selected={compactTab === "code"}
							className={styles.compactTab}
							id="pg-compact-tab-code"
							onClick={() => {
								setCompactTab("code");
							}}
							role="tab"
							type="button"
						>
							Code
						</button>
						<button
							aria-controls="pg-compact-pane-diagnostics"
							aria-selected={compactTab === "diagnostics"}
							className={styles.compactTab}
							id="pg-compact-tab-diagnostics"
							onClick={() => {
								setCompactTab("diagnostics");
							}}
							role="tab"
							type="button"
						>
							Diagnostics
						</button>
						<button
							aria-controls="pg-compact-pane-console"
							aria-selected={compactTab === "console"}
							className={styles.compactTab}
							id="pg-compact-tab-console"
							onClick={() => {
								setCompactTab("console");
							}}
							role="tab"
							type="button"
						>
							Console
						</button>
						<button
							aria-controls="pg-compact-pane-ast"
							aria-selected={compactTab === "ast"}
							className={styles.compactTab}
							id="pg-compact-tab-ast"
							onClick={() => {
								setCompactTab("ast");
							}}
							role="tab"
							type="button"
						>
							AST
						</button>
					</div>
					<div className={styles.compactPrimaryBody}>
						<div
							aria-labelledby="pg-compact-tab-settings"
							className={styles.compactPanel}
							hidden={compactTab !== "settings"}
							id="pg-compact-pane-settings"
							role="tabpanel"
						>
							<div
								className={clsx(
									styles.compactPanelScroll,
									styles.compactScrollPad,
								)}
							>
								<div className={styles.sidebarCompactWrap}>
									<PlaygroundSettingsContent {...playgroundSettingsProps} />
								</div>
							</div>
						</div>
						<div
							aria-labelledby="pg-compact-tab-code"
							className={styles.compactPanel}
							hidden={compactTab !== "code"}
							id="pg-compact-pane-code"
							role="tabpanel"
						>
							<div className={styles.compactCodeColumn}>
								<div className={styles.compactFileTabRow}>
									<div
										className={styles.compactFileTabBar}
										role="tablist"
										aria-label="Project files"
									>
										{paths.map((path) => {
											const label = path.replace(/^\//u, "");
											const suffix = filePathTabIdSuffix(path);

											return (
												<button
													aria-controls="pg-compact-code-editor-panel"
													aria-selected={path === activePath}
													className={styles.compactFileTab}
													id={`pg-file-tab-${suffix}`}
													key={path}
													onClick={() => {
														setActivePath(path);
													}}
													role="tab"
													title={label}
													type="button"
												>
													{label}
												</button>
											);
										})}
									</div>
									<button
										aria-label="Manage files in Settings"
										className={styles.compactFileTabAdd}
										onClick={() => {
											setCompactTab("settings");
										}}
										type="button"
									>
										+
									</button>
								</div>
								<div
									className={styles.editor}
									aria-labelledby={`pg-file-tab-${filePathTabIdSuffix(activePath)}`}
									id="pg-compact-code-editor-panel"
									role="tabpanel"
								>
									<div className={styles.editorBody}>
										<CodeMirror
											basicSetup={{
												foldGutter: false,
												highlightActiveLineGutter: true,
												highlightActiveLine: true,
											}}
											className={styles.codeMirror}
											extensions={extensions}
											height="100%"
											key={activePath}
											onChange={(value) => {
												setFiles((prev) => ({
													...prev,
													[activePath]: value,
												}));
											}}
											onCreateEditor={(view) => {
												editorViewRef.current = view;
											}}
											theme={starlightTheme}
											value={activeSource}
										/>
									</div>
								</div>
							</div>
						</div>
						<div
							aria-labelledby="pg-compact-tab-diagnostics"
							className={clsx(
								styles.compactPanel,
								styles.compactPanelScroll,
								styles.compactScrollPad,
							)}
							hidden={compactTab !== "diagnostics"}
							id="pg-compact-pane-diagnostics"
							role="tabpanel"
						>
							{error ? (
								<p className={styles.empty}>{error}</p>
							) : (
								<Diagnostics
									diagnostics={sortedDiagnostics}
									files={files}
									onGoTo={goToDiagnostic}
								/>
							)}
						</div>
						<div
							aria-labelledby="pg-compact-tab-console"
							className={clsx(
								styles.compactPanel,
								styles.compactPanelScroll,
								styles.compactScrollPad,
							)}
							hidden={compactTab !== "console"}
							id="pg-compact-pane-console"
							role="tabpanel"
						>
							{error ? (
								<p className={styles.empty}>{error}</p>
							) : (
								<ConsoleDiagnostics
									diagnostics={sortedDiagnostics}
									files={files}
									onGoTo={goToDiagnostic}
								/>
							)}
						</div>
						<div
							aria-labelledby="pg-compact-tab-ast"
							className={clsx(
								styles.compactPanel,
								styles.compactPanelScroll,
								styles.compactAstPanel,
							)}
							hidden={compactTab !== "ast"}
							id="pg-compact-pane-ast"
							role="tabpanel"
						>
							{error ? (
								<p className={styles.empty}>{error}</p>
							) : (
								<Ast
									activePath={result?.activePath ?? activePath}
									ast={result?.ast}
									theme={starlightTheme}
								/>
							)}
						</div>
					</div>
				</div>
			) : (
				<div
					className={styles.workspace}
					ref={workspaceRef}
					style={{
						gridTemplateColumns: `${sidebarWidth}px 0.5rem ${mainWidth}px 0.5rem minmax(${MIN_OUTPUT_WIDTH}px, 1fr)`,
					}}
				>
					<aside className={styles.sidebar} aria-label="Playground settings">
						<PlaygroundSettingsContent {...playgroundSettingsProps} />
					</aside>

					<button
						aria-label="Resize settings pane"
						className={styles.columnResizeHandle}
						onPointerDown={(event) => {
							startColumnResize("left", event);
						}}
						type="button"
					/>

					<div
						className={styles.mainColumn}
						ref={mainColumnRef}
						style={{
							gridTemplateRows: `minmax(8rem, ${editorPercent}%) 0.5rem minmax(6rem, 1fr)`,
						}}
					>
						<div className={styles.editor}>
							<div className={styles.editorBody}>
								<CodeMirror
									basicSetup={{
										foldGutter: false,
										highlightActiveLineGutter: true,
										highlightActiveLine: true,
									}}
									className={styles.codeMirror}
									extensions={extensions}
									height="100%"
									key={activePath}
									onChange={(value) => {
										setFiles((prev) => ({ ...prev, [activePath]: value }));
									}}
									onCreateEditor={(view) => {
										editorViewRef.current = view;
									}}
									theme={starlightTheme}
									value={activeSource}
								/>
							</div>
						</div>

						<button
							aria-label="Resize code and diagnostics panes"
							className={styles.rowResizeHandle}
							onPointerDown={startRowResize}
							type="button"
						/>

						<div className={styles.diagnosticsPanel} ref={diagnosticsPanelRef}>
							<div
								className={styles.diagnosticsTabs}
								role="tablist"
								aria-label="Code output"
							>
								<button
									aria-selected={diagnosticsTab === "diagnostics"}
									className={styles.diagnosticsTab}
									onClick={() => {
										setDiagnosticsTab("diagnostics");
									}}
									role="tab"
									type="button"
								>
									Diagnostics
								</button>
								<button
									aria-selected={diagnosticsTab === "console"}
									className={styles.diagnosticsTab}
									onClick={() => {
										setDiagnosticsTab("console");
									}}
									role="tab"
									type="button"
								>
									Console
								</button>
							</div>
							<div className={styles.diagnosticsBody} ref={diagnosticsBodyRef}>
								{error ? (
									<p className={styles.empty}>{error}</p>
								) : diagnosticsTab === "console" ? (
									<ConsoleDiagnostics
										diagnostics={sortedDiagnostics}
										files={files}
										onGoTo={goToDiagnostic}
									/>
								) : (
									<Diagnostics
										diagnostics={sortedDiagnostics}
										files={files}
										onGoTo={goToDiagnostic}
									/>
								)}
							</div>
						</div>
					</div>

					<button
						aria-label="Resize output pane"
						className={styles.columnResizeHandle}
						onPointerDown={(event) => {
							startColumnResize("right", event);
						}}
						type="button"
					/>

					<div className={styles.panel}>
						<div
							className={styles.outputTabs}
							role="tablist"
							aria-label="Output"
						>
							<button
								aria-selected="true"
								className={styles.outputTab}
								role="tab"
								type="button"
							>
								AST
							</button>
						</div>
						<div aria-label="AST" className={styles.panelBody} role="tabpanel">
							{error ? (
								<p className={styles.empty}>{error}</p>
							) : (
								<Ast
									activePath={result?.activePath ?? activePath}
									ast={result?.ast}
									theme={starlightTheme}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
