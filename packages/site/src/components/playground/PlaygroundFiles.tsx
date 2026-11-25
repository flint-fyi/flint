import { getFileNameError } from "~/playground/getFileNameError.ts";
import { playgroundExtensions } from "~/playground/getPlaygroundParser.ts";
import type { PlaygroundFile } from "~/playground/types.ts";
import { useEffect, useId, useRef, useState, type JSX } from "react";
import { createPortal } from "react-dom";

import { getPlaygroundFileType } from "./fileTypes.ts";
import styles from "./PlaygroundFiles.module.css";
import type { PlaygroundIcons } from "./PlaygroundIcons.ts";

const settleDelay = 500;

export interface PlaygroundFilesProps {
	activeFileName: string;
	files: PlaygroundFile[];
	icons: PlaygroundIcons;
	onAdd: (fileName: string) => void;
	onDelete: (fileName: string) => void;
	onRename: (fileName: string, newFileName: string) => void;
	onSelect: (fileName: string) => void;
}

export function PlaygroundFiles({
	activeFileName,
	files,
	onAdd,
	onDelete,
	onRename,
	onSelect,
}: PlaygroundFilesProps): JSX.Element {
	const [editing, setEditing] = useState<string | true>();
	const [hintContainer, setHintContainer] = useState<HTMLElement | null>(null);
	const fileNames = files.map((file) => file.name);

	return (
		<>
			<div className={styles.header}>
				<h2 className={styles.heading}>Files</h2>
				<button
					aria-label="New file"
					className={styles.iconButton}
					onClick={() => {
						setEditing(true);
					}}
					title="New file"
					type="button"
				>
					{icons.addIcon}
				</button>
			</div>
			<ul className={styles.files}>
				{files.map((file) =>
					editing === file.name ? (
						<li key={file.name}>
							<FileNameInput
								hintContainer={hintContainer}
								icons={icons}
								initialValue={file.name}
								label={`Rename ${file.name}`}
								onCancel={() => {
									setEditing(undefined);
								}}
								onSubmit={(newFileName) => {
									onRename(file.name, newFileName);
									setEditing(undefined);
								}}
								otherFileNames={fileNames.filter(
									(fileName) => fileName !== file.name,
								)}
							/>
						</li>
					) : (
						<li className={styles.file} key={file.name}>
							<button
								aria-current={file.name === activeFileName ? "true" : undefined}
								className={styles.fileButton}
								onClick={() => {
									onSelect(file.name);
								}}
								type="button"
							>
								<FileBadge fileName={file.name} icons={icons} />
								<span className={styles.fileName}>{file.name}</span>
							</button>
							<span className={styles.actions}>
								<button
									aria-label={`Rename ${file.name}`}
									className={styles.iconButton}
									onClick={() => {
										setEditing(file.name);
									}}
									title="Rename"
									type="button"
								>
									{icons.renameIcon}
								</button>
								{files.length > 1 && (
									<button
										aria-label={`Delete ${file.name}`}
										className={styles.iconButton}
										onClick={() => {
											onDelete(file.name);
										}}
										title="Delete"
										type="button"
									>
										{icons.deleteIcon}
									</button>
								)}
							</span>
						</li>
					),
				)}
				{editing === true && (
					<li>
						<FileNameInput
							hintContainer={hintContainer}
							icons={icons}
							initialValue=""
							label="New file name"
							onCancel={() => {
								setEditing(undefined);
							}}
							onSubmit={(fileName) => {
								onAdd(fileName);
								setEditing(undefined);
							}}
							otherFileNames={fileNames}
						/>
					</li>
				)}
			</ul>
			<div className={styles.hintContainer} ref={setHintContainer} />
		</>
	);
}

interface FileBadgeProps {
	fileName: string;
	icons: PlaygroundIcons;
}

function FileBadge({ fileName, icons }: FileBadgeProps): JSX.Element {
	const icon = getPlaygroundFileType(fileName)?.icon;

	return (
		<span aria-hidden="true" className={styles.badge} data-icon={icon}>
			{icon ? icons[icon] : "?"}
		</span>
	);
}

interface FileNameInputProps {
	hintContainer: HTMLElement | null;
	icons: PlaygroundIcons;
	initialValue: string;
	label: string;
	onCancel: () => void;
	onSubmit: (fileName: string) => void;
	otherFileNames: string[];
}

function FileNameInput({
	hintContainer,
	icons,
	initialValue,
	label,
	onCancel,
	onSubmit,
	otherFileNames,
}: FileNameInputProps): JSX.Element {
	const [value, setValue] = useState(initialValue);
	const [settledValue, setSettledValue] = useState(initialValue);
	const [isTouched, setIsTouched] = useState(false);
	const hintId = useId();
	const isFinished = useRef(false);
	const trimmedValue = value.trim();
	const error = getFileNameError(trimmedValue, otherFileNames);
	const visibleError = isTouched
		? error
		: settledValue === value
			? getFileNameError(trimmedValue, otherFileNames, true)
			: undefined;

	// Waits for typing to pause, so names with multiple dots such as
	// "index.test.ts" don't briefly look unsupported.
	useEffect(() => {
		const timeout = setTimeout(() => {
			setSettledValue(value);
		}, settleDelay);

		return (): void => {
			clearTimeout(timeout);
		};
	}, [value]);

	function finish(): void {
		if (isFinished.current) {
			return;
		}

		isFinished.current = true;

		if (error) {
			onCancel();
		} else {
			onSubmit(trimmedValue);
		}
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				setIsTouched(true);

				if (!error) {
					finish();
				}
			}}
		>
			<div className={styles.file} data-editing="true">
				<span className={styles.fileButton}>
					<FileBadge fileName={trimmedValue} icons={icons} />
					<input
						aria-describedby={hintId}
						aria-invalid={!!visibleError}
						aria-label={label}
						autoFocus
						className={styles.input}
						onBlur={finish}
						onChange={(event) => {
							setValue(event.target.value);
						}}
						onKeyDown={(event) => {
							if (event.key === "Escape") {
								isFinished.current = true;
								onCancel();
							}
						}}
						placeholder="example.ts"
						spellCheck={false}
						value={value}
					/>
				</span>
			</div>
			{hintContainer &&
				createPortal(
					<div aria-live="polite" className={styles.hint} id={hintId}>
						{visibleError && <p className={styles.error}>{visibleError}</p>}
						<p className={styles.supported}>
							Supported:{" "}
							{playgroundExtensions.map((extension) => (
								<code key={extension}>{extension}</code>
							))}
						</p>
						<p className={styles.note}>
							Flint also lints other file types, such as CSS, Markdown, and
							YAML, that the playground doesn&apos;t support yet.
						</p>
					</div>,
					hintContainer,
				)}
		</form>
	);
}
