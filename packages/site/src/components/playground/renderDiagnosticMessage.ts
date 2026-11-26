import type { PlaygroundReport } from "~/playground/types.ts";

import { formatReport } from "@flint.fyi/core";

import { splitMessage } from "./splitMessage.ts";

/**
 * Renders a report for CodeMirror's hover tooltip, linking to its rule's docs.
 */
export function renderDiagnosticMessage(
	report: PlaygroundReport,
	parserName: string,
): HTMLElement {
	const container = document.createElement("div");
	const message = document.createElement("div");

	for (const part of splitMessage(
		formatReport(report.data, report.message.primary),
	)) {
		message.append(part.isCode ? createElement("code", part.text) : part.text);
	}

	const details = createElement("div", "", "cm-playground-diagnostic-details");
	details.append(
		createElement(
			"span",
			report.source === "flint" ? "Flint" : parserName,
			"cm-playground-diagnostic-source",
		),
		" ",
	);

	if (report.about.url) {
		const link = createElement("a", report.about.id);
		link.href = report.about.url;
		link.rel = "noreferrer";
		link.target = "_blank";
		link.append(createElement("span", " (opens in a new tab)", "sr-only"));
		details.append(link);
	} else {
		details.append(report.about.id);
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
