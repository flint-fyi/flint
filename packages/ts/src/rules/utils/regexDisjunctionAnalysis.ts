/**
 * Comprehensive regex disjunction analysis using NFA/DFA.
 * Ported from eslint-plugin-regexp's no-dupe-disjunctions rule.
 * https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-disjunctions.ts
 */
import type { AST as RegExpAST } from "@eslint-community/regexpp";
import type { FiniteAutomaton, ReadonlyNFA } from "refa";
import {
	DFA,
	isDisjointWith,
	JS,
	NFA,
	transform,
	Transformers,
	visitAst,
} from "refa";
import type { ReadonlyFlags } from "regexp-ast-analysis";
import {
	canReorder,
	getEffectiveMaximumRepetition,
	getMatchingDirection,
	hasSomeAncestor,
	hasSomeDescendant,
	toCharSet,
} from "regexp-ast-analysis";

export type ParentNode =
	| RegExpAST.CapturingGroup
	| RegExpAST.Group
	| RegExpAST.LookaheadAssertion
	| RegExpAST.LookbehindAssertion
	| RegExpAST.Pattern;

type CharacterClassElement =
	| RegExpAST.Character
	| RegExpAST.CharacterClass
	| RegExpAST.CharacterClassRange
	| RegExpAST.CharacterSet
	| RegExpAST.ClassStringDisjunction
	| RegExpAST.ExpressionCharacterClass;

export type NestedAlternative =
	| CharacterClassElement
	| RegExpAST.Alternative
	| RegExpAST.StringAlternative;

interface ResultBase {
	alternative: RegExpAST.Alternative;
	others: RegExpAST.Alternative[];
}

export interface DuplicateResult extends ResultBase {
	others: [RegExpAST.Alternative];
	type: "Duplicate";
}

export interface SubsetResult extends ResultBase {
	type: "Subset";
}

export interface NestedSubsetResult extends ResultBase {
	nested: NestedAlternative;
	type: "NestedSubset";
}

export interface PrefixSubsetResult extends ResultBase {
	type: "PrefixSubset";
}

export interface PrefixNestedSubsetResult extends ResultBase {
	nested: NestedAlternative;
	type: "PrefixNestedSubset";
}

export interface SupersetResult extends ResultBase {
	type: "Superset";
}

export interface OverlapResult extends ResultBase {
	overlap: NFA;
	type: "Overlap";
}

export type DisjunctionIssue =
	| DuplicateResult
	| NestedSubsetResult
	| OverlapResult
	| PrefixNestedSubsetResult
	| PrefixSubsetResult
	| SubsetResult
	| SupersetResult;

const MAX_DFA_NODES = 100_000;

function isStared(node: RegExpAST.Node): boolean {
	let max = getEffectiveMaximumRepetition(node);
	if (node.type === "Quantifier") {
		max *= node.max;
	}
	return max > 10;
}

function hasNothingAfterNode(node: ParentNode): boolean {
	const md = getMatchingDirection(node);

	for (
		let p:
			| RegExpAST.Alternative
			| RegExpAST.CapturingGroup
			| RegExpAST.Group
			| RegExpAST.LookaheadAssertion
			| RegExpAST.LookbehindAssertion
			| RegExpAST.Pattern
			| RegExpAST.Quantifier = node;
		;
		p = p.parent
	) {
		if (p.type === "Assertion" || p.type === "Pattern") {
			return true;
		}

		if (p.type !== "Alternative") {
			const parent: RegExpAST.Alternative | RegExpAST.Quantifier = p.parent;
			if (parent.type === "Quantifier") {
				if (parent.max > 1) {
					return false;
				}
			} else {
				const lastIndex: number = md === "ltr" ? parent.elements.length - 1 : 0;
				if (parent.elements[lastIndex] !== p) {
					return false;
				}
			}
		}
	}
}

function containsAssertions(expression: unknown): boolean {
	try {
		visitAst(expression as Parameters<typeof visitAst>[0], {
			onAssertionEnter() {
				throw new Error();
			},
		});
		return false;
	} catch {
		return true;
	}
}

function containsAssertionsOrUnknowns(expression: unknown): boolean {
	try {
		visitAst(expression as Parameters<typeof visitAst>[0], {
			onAssertionEnter() {
				throw new Error();
			},
			onUnknownEnter() {
				throw new Error();
			},
		});
		return false;
	} catch {
		return true;
	}
}

function isNonRegular(node: RegExpAST.Node): boolean {
	return hasSomeDescendant(
		node,
		(d) => d.type === "Assertion" || d.type === "Backreference",
	);
}

function toNFA(
	parser: JS.Parser,
	element: JS.ParsableElement,
): { nfa: NFA; partial: boolean } {
	try {
		const { expression, maxCharacter } = parser.parseElement(element, {
			assertions: "parse",
			backreferences: "unknown",
		});

		let e: unknown;
		if (containsAssertions(expression)) {
			e = transform(
				Transformers.simplify({
					ignoreAmbiguity: true,
					ignoreOrder: true,
				}),
				expression,
			);
		} else {
			e = expression;
		}

		return {
			nfa: NFA.fromRegex(
				e as Parameters<typeof NFA.fromRegex>[0],
				{ maxCharacter },
				{ assertions: "disable", unknowns: "disable" },
			),
			partial: containsAssertionsOrUnknowns(e),
		};
	} catch {
		return {
			nfa: NFA.empty({
				maxCharacter: parser.maxCharacter,
			}),
			partial: true,
		};
	}
}

function* iterateNestedAlternatives(
	alternative: RegExpAST.Alternative,
): Iterable<NestedAlternative> {
	for (const e of alternative.elements) {
		if (e.type === "Group" || e.type === "CapturingGroup") {
			for (const a of e.alternatives) {
				if (e.alternatives.length > 1) {
					yield a;
				}

				yield* iterateNestedAlternatives(a);
			}
		}

		if (e.type === "CharacterClass" && !e.negate) {
			const nested: NestedAlternative[] = [];

			const addToNested = (charElement: CharacterClassElement) => {
				switch (charElement.type) {
					case "CharacterClassRange": {
						const min = charElement.min;
						const max = charElement.max;
						if (min.value === max.value) {
							nested.push(charElement);
						} else if (min.value + 1 === max.value) {
							nested.push(min, max);
						} else {
							nested.push(charElement, min, max);
						}
						break;
					}
					case "ClassStringDisjunction": {
						nested.push(...charElement.alternatives);
						break;
					}
					case "CharacterClass": {
						if (!charElement.negate) {
							charElement.elements.forEach(addToNested);
						} else {
							nested.push(charElement);
						}
						break;
					}
					case "Character":
					case "CharacterSet":
					case "ExpressionCharacterClass": {
						nested.push(charElement);
						break;
					}
				}
			};
			e.elements.forEach(addToNested);

			if (nested.length > 1) {
				yield* nested;
			}
		}
	}
}

interface PartialAlternative {
	nested: NestedAlternative;
	nfa: NFA;
}

interface RefaExpression {
	alternatives?: unknown;
	chars?: unknown;
	elements?: unknown[];
	max?: number;
	min?: number;
	type: string;
}

class PartialParser {
	private readonly maxCharacter: number;

	private readonly parser: JS.Parser;

	constructor(parser: JS.Parser) {
		this.parser = parser;
		this.maxCharacter = parser.maxCharacter;
	}

	parse(
		alternative: RegExpAST.Alternative,
		exclude: NestedAlternative,
	): RefaExpression | undefined {
		const elements: RefaExpression[] = [];

		for (const element of alternative.elements) {
			const parsed = this.parseElement(element, exclude);
			if (parsed === undefined) {
				return undefined;
			}
			elements.push(parsed);
		}

		if (elements.length === 0) {
			return { alternatives: [], type: "Concatenation" };
		}
		if (elements.length === 1) {
			return elements[0];
		}
		return { elements, type: "Concatenation" };
	}

	private parseElement(
		element: RegExpAST.Element,
		exclude: NestedAlternative,
	): RefaExpression | undefined {
		if (element === exclude) {
			return { alternatives: [], type: "Concatenation" };
		}

		switch (element.type) {
			case "Assertion":
			case "Backreference":
				return undefined;

			case "Character":
			case "CharacterSet":
			case "CharacterClass":
			case "ExpressionCharacterClass": {
				try {
					const charSet = toCharSet(
						element as Parameters<typeof toCharSet>[0],
						this.parser.flags as Parameters<typeof toCharSet>[1],
					);
					return { chars: charSet, type: "CharacterClass" };
				} catch {
					return undefined;
				}
			}

			case "Group":
			case "CapturingGroup": {
				const alternatives: RefaExpression[] = [];
				for (const alt of element.alternatives) {
					if (alt === exclude) {
						continue;
					}
					const parsed = this.parse(alt, exclude);
					if (parsed === undefined) {
						return undefined;
					}
					alternatives.push(parsed);
				}
				if (alternatives.length === 0) {
					return { alternatives: [], type: "Concatenation" };
				}
				if (alternatives.length === 1) {
					return alternatives[0];
				}
				return { alternatives, type: "Alternation" };
			}

			case "Quantifier": {
				const parsed = this.parseElement(element.element, exclude);
				if (parsed === undefined) {
					return undefined;
				}
				return {
					alternatives: parsed,
					max: element.max,
					min: element.min,
					type: "Quantifier",
				};
			}

			default:
				return undefined;
		}
	}
}

function* iteratePartialAlternatives(
	alternative: RegExpAST.Alternative,
	parser: JS.Parser,
): Iterable<PartialAlternative> {
	if (isNonRegular(alternative)) {
		return;
	}

	const maxCharacter = parser.maxCharacter;
	const partialParser = new PartialParser(parser);

	for (const nested of iterateNestedAlternatives(alternative)) {
		try {
			const expression = partialParser.parse(alternative, nested);
			if (expression === undefined) {
				continue;
			}
			const nfa = NFA.fromRegex(
				expression as unknown as Parameters<typeof NFA.fromRegex>[0],
				{ maxCharacter },
			);
			yield { nested, nfa };
		} catch {
			// ignore error and skip this
		}
	}
}

function unionAll(nfas: readonly ReadonlyNFA[]): ReadonlyNFA {
	if (nfas.length === 0) {
		throw new Error("Cannot union 0 NFAs.");
	} else if (nfas.length === 1) {
		return nfas[0]!;
	}

	const total = nfas[0]!.copy();
	for (let i = 1; i < nfas.length; i++) {
		total.union(nfas[i]!);
	}
	return total;
}

function isSubsetOf(
	superset: ReadonlyNFA,
	subset: ReadonlyNFA,
): boolean | null {
	try {
		const a = DFA.fromIntersection(
			superset,
			subset,
			new DFA.LimitedNodeFactory(MAX_DFA_NODES),
		);
		const b = DFA.fromFA(subset, new DFA.LimitedNodeFactory(MAX_DFA_NODES));
		a.minimize();
		b.minimize();
		return a.structurallyEqual(b);
	} catch {
		return null;
	}
}

enum SubsetRelation {
	none,
	leftEqualRight,
	leftSubsetOfRight,
	leftSupersetOfRight,
	unknown,
}

function getSubsetRelation(
	left: ReadonlyNFA,
	right: ReadonlyNFA,
): SubsetRelation {
	try {
		const inter = DFA.fromIntersection(
			left,
			right,
			new DFA.LimitedNodeFactory(MAX_DFA_NODES),
		);
		inter.minimize();

		const l = DFA.fromFA(left, new DFA.LimitedNodeFactory(MAX_DFA_NODES));
		l.minimize();

		const r = DFA.fromFA(right, new DFA.LimitedNodeFactory(MAX_DFA_NODES));
		r.minimize();

		const subset = l.structurallyEqual(inter);
		const superset = r.structurallyEqual(inter);

		if (subset && superset) {
			return SubsetRelation.leftEqualRight;
		} else if (subset) {
			return SubsetRelation.leftSubsetOfRight;
		} else if (superset) {
			return SubsetRelation.leftSupersetOfRight;
		}
		return SubsetRelation.none;
	} catch {
		return SubsetRelation.unknown;
	}
}

function getPartialSubsetRelation(
	left: ReadonlyNFA,
	leftIsPartial: boolean,
	right: ReadonlyNFA,
	rightIsPartial: boolean,
): SubsetRelation {
	const relation = getSubsetRelation(left, right);

	if (!leftIsPartial && !rightIsPartial) {
		return relation;
	}

	if (relation === SubsetRelation.none || relation === SubsetRelation.unknown) {
		return relation;
	}

	if (leftIsPartial && !rightIsPartial) {
		switch (relation) {
			case SubsetRelation.leftEqualRight:
				return SubsetRelation.leftSupersetOfRight;
			case SubsetRelation.leftSubsetOfRight:
				return SubsetRelation.none;
			case SubsetRelation.leftSupersetOfRight:
				return SubsetRelation.leftSupersetOfRight;
		}
	}
	if (rightIsPartial && !leftIsPartial) {
		switch (relation) {
			case SubsetRelation.leftEqualRight:
				return SubsetRelation.leftSubsetOfRight;
			case SubsetRelation.leftSubsetOfRight:
				return SubsetRelation.leftSubsetOfRight;
			case SubsetRelation.leftSupersetOfRight:
				return SubsetRelation.none;
		}
	}

	return SubsetRelation.none;
}

export function faToSource(fa: FiniteAutomaton, flags: ReadonlyFlags): string {
	try {
		const jsFlags = {
			dotAll: flags.dotAll ?? false,
			global: false,
			hasIndices: false,
			ignoreCase: flags.ignoreCase ?? false,
			multiline: flags.multiline ?? false,
			sticky: false,
			unicode: flags.unicode ?? false,
			unicodeSets: flags.unicodeSets ?? false,
		} as JS.Flags;
		return JS.toLiteral(fa.toRegex(), { flags: jsFlags }).source;
	} catch {
		return "<ERROR>";
	}
}

function isEqualNodes(
	a: RegExpAST.Node,
	b: RegExpAST.Node,
	flags: ReadonlyFlags,
): boolean {
	if (a.type !== b.type) {
		return false;
	}

	if (a.raw === b.raw) {
		return true;
	}

	if (
		(a.type === "Alternative" && b.type === "Alternative") ||
		(a.type === "StringAlternative" && b.type === "StringAlternative")
	) {
		if (a.elements.length !== b.elements.length) {
			return false;
		}
		for (let i = 0; i < a.elements.length; i++) {
			const ae = a.elements[i];
			const be = (b as typeof a).elements[i];
			if (ae && be && !isEqualNodes(ae, be, flags)) {
				return false;
			}
		}
		return true;
	}

	if (a.type === "Character" && b.type === "Character" && flags.ignoreCase) {
		const aVal = a.value;
		const bVal = b.value;
		const aLower = String.fromCodePoint(aVal).toLowerCase().codePointAt(0);
		const bLower = String.fromCodePoint(bVal).toLowerCase().codePointAt(0);
		return aLower === bLower;
	}

	if (
		a.type === "CharacterClass" &&
		b.type === "CharacterClass" &&
		a.negate === b.negate
	) {
		if (a.elements.length !== b.elements.length) {
			return false;
		}
		for (let i = 0; i < a.elements.length; i++) {
			const ae = a.elements[i];
			const be = b.elements[i];
			if (ae && be && !isEqualNodes(ae, be, flags)) {
				return false;
			}
		}
		return true;
	}

	return false;
}

function isCoveredNode(
	covering: RegExpAST.Alternative,
	covered: RegExpAST.Alternative,
	flags: ReadonlyFlags,
	canOmitRight: boolean,
): boolean {
	if (isEqualNodes(covering, covered, flags)) {
		return true;
	}

	if (covering.elements.length > covered.elements.length) {
		return false;
	}

	if (covering.elements.length === 0) {
		return true;
	}

	for (let i = 0; i < covering.elements.length; i++) {
		const coveringEl = covering.elements[i];
		const coveredEl = covered.elements[i];
		if (!coveringEl || !coveredEl) {
			return false;
		}
		if (!isEqualNodes(coveringEl, coveredEl, flags)) {
			return false;
		}
	}

	if (covering.elements.length < covered.elements.length) {
		return canOmitRight;
	}

	return true;
}

interface AnalysisOptions {
	fastAst: boolean;
	hasNothingAfter: boolean;
	ignoreOverlap: boolean;
	noNfa: boolean;
	parser: JS.Parser;
}

function* findDuplicationAstFast(
	alternatives: RegExpAST.Alternative[],
	flags: ReadonlyFlags,
): Iterable<DisjunctionIssue> {
	for (let i = 0; i < alternatives.length; i++) {
		const alternative = alternatives[i];
		if (!alternative) {
			continue;
		}

		for (let j = 0; j < i; j++) {
			const other = alternatives[j];
			if (!other) {
				continue;
			}

			if (isEqualNodes(other, alternative, flags)) {
				yield { alternative, others: [other], type: "Duplicate" };
			}
		}
	}
}

function* findDuplicationAst(
	alternatives: RegExpAST.Alternative[],
	flags: ReadonlyFlags,
	hasNothingAfter: boolean,
): Iterable<DisjunctionIssue> {
	for (let i = 0; i < alternatives.length; i++) {
		const alternative = alternatives[i];
		if (!alternative) {
			continue;
		}

		for (let j = 0; j < i; j++) {
			const other = alternatives[j];
			if (!other) {
				continue;
			}

			if (isCoveredNode(other, alternative, flags, hasNothingAfter)) {
				if (isEqualNodes(other, alternative, flags)) {
					yield {
						alternative,
						others: [other],
						type: "Duplicate",
					};
				} else if (
					hasNothingAfter &&
					!isCoveredNode(other, alternative, flags, false)
				) {
					yield {
						alternative,
						others: [other],
						type: "PrefixSubset",
					};
				} else {
					yield { alternative, others: [other], type: "Subset" };
				}
			}
		}
	}
}

function tryFindNestedSubsetResult(
	others: [ReadonlyNFA, RegExpAST.Alternative][],
	othersNfa: ReadonlyNFA,
	alternative: RegExpAST.Alternative,
	parser: JS.Parser,
): NestedSubsetResult | undefined {
	const disjointElements = new Set<RegExpAST.Node>();

	for (const { nested, nfa: nestedNfa } of iteratePartialAlternatives(
		alternative,
		parser,
	)) {
		if (hasSomeAncestor(nested, (a) => disjointElements.has(a))) {
			continue;
		}

		if (isDisjointWith(othersNfa, nestedNfa)) {
			disjointElements.add(nested);
			continue;
		}

		if (isSubsetOf(othersNfa, nestedNfa)) {
			return {
				alternative,
				nested,
				others: others
					.filter((o) => !isDisjointWith(o[0], nestedNfa))
					.map((o) => o[1]),
				type: "NestedSubset",
			};
		}
	}

	return undefined;
}

function* findPrefixDuplicationNfa(
	alternatives: [NFA, boolean, RegExpAST.Alternative][],
	parser: JS.Parser,
): Iterable<DisjunctionIssue> {
	if (alternatives.length === 0) {
		return;
	}

	const first = alternatives[0];
	if (!first) {
		return;
	}

	const all = NFA.all({ maxCharacter: first[0].maxCharacter });

	for (let i = 0; i < alternatives.length; i++) {
		const entry = alternatives[i];
		if (!entry) {
			continue;
		}
		const [nfa, partial, alternative] = entry;

		if (!partial) {
			const overlapping = alternatives
				.slice(0, i)
				.filter((item) => item && !isDisjointWith(nfa, item[0]));

			if (overlapping.length >= 1) {
				const nfas = overlapping
					.map((o) => o[0])
					.filter((x): x is NFA => Boolean(x));
				const othersNfa = unionAll(nfas);
				const others = overlapping
					.map((o) => o[2])
					.filter((x): x is RegExpAST.Alternative => Boolean(x));

				if (isSubsetOf(othersNfa, nfa)) {
					yield { alternative, others, type: "PrefixSubset" };
				} else {
					const nested = tryFindNestedSubsetResult(
						overlapping.map(
							(o) => [o[0], o[2]] as [ReadonlyNFA, RegExpAST.Alternative],
						),
						othersNfa,
						alternative,
						parser,
					);

					if (nested) {
						yield { ...nested, type: "PrefixNestedSubset" };
					}
				}
			}
		}

		nfa.append(all);
	}
}

function* findDuplicationNfa(
	alternatives: RegExpAST.Alternative[],
	flags: ReadonlyFlags,
	{ hasNothingAfter, ignoreOverlap, parser }: AnalysisOptions,
): Iterable<DisjunctionIssue> {
	const previous: [NFA, boolean, RegExpAST.Alternative][] = [];

	for (let i = 0; i < alternatives.length; i++) {
		const alternative = alternatives[i];
		if (!alternative) {
			continue;
		}

		const { nfa, partial } = toNFA(parser, alternative);

		const overlapping = previous.filter(
			(item) => item && !isDisjointWith(nfa, item[0]),
		);

		if (overlapping.length >= 1) {
			const othersNfa = unionAll(overlapping.map(([n]) => n));
			const othersPartial = overlapping.some(([, p]) => p);
			const others = overlapping.map(([, , a]) => a);

			const relation = getPartialSubsetRelation(
				nfa,
				partial,
				othersNfa,
				othersPartial,
			);

			switch (relation) {
				case SubsetRelation.leftEqualRight:
					if (others.length === 1 && others[0]) {
						yield {
							alternative,
							others: [others[0]],
							type: "Duplicate",
						};
					} else {
						yield { alternative, others, type: "Subset" };
					}
					break;

				case SubsetRelation.leftSubsetOfRight:
					yield { alternative, others, type: "Subset" };
					break;

				case SubsetRelation.leftSupersetOfRight: {
					const reorder = canReorder([alternative, ...others], flags);

					if (reorder) {
						for (const other of others) {
							yield {
								alternative: other,
								others: [alternative],
								type: "Subset",
							};
						}
					} else {
						yield { alternative, others, type: "Superset" };
					}
					break;
				}

				case SubsetRelation.none:
				case SubsetRelation.unknown: {
					const nested = tryFindNestedSubsetResult(
						overlapping.map(
							(o) => [o[0], o[2]] as [ReadonlyNFA, RegExpAST.Alternative],
						),
						othersNfa,
						alternative,
						parser,
					);
					if (nested) {
						yield nested;
						break;
					}

					if (!ignoreOverlap) {
						yield {
							alternative,
							others,
							overlap: NFA.fromIntersection(nfa, othersNfa),
							type: "Overlap",
						};
					}
					break;
				}
			}
		}

		previous.push([nfa, partial, alternative]);
	}

	if (hasNothingAfter) {
		yield* findPrefixDuplicationNfa(previous, parser);
	}
}

function* findDuplication(
	alternatives: RegExpAST.Alternative[],
	flags: ReadonlyFlags,
	options: AnalysisOptions,
): Iterable<DisjunctionIssue> {
	if (options.fastAst) {
		yield* findDuplicationAstFast(alternatives, flags);
	} else {
		yield* findDuplicationAst(alternatives, flags, options.hasNothingAfter);
	}

	if (!options.noNfa) {
		yield* findDuplicationNfa(alternatives, flags, options);
	}
}

const RESULT_TYPE_ORDER: DisjunctionIssue["type"][] = [
	"Duplicate",
	"Subset",
	"NestedSubset",
	"PrefixSubset",
	"PrefixNestedSubset",
	"Superset",
	"Overlap",
];

function deduplicateResults(
	unsorted: Iterable<DisjunctionIssue>,
): DisjunctionIssue[] {
	const results = [...unsorted].sort(
		(a, b) =>
			RESULT_TYPE_ORDER.indexOf(a.type) - RESULT_TYPE_ORDER.indexOf(b.type),
	);

	const seen = new Map<RegExpAST.Alternative, DisjunctionIssue["type"]>();
	return results.filter(({ alternative, type }) => {
		const firstSeen = seen.get(alternative);

		if (firstSeen === undefined) {
			seen.set(alternative, type);
			return true;
		}

		if (firstSeen === "PrefixSubset" && type !== "PrefixSubset") {
			seen.set(alternative, type);
			return true;
		}

		return false;
	});
}

export function createParser(
	pattern: RegExpAST.Pattern,
	flags: ReadonlyFlags,
): JS.Parser {
	const jsFlags = {
		dotAll: flags.dotAll ?? false,
		global: false,
		hasIndices: false,
		ignoreCase: flags.ignoreCase ?? false,
		multiline: flags.multiline ?? false,
		sticky: false,
		unicode: flags.unicode ?? false,
		unicodeSets: flags.unicodeSets ?? false,
	} as JS.Flags;

	const ast = {
		flags: jsFlags,
		pattern,
		source: pattern.raw,
	} as JS.RegexppAst;

	return JS.Parser.fromAst(ast);
}

export function analyzeParentNode(
	parentNode: ParentNode,
	flags: ReadonlyFlags,
	parser: JS.Parser,
): DisjunctionIssue[] {
	const stared = isStared(parentNode);
	const nothingAfter = hasNothingAfterNode(parentNode);

	const rawResults = findDuplication(parentNode.alternatives, flags, {
		fastAst: false,
		hasNothingAfter: nothingAfter,
		ignoreOverlap: !stared,
		noNfa: false,
		parser,
	});

	let results = [...rawResults].filter(({ type }) => {
		switch (type) {
			case "Duplicate":
			case "Subset":
			case "NestedSubset":
				return true;

			case "Overlap":
			case "Superset":
				return stared;

			case "PrefixSubset":
			case "PrefixNestedSubset":
				return nothingAfter;
		}
	});

	results = deduplicateResults(results);
	return results;
}
