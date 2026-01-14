export class FlintAssertionError extends Error {
	constructor(message: string) {
		super(`Flint bug: ${message}.`);
		const issueUrl = buildIssueUrl(message, this.stack);
		this.message = `Flint bug: ${message}. Please report it here: ${issueUrl}`;
		if (this.stack) {
			const [, ...rest] = this.stack.split("\n");
			this.stack = [`FlintAssertionError: ${this.message}`, ...rest].join("\n");
		}
	}
}

export function assert(x: unknown, message: string): asserts x {
	if (!x) {
		throw new FlintAssertionError(message);
	}
}

export function nullThrows<T>(x: T, message: string): NonNullable<T> {
	assert(x != null, message);
	return x;
}
export function sanitizeStackTrace(stack: string): string {
	const pathRegex = /(?:[A-Z]:\\|\/)[^:\s)]+:\d+(?::\d+)?/gi;
	return stack.replace(pathRegex, (match) => {
		const normalized = match.replace(/\\/g, "/");
		const nodeModulesIndex = normalized.lastIndexOf("node_modules/");
		if (nodeModulesIndex !== -1) {
			return normalized.slice(nodeModulesIndex);
		}

		return "<censored filename>";
	});
}

function buildIssueUrl(message: string, stack: string | undefined): string {
	const issueUrl = new URL("https://github.com/flint-fyi/flint/issues/new");
	issueUrl.searchParams.set("template", "03-general-bug.yaml");

	const sanitizedStack = stack
		? sanitizeStackTrace(stack)
		: "No stacktrace available.";
	const body = [
		"Assertion message:",
		"",
		"```",
		message,
		"```",
		"",
		"Stacktrace:",
		"",
		"```",
		sanitizedStack,
		"```",
	].join("\n");

	issueUrl.searchParams.set("title", `🐛 Bug: ${message}`);
	issueUrl.searchParams.set("actual", body);
	issueUrl.searchParams.set(
		"additional_info",
		[
			"Process arguments:",
			"",
			"`" + (process.argv.slice(2).join(" ") || "<none>") + "`",
		].join("\n"),
	);
	return issueUrl.toString();
}
