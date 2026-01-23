import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type { ReadonlyFlags } from "regexp-ast-analysis";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";
import {
	analyzeParentNode,
	createParser,
	type DisjunctionIssue,
	faToSource,
} from "./utils/regexDisjunctionAnalysis.ts";

function adjustPositionForEscapes(escaped: string, unescapedPos: number) {
	let escapedIndex = 0;
	let unescapedIndex = 0;

	while (unescapedIndex < unescapedPos && escapedIndex < escaped.length) {
		if (escaped[escapedIndex] === "\\" && escaped[escapedIndex + 1] === "\\") {
			escapedIndex += 2;
		} else {
			escapedIndex += 1;
		}
		unescapedIndex += 1;
	}

	return escapedIndex;
}

function getReportedNode(result: DisjunctionIssue) {
	return result.type === "NestedSubset" || result.type === "PrefixNestedSubset"
		? result.nested
		: result.alternative;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports duplicate or unreachable alternatives in regular expression disjunctions.",
		id: "regexDuplicateDisjunctions",
		presets: ["logical"],
	},
	messages: {
		duplicate: {
			primary: "Duplicate alternative '{{ alternative }}' in disjunction.",
			secondary: [
				"This alternative is identical to a previous one and can be removed.",
			],
			suggestions: ["Remove the duplicate alternative."],
		},
		nestedSubset: {
			primary:
				"Element '{{ nested }}' in '{{ alternative }}' is a subset of '{{ others }}' and is unreachable.",
			secondary: [
				"All paths through this element are already covered by a previous alternative.",
			],
			suggestions: ["Remove the unreachable element."],
		},
		overlap: {
			primary:
				"Alternative '{{ alternative }}' overlaps with '{{ others }}'. The overlap is '{{ overlap }}'.",
			secondary: ["This ambiguity may cause exponential backtracking."],
			suggestions: ["Refactor to eliminate the overlap."],
		},
		prefixNestedSubset: {
			primary:
				"Element '{{ nested }}' in '{{ alternative }}' is already covered by '{{ others }}'.",
			secondary: [
				"All paths through this element will never match because a previous alternative accepts first.",
			],
			suggestions: ["Remove the unreachable element."],
		},
		prefixSubset: {
			primary:
				"Alternative '{{ alternative }}' is already covered by '{{ others }}' and is unreachable.",
			secondary: [
				"This alternative will never match because a previous alternative always accepts first.",
			],
			suggestions: ["Remove the unreachable alternative."],
		},
		subset: {
			primary:
				"Alternative '{{ alternative }}' is a subset of '{{ others }}' and is unreachable.",
			secondary: [
				"This alternative will never match because a previous, more general alternative will always match first.",
			],
			suggestions: ["Remove the unreachable alternative."],
		},
		superset: {
			primary:
				"Alternative '{{ alternative }}' is a superset of '{{ others }}'.",
			secondary: [
				"The earlier alternative(s) might be removable. This ambiguity may cause exponential backtracking.",
			],
			suggestions: ["Remove the shadowed alternative(s)."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: RegExpAST.Pattern,
			flags: ReadonlyFlags,
			mapRange: (start: number, end: number) => { begin: number; end: number },
		) {
			const parser = createParser(pattern, flags);
			const issues: DisjunctionIssue[] = [];

			visitRegExpAST(pattern, {
				onAssertionEnter(node) {
					if (node.kind === "lookahead" || node.kind === "lookbehind") {
						issues.push(...analyzeParentNode(node, flags, parser));
					}
				},
				onCapturingGroupEnter(node) {
					issues.push(...analyzeParentNode(node, flags, parser));
				},
				onGroupEnter(node) {
					issues.push(...analyzeParentNode(node, flags, parser));
				},
				onPatternEnter(node) {
					issues.push(...analyzeParentNode(node, flags, parser));
				},
			});

			for (const issue of issues) {
				const reportedNode = getReportedNode(issue);
				const range = mapRange(reportedNode.start, reportedNode.end);
				const othersStr = issue.others.map((a) => a.raw).join("|");

				switch (issue.type) {
					case "Duplicate":
						context.report({
							data: {
								alternative: issue.alternative.raw,
							},
							message: "duplicate",
							range,
						});
						break;

					case "NestedSubset":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								nested: issue.nested.raw,
								others: othersStr,
							},
							message: "nestedSubset",
							range,
						});
						break;

					case "Overlap":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								others: othersStr,
								overlap: faToSource(issue.overlap, flags),
							},
							message: "overlap",
							range,
						});
						break;

					case "PrefixNestedSubset":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								nested: issue.nested.raw,
								others: othersStr,
							},
							message: "prefixNestedSubset",
							range,
						});
						break;

					case "PrefixSubset":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								others: othersStr,
							},
							message: "prefixSubset",
							range,
						});
						break;

					case "Subset":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								others: othersStr,
							},
							message: "subset",
							range,
						});
						break;

					case "Superset":
						context.report({
							data: {
								alternative: issue.alternative.raw,
								others: othersStr,
							},
							message: "superset",
							range,
						});
						break;
				}
			}
		}

		function checkRegexLiteral(
			node: ts.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flagsStr] = match;

			if (!pattern) {
				return;
			}

			const ast = parseRegexpAst(pattern, flagsStr);
			if (!ast) {
				return;
			}

			const nodeRange = getTSNodeRange(node, sourceFile);
			const nodeStart = nodeRange.begin;

			const flags = {
				dotAll: flagsStr?.includes("s") ?? false,
				global: flagsStr?.includes("g") ?? false,
				hasIndices: flagsStr?.includes("d") ?? false,
				ignoreCase: flagsStr?.includes("i") ?? false,
				multiline: flagsStr?.includes("m") ?? false,
				sticky: flagsStr?.includes("y") ?? false,
				unicode: flagsStr?.includes("u") ?? false,
				unicodeSets: flagsStr?.includes("v") ?? false,
			};

			const mapRange = (start: number, end: number) => ({
				begin: nodeStart + 1 + start,
				end: nodeStart + 1 + end,
			});

			checkPattern(ast, flags, mapRange);
		}

		function checkRegExpConstructor(
			node: ts.CallExpression | ts.NewExpression,
			services: TypeScriptFileServices,
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				(node.expression as ts.Identifier).text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const stringLiteral = firstArg as ts.StringLiteral;
			const rawText = stringLiteral.getText(services.sourceFile);
			const patternEscaped = rawText.slice(1, -1);
			const pattern = patternEscaped.replace(/\\\\/g, "\\");

			let flagsStr = "";
			if (args.length >= 2) {
				const secondArg = args[1];
				if (secondArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = (secondArg as ts.StringLiteral).getText(
						services.sourceFile,
					);
					flagsStr = flagsText.slice(1, -1);
				}
			}

			const ast = parseRegexpAst(pattern, flagsStr);
			if (!ast) {
				return;
			}

			const nodeStart = firstArg.getStart(services.sourceFile);

			const flags = {
				dotAll: flagsStr.includes("s"),
				global: flagsStr.includes("g"),
				hasIndices: flagsStr.includes("d"),
				ignoreCase: flagsStr.includes("i"),
				multiline: flagsStr.includes("m"),
				sticky: flagsStr.includes("y"),
				unicode: flagsStr.includes("u"),
				unicodeSets: flagsStr.includes("v"),
			};

			const mapRange = (start: number, end: number) => {
				const adjustedStart = adjustPositionForEscapes(patternEscaped, start);
				const adjustedEnd = adjustPositionForEscapes(patternEscaped, end);
				return {
					begin: nodeStart + 1 + adjustedStart,
					end: nodeStart + 1 + adjustedEnd,
				};
			};

			checkPattern(ast, flags, mapRange);
		}

		return {
			visitors: {
				CallExpression: checkRegExpConstructor,
				NewExpression: checkRegExpConstructor,
				RegularExpressionLiteral: checkRegexLiteral,
			},
		};
	},
});
