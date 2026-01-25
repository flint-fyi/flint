import {
	type AST as RegExpAST,
	RegExpParser,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { toUnicodeSet } from "regexp-ast-analysis";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

function collectIntersectionOperands(
	expression: RegExpAST.ClassIntersection,
): RegExpAST.ClassSetOperand[] {
	const operands: RegExpAST.ClassSetOperand[] = [];

	let operand: RegExpAST.ClassIntersection | RegExpAST.ClassSetOperand =
		expression;

	while (operand.type === "ClassIntersection") {
		operands.push(operand.right);
		operand = operand.left;
	}

	return [operand, ...operands.reverse()];
}

function getParsedElement(pattern: string, unicodeSets: boolean) {
	try {
		const parser = new RegExpParser();
		const ast = parser.parsePattern(pattern, undefined, undefined, {
			unicode: false,
			unicodeSets,
		});

		if (ast.alternatives.length !== 1) {
			return undefined;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const alt = ast.alternatives[0]!;

		if (alt.elements.length !== 1) {
			return undefined;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const element = alt.elements[0]!;

		if (
			element.type === "Assertion" ||
			element.type === "Quantifier" ||
			element.type === "CapturingGroup" ||
			element.type === "Group" ||
			element.type === "Backreference"
		) {
			return undefined;
		}

		return element;
	} catch {
		return undefined;
	}
}

function getRawTextToNot(negatedNode: RegExpAST.ClassSetOperand) {
	if (
		negatedNode.type === "CharacterClass" ||
		negatedNode.type === "ExpressionCharacterClass"
	) {
		return `${negatedNode.raw[0]}${negatedNode.raw.slice(2)}`;
	}

	const escapeChar = negatedNode.raw[1]?.toLowerCase();
	if (!escapeChar) {
		return negatedNode.raw;
	}

	return `${negatedNode.raw[0]}${escapeChar}${negatedNode.raw.slice(2)}`;
}

function hasNegate(
	node:
		| RegExpAST.CharacterClassElement
		| RegExpAST.ClassIntersection
		| RegExpAST.ClassSetOperand,
): node is typeof node & { negate: boolean } {
	return (
		node.type === "CharacterClass" ||
		node.type === "ExpressionCharacterClass" ||
		(node.type === "CharacterSet" &&
			(node.kind !== "property" || !node.strings))
	);
}

function isFixedPatternEquivalent(
	targetNode: RegExpAST.CharacterClass | RegExpAST.ExpressionCharacterClass,
	fixedText: string,
	unicodeSets: boolean,
) {
	const flags = { unicode: false, unicodeSets };
	const originalUs = toUnicodeSet(targetNode, flags);
	const convertedElement = getParsedElement(fixedText, unicodeSets);

	if (!convertedElement) {
		return false;
	}

	const convertedUs = toUnicodeSet(
		convertedElement as Parameters<typeof toUnicodeSet>[0],
		flags,
	);

	return originalUs.equals(convertedUs);
}

function isNegated(
	node:
		| RegExpAST.CharacterClassElement
		| RegExpAST.ClassIntersection
		| RegExpAST.ClassSetOperand,
) {
	return hasNegate(node) && node.negate;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports set operations in regular expressions that can be simplified.",
		id: "regexSetOperationOptimizations",
		presets: ["logical"],
	},
	messages: {
		toIntersection: {
			primary: "This subtraction can be simplified to an intersection.",
			secondary: [
				"Subtracting a negated set is equivalent to intersecting with the positive set.",
				"This simplification allows for a more clear and readable regular expression.",
			],
			suggestions: ["Convert the subtraction to an intersection."],
		},
		toNegationOfConjunction: {
			primary:
				"This character class can be simplified to a negated conjunction.",
			secondary: [
				"A union of negated sets is equivalent to the negation of their intersection.",
				"This simplification allows for a more clear and readable regular expression.",
			],
			suggestions: ["Convert to a negated conjunction."],
		},
		toNegationOfDisjunction: {
			primary: "This {{ target }} can be simplified to a negated disjunction.",
			secondary: [
				"An intersection of negated sets is equivalent to the negation of their union.",
				"This simplification allows for a more clear and readable regular expression.",
			],
			suggestions: ["Convert to a negated disjunction."],
		},
		toSubtraction: {
			primary: "This intersection can be simplified to a subtraction.",
			secondary: [
				"Intersecting with a negated set is equivalent to subtracting the positive set.",
				"This simplification allows for a more clear and readable regular expression.",
			],
			suggestions: ["Convert the intersection to a subtraction."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const details = getRegExpLiteralDetails(node, { sourceFile });
					if (!details.flags.includes("v")) {
						return;
					}

					let regexpAst: RegExpAST.Pattern | undefined;
					try {
						regexpAst = new RegExpParser().parsePattern(
							details.pattern,
							undefined,
							undefined,
							{ unicode: false, unicodeSets: true },
						);
					} catch {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					function reportWithFix(
						targetNode:
							| RegExpAST.CharacterClass
							| RegExpAST.ExpressionCharacterClass,
						messageId:
							| "toIntersection"
							| "toNegationOfConjunction"
							| "toNegationOfDisjunction"
							| "toSubtraction",
						fixedText: string,
						data?: Record<string, string>,
					) {
						if (!details.pattern) {
							return false;
						}

						if (!isFixedPatternEquivalent(targetNode, fixedText, true)) {
							return false;
						}

						const newPattern =
							details.pattern.slice(0, targetNode.start) +
							fixedText +
							details.pattern.slice(targetNode.end);

						context.report({
							data,
							fix: {
								range: nodeRange,
								text: `/${newPattern}/${details.flags}`,
							},
							message: messageId,
							range: nodeRange,
						});

						return true;
					}

					function toNegationOfDisjunction(
						classNode: RegExpAST.ExpressionCharacterClass,
					) {
						if (classNode.expression.type !== "ClassIntersection") {
							return false;
						}

						const operands = collectIntersectionOperands(classNode.expression);
						const negatedOperands: RegExpAST.ClassSetOperand[] = [];
						const others: RegExpAST.ClassSetOperand[] = [];

						for (const operand of operands) {
							if (isNegated(operand)) {
								negatedOperands.push(operand);
							} else {
								others.push(operand);
							}
						}

						if (negatedOperands.length < 2) {
							return false;
						}

						const fixedOperands = negatedOperands
							.map((negatedOperand) => getRawTextToNot(negatedOperand))
							.join("");

						if (negatedOperands.length === operands.length) {
							return reportWithFix(
								classNode,
								"toNegationOfDisjunction",
								`[${classNode.negate ? "" : "^"}${fixedOperands}]`,
								{ target: "character class" },
							);
						}

						const operandTextList = [
							`[^${fixedOperands}]`,
							...others.map((operand) => operand.raw),
						];

						return reportWithFix(
							classNode,
							"toNegationOfDisjunction",
							`[${classNode.negate ? "^" : ""}${operandTextList.join("&&")}]`,
							{ target: "expression" },
						);
					}

					function toNegationOfConjunction(ccNode: RegExpAST.CharacterClass) {
						if (ccNode.elements.length <= 1) {
							return false;
						}

						const elements = ccNode.elements;
						const negatedElements = elements.filter(
							isNegated,
						) as RegExpAST.ClassSetOperand[];

						if (negatedElements.length !== elements.length) {
							return false;
						}

						const fixedElements = negatedElements.map((negatedElement) =>
							getRawTextToNot(negatedElement),
						);

						return reportWithFix(
							ccNode,
							"toNegationOfConjunction",
							`[${ccNode.negate ? "" : "^"}${fixedElements.join("&&")}]`,
						);
					}

					function toSubtraction(
						classNode: RegExpAST.ExpressionCharacterClass,
					) {
						const expression = classNode.expression;

						if (expression.type !== "ClassIntersection") {
							return false;
						}

						const operands = collectIntersectionOperands(expression);
						const negatedOperand = operands.find(isNegated);

						if (!negatedOperand) {
							return false;
						}

						const others = operands.filter(
							(operand) => operand !== negatedOperand,
						);
						let fixedLeftText = others.map((operand) => operand.raw).join("&&");

						if (others.length >= 2) {
							fixedLeftText = `[${fixedLeftText}]`;
						}

						const fixedRightText = getRawTextToNot(negatedOperand);

						return reportWithFix(
							classNode,
							"toSubtraction",
							`[${classNode.negate ? "^" : ""}${fixedLeftText}--${fixedRightText}]`,
						);
					}

					function toIntersection(
						expression:
							| RegExpAST.ClassIntersection
							| RegExpAST.ClassSubtraction,
						expressionRight:
							| null
							| RegExpAST.ClassIntersection
							| RegExpAST.ClassSetOperand
							| RegExpAST.ClassSubtraction,
						eccNode: RegExpAST.ExpressionCharacterClass,
					) {
						if (expression.type !== "ClassSubtraction") {
							return false;
						}

						const { left, right } = expression;

						if (!isNegated(right)) {
							return false;
						}

						const fixedLeftText =
							left.type === "ClassSubtraction" ? `[${left.raw}]` : left.raw;

						const fixedRightText = getRawTextToNot(right);
						let fixedText = `${fixedLeftText}&&${fixedRightText}`;

						if (expressionRight) {
							fixedText = `[${fixedText}]`;
						}

						const targetRaw = eccNode.raw;
						const fullFixedText =
							targetRaw.slice(0, expression.start - eccNode.start) +
							fixedText +
							targetRaw.slice(expression.end - eccNode.start);

						return reportWithFix(eccNode, "toIntersection", fullFixedText);
					}

					function verifyExpressions(
						eccNode: RegExpAST.ExpressionCharacterClass,
					) {
						let operand:
							| RegExpAST.ClassIntersection
							| RegExpAST.ClassSetOperand
							| RegExpAST.ClassSubtraction = eccNode.expression;
						let right:
							| null
							| RegExpAST.ClassIntersection
							| RegExpAST.ClassSetOperand
							| RegExpAST.ClassSubtraction = null;

						while (
							operand.type === "ClassIntersection" ||
							operand.type === "ClassSubtraction"
						) {
							toIntersection(operand, right, eccNode);
							right = operand.right;
							operand = operand.left;
						}
					}

					visitRegExpAST(regexpAst, {
						onCharacterClassEnter(ccNode) {
							toNegationOfConjunction(ccNode);
						},
						onExpressionCharacterClassEnter(eccNode) {
							if (
								!toNegationOfDisjunction(eccNode) &&
								!toSubtraction(eccNode)
							) {
								verifyExpressions(eccNode);
							}
						},
					});
				},
			},
		};
	},
});
