import type { PlaygroundAstNode, PlaygroundRange } from "~/playground/types.ts";
import { useState, type JSX, type ReactNode } from "react";

import styles from "./PlaygroundAst.module.css";

export interface PlaygroundAstProps {
	ast: PlaygroundAstNode;
	onSelect: (range: PlaygroundRange) => void;
}

const initiallyOpenDepth = 3;

export function PlaygroundAst({
	ast,
	onSelect,
}: PlaygroundAstProps): JSX.Element {
	return (
		<ul className={styles.ast}>
			<AstNode depth={0} node={ast} onSelect={onSelect} />
		</ul>
	);
}

interface AstNodeProps {
	depth: number;
	label?: string;
	node: PlaygroundAstNode;
	onSelect: (range: PlaygroundRange) => void;
}

function AstNode({ depth, label, node, onSelect }: AstNodeProps): JSX.Element {
	const properties = Object.entries(node.properties);

	return (
		<AstBranch
			depth={depth}
			childCount={properties.length}
			name={`${label ? `${label} ` : ""}${node.kind}`}
			summary={
				<>
					{label && <span className={styles.label}>{label}: </span>}
					<button
						className={styles.kind}
						onClick={() => {
							onSelect({ begin: node.start, end: node.end });
						}}
						title="Select in editor"
						type="button"
					>
						{node.kind}
					</button>
					{node.text !== undefined && (
						<span className={styles.text}> {JSON.stringify(node.text)}</span>
					)}
					<span className={styles.range}>
						{" "}
						[{node.start}, {node.end}]
					</span>
				</>
			}
		>
			{properties.map(([key, value]) =>
				Array.isArray(value) ? (
					<AstBranch
						depth={depth + 1}
						childCount={value.length}
						key={key}
						name={key}
						summary={
							<>
								<span className={styles.label}>{key}: </span>
								<span className={styles.range}>[{value.length}]</span>
							</>
						}
					>
						{value.map((child, index) => (
							<AstNode
								depth={depth + 2}
								key={index}
								label={String(index)}
								node={child}
								onSelect={onSelect}
							/>
						))}
					</AstBranch>
				) : (
					<AstNode
						depth={depth + 1}
						key={key}
						label={key}
						node={value}
						onSelect={onSelect}
					/>
				),
			)}
		</AstBranch>
	);
}

interface AstBranchProps {
	childCount: number;
	children: ReactNode;
	depth: number;
	name: string;
	summary: ReactNode;
}

function AstBranch({
	childCount,
	children,
	depth,
	name,
	summary,
}: AstBranchProps): JSX.Element {
	const [isOpen, setIsOpen] = useState(depth < initiallyOpenDepth);

	if (!childCount) {
		return <li className={styles.leaf}>{summary}</li>;
	}

	return (
		<li className={styles.branch}>
			<button
				aria-expanded={isOpen}
				aria-label={name}
				className={styles.toggle}
				onClick={() => {
					setIsOpen(!isOpen);
				}}
				type="button"
			/>
			{summary}
			{isOpen && <ul className={styles.children}>{children}</ul>}
		</li>
	);
}
