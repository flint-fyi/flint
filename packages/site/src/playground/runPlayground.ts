import * as ts from "typescript";

import type {
	PlaygroundAstNode,
	PlaygroundDiagnostic,
	PlaygroundFile,
	PlaygroundResult,
} from "./types.ts";

interface PlaygroundRule {
	id: string;
	run(context: PlaygroundRuleContext): PlaygroundDiagnostic[];
}

interface PlaygroundRuleContext {
	code: string;
	sourceFile: ts.SourceFile;
}

const ignoredDiagnostics = new Set([
	2318, // Cannot find global type '{0}' in this intentionally tiny program.
]);

const playgroundRules: PlaygroundRule[] = [
	{
		id: "ts/debuggerStatements",
		run({ sourceFile }) {
			return collectMatchingNodes(sourceFile, ts.isDebuggerStatement).map(
				(node) =>
					createFlintDiagnostic(
						sourceFile,
						this.id,
						node,
						"Debugger statements should not be used in production code.",
					),
			);
		},
	},
	{
		id: "ts/equalityOperators",
		run({ sourceFile }) {
			return collectMatchingNodes(sourceFile, ts.isBinaryExpression)
				.filter((node) => {
					const operator = node.operatorToken.kind;
					return (
						(operator === ts.SyntaxKind.EqualsEqualsToken ||
							operator === ts.SyntaxKind.ExclamationEqualsToken) &&
						!isNullishLiteral(node.left) &&
						!isNullishLiteral(node.right)
					);
				})
				.map((node) => {
					const looseOperator = node.operatorToken.getText(sourceFile);
					const strictOperator = looseOperator === "==" ? "===" : "!==";

					return createFlintDiagnostic(
						sourceFile,
						this.id,
						node.operatorToken,
						`Use the more precise strict equality ('${strictOperator}') instead of the loose '${looseOperator}'.`,
					);
				});
		},
	},
	{
		id: "ts/emptyBlocks",
		run({ sourceFile }) {
			return collectMatchingNodes(sourceFile, isEmptyBlockLike).map((node) =>
				createFlintDiagnostic(
					sourceFile,
					this.id,
					node,
					"Empty block statements should be removed or contain code.",
				),
			);
		},
	},
	{
		id: "ts/objectShorthand",
		run({ sourceFile }) {
			return collectMatchingNodes(sourceFile, ts.isPropertyAssignment)
				.filter(isShorthandCandidate)
				.map((node) =>
					createFlintDiagnostic(
						sourceFile,
						this.id,
						node,
						ts.isIdentifier(node.initializer)
							? "Object properties where the key matches the value identifier can use shorthand syntax."
							: "Function expressions in object literals can use method shorthand syntax.",
					),
				);
		},
	},
];

export function runPlayground(
	files: PlaygroundFile[],
	activePath: string,
	requestId: number,
): PlaygroundResult {
	const contents = Object.fromEntries(files.map((f) => [f.path, f.content]));

	if (!(activePath in contents)) {
		throw new Error(`Active path "${activePath}" is not in the file list.`);
	}

	const { program, sourceFiles } = createProgram(contents);
	const activeSource = sourceFiles.get(activePath);

	if (!activeSource) {
		throw new Error("Active source file missing from program.");
	}

	return {
		activePath,
		ast: serializeNode(activeSource, activeSource),
		diagnostics: [
			...collectProgramDiagnostics(program),
			...runAllPlaygroundRules(sourceFiles),
		],
		requestId,
	};
}

function categoryFromTypeScript(
	category: ts.DiagnosticCategory,
): PlaygroundDiagnostic["category"] {
	switch (category) {
		case ts.DiagnosticCategory.Error: {
			return "error";
		}

		case ts.DiagnosticCategory.Suggestion: {
			return "suggestion";
		}

		case ts.DiagnosticCategory.Warning: {
			return "warning";
		}

		default: {
			return "info";
		}
	}
}

function collectMatchingNodes<Node extends ts.Node>(
	sourceFile: ts.SourceFile,
	predicate: (node: ts.Node) => node is Node,
): Node[] {
	const matches: Node[] = [];

	function visit(node: ts.Node) {
		if (predicate(node)) {
			matches.push(node);
		}

		node.forEachChild(visit);
	}

	visit(sourceFile);

	return matches;
}

function collectProgramDiagnostics(
	program: ts.Program,
): PlaygroundDiagnostic[] {
	return ts
		.getPreEmitDiagnostics(program)
		.filter((diagnostic) => !ignoredDiagnostics.has(diagnostic.code))
		.map(convertDiagnostic);
}

function convertDiagnostic(diagnostic: ts.Diagnostic): PlaygroundDiagnostic {
	const start = diagnostic.start ?? 0;
	const end = start + (diagnostic.length ?? 1);

	return {
		category: categoryFromTypeScript(diagnostic.category),
		code: String(diagnostic.code),
		end,
		fileName: diagnostic.file?.fileName ?? "",
		message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
		source: "typescript",
		start,
	};
}

function createFlintDiagnostic(
	sourceFile: ts.SourceFile,
	code: string,
	node: ts.Node,
	message: string,
): PlaygroundDiagnostic {
	return {
		category: "warning",
		code,
		end: node.getEnd(),
		fileName: sourceFile.fileName,
		message,
		source: "flint",
		start: node.getStart(sourceFile),
	};
}

function createMultiFileCompilerHost(
	sourceFiles: Map<string, ts.SourceFile>,
): ts.CompilerHost {
	return {
		fileExists(fileName) {
			return sourceFiles.has(fileName);
		},
		getCanonicalFileName(fileName) {
			return fileName;
		},
		getCurrentDirectory() {
			return "/";
		},
		getDefaultLibFileName() {
			return "lib.d.ts";
		},
		getNewLine() {
			return "\n";
		},
		getSourceFile(fileName) {
			return sourceFiles.get(fileName);
		},
		readFile(fileName) {
			return sourceFiles.get(fileName)?.text;
		},
		useCaseSensitiveFileNames() {
			return true;
		},
		writeFile() {
			// no emit
		},
	};
}

function createProgram(contents: Record<string, string>): {
	program: ts.Program;
	sourceFiles: Map<string, ts.SourceFile>;
} {
	const paths = Object.keys(contents);
	const sourceFiles = new Map<string, ts.SourceFile>();

	for (const path of paths) {
		sourceFiles.set(
			path,
			ts.createSourceFile(
				path,
				contents[path] ?? "",
				ts.ScriptTarget.Latest,
				true,
				scriptKindForPath(path),
			),
		);
	}

	const compilerOptions: ts.CompilerOptions = {
		allowJs: true,
		jsx: ts.JsxEmit.ReactJSX,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		noEmit: true,
		noLib: true,
		strict: true,
		target: ts.ScriptTarget.ESNext,
	};
	const host = createMultiFileCompilerHost(sourceFiles);
	const program = ts.createProgram(paths, compilerOptions, host);

	return { program, sourceFiles };
}

function getPropertyKeyText(name: ts.PropertyName) {
	if (
		ts.isIdentifier(name) ||
		ts.isNumericLiteral(name) ||
		ts.isStringLiteral(name)
	) {
		return name.text;
	}

	return undefined;
}

function hasInnerText(node: ts.Block) {
	const openBrace = node.getStart(node.getSourceFile()) + 1;
	const closeBrace = node.getEnd() - 1;

	return /\S+/.test(node.getSourceFile().text.slice(openBrace, closeBrace));
}

function isEmptyBlockLike(node: ts.Node): node is ts.Block | ts.CaseBlock {
	if (ts.isBlock(node)) {
		return (
			!allowedEmptyBlockParents.has(node.parent.kind) &&
			!node.statements.length &&
			!hasInnerText(node)
		);
	}

	return ts.isCaseBlock(node) && !node.clauses.length;
}

function isNullishLiteral(node: ts.Expression) {
	return (
		node.kind === ts.SyntaxKind.NullKeyword ||
		node.kind === ts.SyntaxKind.UndefinedKeyword ||
		(ts.isIdentifier(node) && node.text === "undefined")
	);
}

function isShorthandCandidate(node: ts.PropertyAssignment) {
	const key = getPropertyKeyText(node.name);
	if (key == null) {
		return false;
	}

	if (ts.isIdentifier(node.initializer)) {
		return node.initializer.text === key && isValidIdentifier(key);
	}

	return (
		ts.isFunctionExpression(node.initializer) && node.initializer.name == null
	);
}

function isValidIdentifier(name: string) {
	return /^[\p{ID_Start}$_][\p{ID_Continue}$]*$/u.test(name);
}

function runAllPlaygroundRules(
	sourceFiles: Map<string, ts.SourceFile>,
): PlaygroundDiagnostic[] {
	const out: PlaygroundDiagnostic[] = [];

	for (const sourceFile of sourceFiles.values()) {
		out.push(...runPlaygroundRules(sourceFile.text, sourceFile));
	}

	return out;
}

function runPlaygroundRules(
	code: string,
	sourceFile: ts.SourceFile,
): PlaygroundDiagnostic[] {
	const context = { code, sourceFile };

	return playgroundRules.flatMap((rule) => rule.run(context));
}

function scriptKindForPath(fileName: string): ts.ScriptKind {
	if (fileName.endsWith(".tsx")) {
		return ts.ScriptKind.TSX;
	}

	if (fileName.endsWith(".jsx")) {
		return ts.ScriptKind.JSX;
	}

	if (fileName.endsWith(".ts")) {
		return ts.ScriptKind.TS;
	}

	return ts.ScriptKind.JS;
}

function serializeNode(
	node: ts.Node,
	sourceFile: ts.SourceFile,
	depth = 0,
): PlaygroundAstNode {
	const serialized: PlaygroundAstNode = {
		children: [],
		end: node.end,
		kind: ts.SyntaxKind[node.kind] || `SyntaxKind ${node.kind}`,
		pos: node.pos,
	};

	if (depth < 2) {
		const text = node.getText(sourceFile);
		if (text.length <= 80 && !text.includes("\n")) {
			serialized.text = text;
		}
	}

	if (depth >= 8) {
		return serialized;
	}

	node.forEachChild((child) => {
		serialized.children.push(serializeNode(child, sourceFile, depth + 1));
	});

	return serialized;
}

const allowedEmptyBlockParents = new Set([
	ts.SyntaxKind.ArrowFunction,
	ts.SyntaxKind.CatchClause,
	ts.SyntaxKind.Constructor,
	ts.SyntaxKind.FunctionDeclaration,
	ts.SyntaxKind.FunctionExpression,
	ts.SyntaxKind.GetAccessor,
	ts.SyntaxKind.MethodDeclaration,
	ts.SyntaxKind.SetAccessor,
]);
