import type { Diagnostic, Program } from "typescript-native/unstable/sync";

export function getTypeScriptDiagnostics(
	program: Program,
	fileName: string,
): readonly Diagnostic[] {
	const diagnostics = [
		...program.getConfigFileParsingDiagnostics(),
		...program.getProgramDiagnostics(),
		...program.getSyntacticDiagnostics(fileName),
		...program.getGlobalDiagnostics(),
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
		compareMessageChains(left.messageChain, right.messageChain) === 0
	);
}
