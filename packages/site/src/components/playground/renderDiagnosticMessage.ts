import type { PlaygroundReport } from "~/playground/types.ts";

import { splitMessage } from "./splitMessage.ts";

/**
 * Renders a report for CodeMirror's hover tooltip, linking to its rule's docs.
 */
export function renderDiagnosticMessage(
	report: PlaygroundReport,
	languageName: string,
): HTMLElement {
	const container = document.createElement("div");
	const message = document.createElement("div");

	for (const part of splitMessage(report.message)) {
		message.append(part.isCode ? createElement("code", part.text) : part.text);
	}

	const details = createElement("div", "", "cm-playground-diagnostic-details");
	details.append(
		createElement(
			"span",
			report.source === "flint" ? "Flint" : languageName,
			"cm-playground-diagnostic-source",
		),
		" ",
	);

	if (report.url) {
		const link = createElement("a", report.id);
		link.href = report.url;
		link.rel = "noreferrer";
		link.target = "_blank";
		link.append(createElement("span", " (opens in a new tab)", "sr-only"));
		details.append(link);
	} else {
		details.append(report.id);
	}

	container.append(message, details);

	return container;
}

function createElement<Tag extends keyof HTMLElementTagNameMap>(
	tag: Tag,
	text: string,
	className?: string,
): HTMLElementTagNameMap[Tag] {
	const element = document.createElement(tag);
	element.textContent = text;

	if (className) {
		element.className = className;
	}

	return element;
}
