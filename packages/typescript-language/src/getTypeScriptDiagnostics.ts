import type { Diagnostic, Program } from "typescript-native/sync";

export interface GetTypeScriptDiagnosticsOptions {
	/**
	 * Whether to include diagnostics about the program's configuration, rather
	 * than about the file itself. A file with no tsconfig lands in TypeScript's
	 * inferred project, whose synthesized compiler options are not the user's
	 * and can report errors (such as TS5096) that nothing in the file can fix.
	 */
	includeConfigurationDiagnostics?: boolean;
}

interface ProgramDiagnostics {
	configuration: readonly Diagnostic[];
	global: readonly Diagnostic[];
}

// Programs are handed out once per snapshot, and every file linted in one
// shares its program-wide diagnostics. Asking for global diagnostics is
// expensive in the native process, so they are asked for once per program.
const programDiagnosticsByProgram = new WeakMap<Program, ProgramDiagnostics>();

export function getTypeScriptDiagnostics(
	program: Program,
	fileName: string,
	{
		includeConfigurationDiagnostics = true,
	}: GetTypeScriptDiagnosticsOptions = {},
): readonly Diagnostic[] {
	const programDiagnostics = getProgramDiagnostics(program);
	const diagnostics = [
		...(includeConfigurationDiagnostics
			? programDiagnostics.configuration
			: []),
		...program.getSyntacticDiagnostics(fileName),
		// Global diagnostics also carry option errors, which are the only kind
		// with no file to attach to.
		...programDiagnostics.global.filter(
			(diagnostic) => includeConfigurationDiagnostics || diagnostic.fileName,
		),
		...program.getSemanticDiagnostics(fileName),
	];

	const { composite, declaration } = program.getCompilerOptions();
	if (declaration || composite) {
		diagnostics.push(...program.getDeclarationDiagnostics(fileName));
	}

	diagnostics.sort(compareDiagnostics);
	return diagnostics.filter((diagnostic, index) => {
		const previousDiagnostic = diagnostics[index - 1];
		return (
			previousDiagnostic === undefined ||
			!diagnosticsEqual(diagnostic, previousDiagnostic)
		);
	});
}

function compareDiagnostics(left: Diagnostic, right: Diagnostic): number {
	return (
		compareValues(left.fileName, right.fileName) ||
		compareValues(left.pos, right.pos) ||
		compareValues(left.end - left.pos, right.end - right.pos) ||
		compareValues(left.code, right.code) ||
		compareValues(left.text, right.text) ||
		compareMessageChains(left.messageChain, right.messageChain) ||
		compareRelatedInformation(left.relatedInformation, right.relatedInformation)
	);
}

function compareMessageChainContents(
	left: readonly Diagnostic[] | undefined,
	right: readonly Diagnostic[] | undefined,
): number {
	if (left === undefined || right === undefined) {
		return 0;
	}

	for (let index = 0; index < left.length; index += 1) {
		const leftDiagnostic = left[index];
		const rightDiagnostic = right[index];
		if (leftDiagnostic === undefined || rightDiagnostic === undefined) {
			return 0;
		}
		const comparison =
			compareValues(leftDiagnostic.text, rightDiagnostic.text) ||
			compareMessageChainContents(
				leftDiagnostic.messageChain,
				rightDiagnostic.messageChain,
			);
		if (comparison) {
			return comparison;
		}
	}
	return 0;
}

function compareMessageChains(
	left: readonly Diagnostic[] | undefined,
	right: readonly Diagnostic[] | undefined,
): number {
	return (
		compareMessageChainShapes(left, right) ||
		compareMessageChainContents(left, right)
	);
}

function compareMessageChainShapes(
	left: readonly Diagnostic[] | undefined,
	right: readonly Diagnostic[] | undefined,
): number {
	if (left === undefined || right === undefined) {
		return left === right ? 0 : left === undefined ? 1 : -1;
	}
	if (left.length !== right.length) {
		return right.length - left.length;
	}

	for (let index = 0; index < left.length; index += 1) {
		const leftDiagnostic = left[index];
		const rightDiagnostic = right[index];
		if (leftDiagnostic === undefined || rightDiagnostic === undefined) {
			return 0;
		}
		const comparison = compareMessageChainShapes(
			leftDiagnostic.messageChain,
			rightDiagnostic.messageChain,
		);
		if (comparison) {
			return comparison;
		}
	}
	return 0;
}

function compareRelatedInformation(
	left: readonly Diagnostic[] | undefined,
	right: readonly Diagnostic[] | undefined,
): number {
	if (left === undefined || right === undefined) {
		return left === right ? 0 : left === undefined ? 1 : -1;
	}
	if (left.length !== right.length) {
		return right.length - left.length;
	}

	for (let index = 0; index < left.length; index += 1) {
		const leftDiagnostic = left[index];
		const rightDiagnostic = right[index];
		if (leftDiagnostic === undefined || rightDiagnostic === undefined) {
			return 0;
		}
		const comparison = compareDiagnostics(leftDiagnostic, rightDiagnostic);
		if (comparison) {
			return comparison;
		}
	}
	return 0;
}

function compareValues<T>(
	left: null | T | undefined,
	right: null | T | undefined,
): number {
	if (left === right) {
		return 0;
	}
	if (left == null) {
		return -1;
	}
	if (right == null) {
		return 1;
	}
	return left < right ? -1 : 1;
}

function diagnosticsEqual(left: Diagnostic, right: Diagnostic): boolean {
	return (
		left.fileName === right.fileName &&
		left.pos === right.pos &&
		left.end === right.end &&
		left.code === right.code &&
		left.text === right.text &&
		compareMessageChains(left.messageChain, right.messageChain) === 0 &&
		compareRelatedInformation(
			left.relatedInformation,
			right.relatedInformation,
		) === 0
	);
}

function getProgramDiagnostics(program: Program): ProgramDiagnostics {
	let programDiagnostics = programDiagnosticsByProgram.get(program);
	if (!programDiagnostics) {
		programDiagnostics = {
			configuration: [
				...program.getConfigFileParsingDiagnostics(),
				...program.getProgramDiagnostics(),
			],
			global: program.getGlobalDiagnostics(),
		};
		programDiagnosticsByProgram.set(program, programDiagnostics);
	}
	return programDiagnostics;
}
