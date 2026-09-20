export class FlintAssertionError extends Error {
	readonly assertionMessage: string;

	constructor(message: string) {
		super(`Flint bug: ${message}.`);
		this.assertionMessage = message;
		this.name = "FlintAssertionError";
	}
}

export function addFlintAssertionContext(
	error: unknown,
	processArguments: string[],
): unknown {
	if (!(error instanceof FlintAssertionError)) {
		return error;
	}

	const originalHeader = `${error.name}: ${error.message}`;
	error.message += ` Please report it here: ${buildIssueUrl(error, processArguments)}`;
	if (error.stack?.startsWith(originalHeader)) {
		error.stack =
			`${error.name}: ${error.message}` +
			error.stack.slice(originalHeader.length);
	}
	return error;
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

function buildIssueUrl(
	error: FlintAssertionError,
	processArguments: string[],
): string {
	const issueUrl = new URL("https://github.com/flint-fyi/flint/issues/new");
	issueUrl.searchParams.set("template", "04-general-bug.yaml");

	const sanitizedStack = error.stack
		? sanitizeStackTrace(error.stack)
		: "No stacktrace available.";
	const body = [
		"Assertion message:",
		"",
		"```",
		error.assertionMessage,
		"```",
		"",
		"Stacktrace:",
		"",
		"```",
		sanitizedStack,
		"```",
	].join("\n");

	issueUrl.searchParams.set("title", `🐛 Bug: ${error.assertionMessage}`);
	issueUrl.searchParams.set("actual", body);
	issueUrl.searchParams.set(
		"additional_info",
		[
			"Process arguments:",
			"",
			"`" + (processArguments.join(" ") || "<none>") + "`",
		].join("\n"),
	);
	return issueUrl.toString();
}

/** @internal */
export function sanitizeStackTrace(stack: string): string {
	const pathRegex = /(?:[a-z]:\\|\/)[^:\s)]+:\d+(?::\d+)?/gi;
	return stack.replace(pathRegex, (match) => {
		const normalized = match.replace(/\\/g, "/");
		const nodeModulesIndex = normalized.lastIndexOf("node_modules/");
		if (nodeModulesIndex !== -1) {
			return normalized.slice(nodeModulesIndex);
		}

		return "<censored filename>";
	});
}
