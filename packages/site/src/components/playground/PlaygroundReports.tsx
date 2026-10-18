import type { PlaygroundReport } from "~/playground/types.ts";
import type { JSX } from "react";

import { PlaygroundMessage } from "./PlaygroundMessage.tsx";
import styles from "./PlaygroundReports.module.css";
import type { PlaygroundRange } from "./types.ts";

export interface PlaygroundReportsProps {
	languageName: string;
	onSelect: (range: PlaygroundRange) => void;
	reports: PlaygroundReport[];
}

export function PlaygroundReports({
	languageName,
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
							onSelect({ begin: report.begin, end: report.end });
						}}
						type="button"
					>
						{report.line + 1}:{report.column + 1}
						<span className="sr-only">
							{" "}
							(line {report.line + 1}, column {report.column + 1})
						</span>
					</button>
					<span className={styles.message}>
						{report.source === "flint" ? (
							<PlaygroundMessage message={report.message} />
						) : (
							report.message
						)}
					</span>
					<span className={styles.id}>
						<span className={styles.source}>
							{report.source === "flint" ? "Flint" : languageName}
						</span>{" "}
						{report.url ? (
							<a href={report.url} rel="noreferrer" target="_blank">
								{report.id}
								<span className="sr-only"> (opens in a new tab)</span>
							</a>
						) : (
							report.id
						)}
					</span>
				</li>
			))}
		</ol>
	);
}
