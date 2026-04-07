// flint-disable-file ts/debugger*
// flint-disable-file ts/debuggerStatements

export function debug(value: unknown): void {
	debugger;
	console.log(value);
}
