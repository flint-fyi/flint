import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

interface BackReferenceInfo {
	end: number;
	groupCountSoFar: number;
	nestedIn: number[];
	path: PathFrame[];
	raw: string;
	reference: number;
	start: number;
}

interface GroupInfo {
	end: number;
	number: number;
	path: PathFrame[];
	start: number;
}

interface Issue {
	end: number;
	kind: IssueKind;
	raw: string;
	start: number;
}

type IssueKind = "disjunctive" | "forward" | "nested";

interface PathFrame {
	alternative: number;
	disjunctionId: number;
}

function analyzePattern(pattern: string, doubleEscaped: boolean) {
	const groups = new Map<number, GroupInfo>();
	const backReferences: BackReferenceInfo[] = [];

	let captureCount = 0;
	let disjunctionIdCounter = 0;

	const groupStack: {
		capturingNumber: number | undefined;
		pathAtOpen: PathFrame[];
		start: number;
	}[] = [];

	const disjunctionStack: PathFrame[] = [
		{ alternative: 0, disjunctionId: disjunctionIdCounter++ },
	];

	let i = 0;

	function getCurrentPath() {
		return disjunctionStack.map((f) => ({ ...f }));
	}

	function getOpenCapturingNumbers() {
		const result: number[] = [];
		for (const g of groupStack) {
			if (g.capturingNumber !== undefined) {
				result.push(g.capturingNumber);
			}
		}
		return result;
	}

	while (i < pattern.length) {
		const char = pattern[i];

		if (char === "\\") {
			const escLen = doubleEscaped ? 2 : 1;
			if (
				doubleEscaped &&
				pattern[i + 1] === "\\" &&
				i + escLen < pattern.length
			) {
				const nextChar = pattern[i + escLen];
				if (nextChar && nextChar >= "1" && nextChar <= "9") {
					let refStr = nextChar;
					let endIdx = i + escLen + 1;
					while (endIdx < pattern.length) {
						const digit = pattern[endIdx];
						if (digit === undefined || digit < "0" || digit > "9") {
							break;
						}
						refStr += digit;
						endIdx++;
					}
					const ref = parseInt(refStr, 10);
					backReferences.push({
						end: endIdx,
						groupCountSoFar: captureCount,
						nestedIn: getOpenCapturingNumbers(),
						path: getCurrentPath(),
						raw: pattern.slice(i, endIdx),
						reference: ref,
						start: i,
					});
					i = endIdx;
					continue;
				}
				i += escLen + 1;
				continue;
			}
			if (!doubleEscaped && i + 1 < pattern.length) {
				const nextChar = pattern[i + 1];
				if (nextChar && nextChar >= "1" && nextChar <= "9") {
					let refStr = nextChar;
					let endIdx = i + 2;
					while (endIdx < pattern.length) {
						const digit = pattern[endIdx];
						if (digit === undefined || digit < "0" || digit > "9") {
							break;
						}
						refStr += digit;
						endIdx++;
					}
					const ref = parseInt(refStr, 10);
					backReferences.push({
						end: endIdx,
						groupCountSoFar: captureCount,
						nestedIn: getOpenCapturingNumbers(),
						path: getCurrentPath(),
						raw: pattern.slice(i, endIdx),
						reference: ref,
						start: i,
					});
					i = endIdx;
					continue;
				}
				i += 2;
				continue;
			}
			i++;
			continue;
		}

		if (char === "[") {
			let j = i + 1;
			if (j < pattern.length && pattern[j] === "^") {
				j++;
			}
			if (j < pattern.length && pattern[j] === "]") {
				j++;
			}
			while (j < pattern.length && pattern[j] !== "]") {
				if (pattern[j] === "\\") {
					j += doubleEscaped ? 3 : 2;
				} else {
					j++;
				}
			}
			i = j + 1;
			continue;
		}

		if (char === "(") {
			const groupStart = i;
			let isCapturing = true;

			if (pattern[i + 1] === "?") {
				const afterQuestion = pattern[i + 2];
				if (
					afterQuestion === ":" ||
					afterQuestion === "=" ||
					afterQuestion === "!"
				) {
					isCapturing = false;
				} else if (afterQuestion === "<") {
					const afterLt = pattern[i + 3];
					if (afterLt === "=" || afterLt === "!") {
						isCapturing = false;
					}
				}
			}

			let capturingNumber: number | undefined;
			if (isCapturing) {
				captureCount++;
				capturingNumber = captureCount;
			}

			const pathAtOpen = getCurrentPath();
			const newDisjunctionId = disjunctionIdCounter++;
			disjunctionStack.push({
				alternative: 0,
				disjunctionId: newDisjunctionId,
			});
			groupStack.push({
				capturingNumber,
				pathAtOpen,
				start: groupStart,
			});

			i++;
			continue;
		}

		if (char === ")") {
			disjunctionStack.pop();
			const groupFrame = groupStack.pop();
			if (groupFrame?.capturingNumber !== undefined) {
				groups.set(groupFrame.capturingNumber, {
					end: i + 1,
					number: groupFrame.capturingNumber,
					path: groupFrame.pathAtOpen,
					start: groupFrame.start,
				});
			}
			i++;
			continue;
		}

		if (char === "|") {
			const currentFrame = disjunctionStack.at(-1);
			if (currentFrame) {
				currentFrame.alternative++;
			}
			i++;
			continue;
		}

		i++;
	}

	return { backReferences, groups, totalCaptures: captureCount };
}

function divergesByAlternation(
	groupPath: PathFrame[],
	backrefPath: PathFrame[],
) {
	const minLen = Math.min(groupPath.length, backrefPath.length);
	for (let i = 0; i < minLen; i++) {
		const gFrame = groupPath[i];
		const bFrame = backrefPath[i];
		if (!gFrame || !bFrame) {
			return false;
		}
		if (gFrame.disjunctionId !== bFrame.disjunctionId) {
			return false;
		}
		if (gFrame.alternative !== bFrame.alternative) {
			return true;
		}
	}
	return false;
}

function findIssues(pattern: string, doubleEscaped: boolean): Issue[] {
	const { backReferences, groups, totalCaptures } = analyzePattern(
		pattern,
		doubleEscaped,
	);
	const issues: Issue[] = [];

	for (const backReference of backReferences) {
		if (backReference.reference > totalCaptures) {
			continue;
		}

		if (backReference.nestedIn.includes(backReference.reference)) {
			issues.push({
				end: backReference.end,
				kind: "nested",
				raw: backReference.raw,
				start: backReference.start,
			});
			continue;
		}

		const group = groups.get(backReference.reference);
		if (group && divergesByAlternation(group.path, backReference.path)) {
			issues.push({
				end: backReference.end,
				kind: "disjunctive",
				raw: backReference.raw,
				start: backReference.start,
			});
			continue;
		}

		if (backReference.reference > backReference.groupCountSoFar) {
			issues.push({
				end: backReference.end,
				kind: "forward",
				raw: backReference.raw,
				start: backReference.start,
			});
		}
	}

	return issues;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports backreferences in regular expressions that are always empty or never match.",
		id: "regexUnnecessaryBackreferences",
		presets: ["logical"],
	},
	messages: {
		disjunctive: {
			primary:
				"Backreference '{{ reference }}' and its capturing group are in different alternation branches.",
			secondary: [
				"When the capturing group is matched, this backreference is not evaluated.",
				"When this backreference is evaluated, the capturing group has not participated.",
			],
			suggestions: [
				"Move the backreference to the same branch as the capturing group.",
			],
		},
		forward: {
			primary:
				"Backreference '{{ reference }}' appears before its capturing group is defined.",
			secondary: [
				"At this point in the pattern, the capturing group has not yet been matched.",
				"This backreference will always match an empty string.",
			],
			suggestions: ["Move the backreference after the capturing group."],
		},
		nested: {
			primary:
				"Backreference '{{ reference }}' is inside the group it references and always matches empty.",
			secondary: [
				"The capturing group has not finished matching when the backreference is evaluated.",
				"This backreference will always match an empty string.",
			],
			suggestions: ["Move the backreference outside the capturing group."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { pattern, start } = getRegExpLiteralDetails(node, services);
			const issues = findIssues(pattern, false);

			for (const issue of issues) {
				context.report({
					data: {
						reference: issue.raw,
					},
					message: issue.kind,
					range: {
						begin: start + issue.start,
						end: start + issue.end,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const issues = findIssues(construction.pattern, true);

			for (const issue of issues) {
				context.report({
					data: {
						reference: issue.raw,
					},
					message: issue.kind,
					range: {
						begin: construction.start + 1 + issue.start,
						end: construction.start + 1 + issue.end,
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
