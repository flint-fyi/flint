import type { PlaygroundRange, PlaygroundReport } from "~/playground/types.ts";
import type { JSX } from "react";

import { formatReport } from "@flint.fyi/core";

import { PlaygroundMessage } from "./PlaygroundMessage.tsx";
import styles from "./PlaygroundReports.module.css";

export interface PlaygroundReportsProps {
	parserName: string;
	onSelect: (range: PlaygroundRange) => void;
	reports: PlaygroundReport[];
}

export function PlaygroundReports({
	parserName,
	onSelect,
	reports,
}: PlaygroundReportsProps): JSX.Element {
	if (!reports.length) {
		return <p className={styles.empty}>No reports. Nice! 🎉</p>;
	}

	return (
		<ol className={styles.reports}>
			{reports.map((report, index) => (
				<li className={styles.report} data-source={report.source} key={index}>
					<button
						className={styles.location}
						onClick={() => {
							onSelect({
								begin: report.range.begin.raw,
								end: report.range.end.raw,
							});
						}}
						type="button"
					>
						{report.range.begin.line + 1}:{report.range.begin.column + 1}
						<span className="sr-only">
							{" "}
							(line {report.range.begin.line + 1}, column{" "}
							{report.range.begin.column + 1})
						</span>
					</button>
					<span className={styles.message}>
						{report.source === "flint" ? (
							<PlaygroundMessage
								message={formatReport(report.data, report.message.primary)}
							/>
						) : (
							formatReport(report.data, report.message.primary)
						)}
					</span>
					<span className={styles.id}>
						<span className={styles.source}>
							{report.source === "flint" ? "Flint" : parserName}
						</span>{" "}
						{report.about.url ? (
							<a href={report.about.url} rel="noreferrer" target="_blank">
								{report.about.id}
								<span className="sr-only"> (opens in a new tab)</span>
							</a>
						) : (
							report.about.id
						)}
					</span>
				</li>
			))}
		</ol>
	);
}
