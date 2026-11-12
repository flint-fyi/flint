/**
 * Whether an error came from TypeScript's native process exiting, as opposed
 * to the process answering a request with an error. Every later request to
 * the same process fails the same way.
 */
export function isNativeProcessFailure(error: unknown): boolean {
	if (error instanceof AggregateError) {
		return error.errors.some(isNativeProcessFailure);
	}

	return (
		error instanceof Error &&
		/EBADF|EPIPE|Unexpected EOF while reading from child process/.test(
			error.message,
		)
	);
}
