import {
	parseRegExpLiteral,
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface Issue {
	duplicate: RegExpAST.Alternative;
	end: number;
	original: RegExpAST.Alternative;
	start: number;
}

type ParentNode =
	| RegExpAST.CapturingGroup
	| RegExpAST.Group
	| RegExpAST.LookaheadAssertion
	| RegExpAST.LookbehindAssertion
	| RegExpAST.Pattern;

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

function alternativesEqual(
	a: RegExpAST.Alternative,
	b: RegExpAST.Alternative,
): boolean {
	if (a.elements.length !== b.elements.length) {
		return false;
	}

	for (let i = 0; i < a.elements.length; i++) {
		const aElement = a.elements[i];
		const bElement = b.elements[i];
		if (!aElement || !bElement) {
			return false;
		}
		if (aElement.raw !== bElement.raw) {
			return false;
		}
	}

	return true;
}

function findDuplicateDisjunctions(parentNode: ParentNode): Issue[] {
	const issues: Issue[] = [];
	const alternatives = parentNode.alternatives;

	if (alternatives.length < 2) {
		return issues;
	}

	for (let i = 0; i < alternatives.length; i++) {
		const current = alternatives[i];
		if (!current) {
			continue;
		}

		for (let j = i + 1; j < alternatives.length; j++) {
			const other = alternatives[j];
			if (!other) {
				continue;
			}

			if (alternativesEqual(current, other)) {
				issues.push({
					duplicate: other,
					end: other.end,
					original: current,
					start: other.start,
				});
			}
		}
	}

	if (hasContentAfter(parentNode)) {
		return issues;
	}

	for (let i = 0; i < alternatives.length; i++) {
		const current = alternatives[i];
		if (!current) {
			continue;
		}

		for (let j = i + 1; j < alternatives.length; j++) {
			const other = alternatives[j];
			if (!other) {
				continue;
			}

			const alreadyReported = issues.some((issue) => issue.duplicate === other);
			if (alreadyReported) {
				continue;
			}

			if (isPrefixOf(current, other)) {
				issues.push({
					duplicate: other,
					end: other.end,
					original: current,
					start: other.start,
				});
			}
		}
	}

	return issues;
}

function findIssues(pattern: string, flags: string): Issue[] {
	const issues: Issue[] = [];

	let ast: RegExpAST.RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return issues;
	}

	visitRegExpAST(ast, {
		onAssertionEnter(node) {
			if (node.kind === "lookahead" || node.kind === "lookbehind") {
				const duplicates = findDuplicateDisjunctions(node);
				issues.push(...duplicates);
			}
		},
		onCapturingGroupEnter(node) {
			const duplicates = findDuplicateDisjunctions(node);
			issues.push(...duplicates);
		},
		onGroupEnter(node) {
			const duplicates = findDuplicateDisjunctions(node);
			issues.push(...duplicates);
		},
		onPatternEnter(node) {
			const duplicates = findDuplicateDisjunctions(node);
			issues.push(...duplicates);
		},
	});

	return issues;
}

function getRegexPattern(node: AST.RegularExpressionLiteral): {
	flags: string;
	pattern: string;
} {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
	};
}

function hasContentAfter(parentNode: ParentNode): boolean {
	if (parentNode.type !== "Pattern") {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports duplicate alternatives in regular expression disjunctions.",
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
		subset: {
			primary:
				"Alternative '{{ alternative }}' is a subset of '{{ superset }}' and is unreachable.",
			secondary: [
				"This alternative will never match because a previous, more general alternative will always match first.",
			],
			suggestions: ["Remove the unreachable alternative."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexPattern(node);
			const issues = findIssues(pattern, flags);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				const isSubsetIssue =
					issue.duplicate.raw.length > issue.original.raw.length;
				context.report({
					data: {
						alternative: issue.duplicate.raw,
						superset: issue.original.raw,
					},
					message: isSubsetIssue ? "subset" : "duplicate",
					range: {
						begin: nodeStart + issue.start,
						end: nodeStart + issue.end,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
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

			const stringLiteral = firstArg;
			const rawText = stringLiteral.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1);

			let flags = "";
			if (args.length >= 2) {
				const secondArg = args[1];
				if (secondArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = secondArg.getText(services.sourceFile);
					flags = flagsText.slice(1, -1);
				}
			}

			const unescapedPattern = pattern.replace(/\\\\/g, "\\");
			const issues = findIssues(unescapedPattern, flags);

			const nodeStart = firstArg.getStart(services.sourceFile);

			for (const issue of issues) {
				const isSubsetIssue =
					issue.duplicate.raw.length > issue.original.raw.length;
				const adjustedStart = adjustPositionForEscapes(
					pattern,
					issue.start - 1,
				);
				const adjustedEnd = adjustPositionForEscapes(pattern, issue.end - 1);

				context.report({
					data: {
						alternative: issue.duplicate.raw,
						superset: issue.original.raw,
					},
					message: isSubsetIssue ? "subset" : "duplicate",
					range: {
						begin: nodeStart + 1 + adjustedStart,
						end: nodeStart + 1 + adjustedEnd,
					},
				});
			}
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

function isPrefixOf(
	prefix: RegExpAST.Alternative,
	longer: RegExpAST.Alternative,
): boolean {
	if (prefix.elements.length >= longer.elements.length) {
		return false;
	}

	for (let i = 0; i < prefix.elements.length; i++) {
		const prefixElement = prefix.elements[i];
		const longerElement = longer.elements[i];
		if (!prefixElement || !longerElement) {
			return false;
		}
		if (prefixElement.raw !== longerElement.raw) {
			return false;
		}
	}

	return true;
}
