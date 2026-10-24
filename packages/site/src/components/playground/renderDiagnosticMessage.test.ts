// @vitest-environment happy-dom
import type { PlaygroundReport } from "~/playground/types.ts";
import { describe, expect, it } from "vitest";

import { renderDiagnosticMessage } from "./renderDiagnosticMessage.ts";

const report: PlaygroundReport = {
	begin: 0,
	column: 0,
	end: 5,
	id: "debuggerStatements",
	line: 0,
	message: "Remove this `debugger` statement.",
	source: "flint",
	url: "https://flint.fyi/rules/ts/debuggerstatements",
};

describe(renderDiagnosticMessage, () => {
	it("renders code in the message and links to the rule's docs", () => {
		const element = renderDiagnosticMessage(report, "TypeScript");

		expect(element.innerHTML).toBe(
			'<div>Remove this <code>debugger</code> statement.</div><div class="cm-playground-diagnostic-details"><span class="cm-playground-diagnostic-source">Flint</span> <a href="https://flint.fyi/rules/ts/debuggerstatements" rel="noreferrer" target="_blank">debuggerStatements<span class="sr-only"> (opens in a new tab)</span></a></div>',
		);
	});

	it("renders the language name and plain id for a language report without a url", () => {
		const element = renderDiagnosticMessage(
			{
				...report,
				id: "TS2304",
				message: "Cannot find name 'value'.",
				source: "language",
				url: undefined,
			},
			"TypeScript",
		);

		expect(element.innerHTML).toBe(
			'<div>Cannot find name \'value\'.</div><div class="cm-playground-diagnostic-details"><span class="cm-playground-diagnostic-source">TypeScript</span> TS2304</div>',
		);
	});

	it("renders message text as text rather than HTML", () => {
		const element = renderDiagnosticMessage(
			{ ...report, message: "Avoid `<img onerror=alert(1)>`." },
			"TypeScript",
		);

		expect(element.querySelector("img")).toBeNull();
		expect(element.querySelector("code")?.textContent).toBe(
			"<img onerror=alert(1)>",
		);
	});
});
