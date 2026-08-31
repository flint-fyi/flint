import * as vue from "@vue/compiler-dom";
import {
	isIdentifier,
	SpanMap,
	SpanMapFeature,
	type Node,
	type ReadonlyTextRange,
} from "typescript-native/unstable/ast";

import type { CharacterReportRange } from "@flint.fyi/core";
import type { AST } from "@flint.fyi/typescript-language";
import { vueLanguage, type VueServices } from "@flint.fyi/vue-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(vueLanguage, {
	about: {
		description: "Reports v-for directives without a valid key binding.",
		id: "vForKeys",
		presets: ["logical"],
	},
	messages: {
		invalidKey: {
			primary:
				"The :key on this v-for element does not reference the iteration variable.",
			secondary: [
				"Keys must uniquely identify each item in the v-for loop to maintain object constancy.",
				"Using values unrelated to the loop can still lead to rendering issues during reordering.",
			],
			suggestions: [
				"Bind the :key to something derived from the v-for item, like item.id or the index if no unique identifier exists.",
			],
		},
		missingKey: {
			primary:
				"Elements using v-for must include a unique :key to ensure correct reactivity and DOM stability.",
			secondary: [
				"A missing :key can cause unpredictable updates during rendering optimizations.",
				"Without a key, Vue may reuse or reorder elements incorrectly, which breaks expected behavior in transitions and stateful components.",
			],
			suggestions: [
				"Always provide a unique :key based on the v-for item, such as an id.",
			],
		},
		staticKey: {
			primary:
				"Static key values prevent Vue from tracking changes in v-for lists.",
			secondary: [
				'Using key="literal" means every item in the v-for shares the same key, which prevents Vue from tracking list updates correctly.',
				"This blocks proper reactivity, leading to stale DOM content and skipped updates.",
			],
			suggestions: [
				"Replace the static key with a dynamic and unique :key derived from the v-for item, such as item.id.",
			],
		},
	},
	setup(context) {
		const reportAuthored = (
			message: "invalidKey" | "missingKey" | "staticKey",
			range: CharacterReportRange,
		): void => {
			context.report({
				message,
				range: { begin: -range.begin, end: range.end },
			});
		};

		return {
			visitors: {
				SourceFile(sourceFile, services) {
					const vueServices = (services as Partial<VueServices>).vue;
					if (!vueServices || !services.spanMap) {
						return;
					}
					const { checker, project, spanMap } = services;
					const templateBlock = vueServices.sfc.children.find(
						(child): child is vue.ElementNode =>
							child.type === vue.NodeTypes.ELEMENT && child.tag === "template",
					);
					if (!templateBlock) {
						return;
					}

					const referencesLoopVariable = (
						authoredKeyRange: CharacterReportRange,
						loopVariableRanges: CharacterReportRange[],
						feature: SpanMapFeature,
					): boolean => {
						const leadingTrivia =
							/^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))*/.exec(
								sourceFile.originalText.slice(
									authoredKeyRange.begin,
									authoredKeyRange.end,
								),
							)?.[0].length;
						const projections = spanMap.originalToVirtualSpans(
							{
								end: authoredKeyRange.end,
								pos: authoredKeyRange.begin + (leadingTrivia ?? 0),
							},
							feature,
						);
						const findReference = (
							node: Node,
							range: ReadonlyTextRange,
						): boolean => {
							const begin = node.getStart(sourceFile);
							const end = node.getEnd();
							if (begin >= range.end || end <= range.pos) {
								return false;
							}
							if (
								begin >= range.pos &&
								end <= range.end &&
								isIdentifier(node)
							) {
								const declaration = checker
									.getSymbolAtLocation(node)
									?.valueDeclaration?.resolve(project);
								if (!declaration) {
									return false;
								}
								const typedDeclaration = declaration as AST.Declaration;
								const declarationName =
									"name" in typedDeclaration
										? typedDeclaration.name
										: typedDeclaration;
								const declarationSourceFile = declarationName.getSourceFile();
								const declarationMap = declarationSourceFile.spanMap;
								if (!declarationMap) {
									return false;
								}
								const mapped = declarationMap.virtualToOriginalSpan({
									end: declarationName.getEnd(),
									pos: declarationName.getStart(declarationSourceFile),
								});
								if (SpanMap.isNone(mapped.fidelity)) {
									return false;
								}
								return loopVariableRanges.some(
									(range) =>
										mapped.range.pos >= range.begin &&
										mapped.range.end <= range.end,
								);
							}
							let found = false;
							node.forEachChild((child) => {
								if (!found && findReference(child, range)) {
									found = true;
								}
							});
							return found;
						};
						return projections.some(({ range }) =>
							findReference(sourceFile, range),
						);
					};

					const checkFor = (
						forDirective: vue.DirectiveNode,
						forParseResult: vue.ForParseResult,
						keyProp: null | vue.AttributeNode | vue.DirectiveNode,
					): void => {
						if (!keyProp) {
							reportAuthored("missingKey", {
								begin: forDirective.loc.start.offset,
								end: forDirective.loc.start.offset + "v-for".length,
							});
							return;
						}
						if (keyProp.type === vue.NodeTypes.ATTRIBUTE) {
							if (!keyProp.value) {
								return;
							}
							const strip =
								keyProp.value.loc.source === keyProp.value.content ? 0 : 1;
							reportAuthored("staticKey", {
								begin: keyProp.value.loc.start.offset + strip,
								end: keyProp.value.loc.end.offset - strip,
							});
							return;
						}

						const keyExpression = keyProp.exp;
						const shorthand = !keyExpression;
						const authoredKeyRange = shorthand
							? {
									begin:
										keyProp.arg?.loc.start.offset ?? keyProp.loc.start.offset,
									end: keyProp.arg?.loc.end.offset ?? keyProp.loc.end.offset,
								}
							: {
									begin: keyExpression.loc.start.offset,
									end: keyExpression.loc.end.offset,
								};
						const reportRange = shorthand
							? {
									begin: keyProp.loc.start.offset,
									end: keyProp.loc.end.offset,
								}
							: authoredKeyRange;
						const loopVariableRanges = [
							forParseResult.value,
							forParseResult.key,
							forParseResult.index,
						]
							.filter((value) => value != null)
							.map((value) => ({
								begin: value.loc.start.offset,
								end: value.loc.end.offset,
							}));
						if (
							!referencesLoopVariable(
								authoredKeyRange,
								loopVariableRanges,
								SpanMapFeature.References,
							) &&
							!referencesLoopVariable(
								authoredKeyRange,
								loopVariableRanges,
								SpanMapFeature.Hover,
							)
						) {
							reportAuthored("invalidKey", reportRange);
						}
					};

					const visitTag = (node: vue.TemplateChildNode): void => {
						if (node.type !== vue.NodeTypes.ELEMENT) {
							return;
						}
						let forDirective: null | vue.DirectiveNode = null;
						let forParseResult: null | vue.ForParseResult = null;
						let keyProp: null | vue.AttributeNode | vue.DirectiveNode = null;
						for (const prop of node.props) {
							if (
								prop.type === vue.NodeTypes.DIRECTIVE &&
								prop.name === "for" &&
								prop.forParseResult
							) {
								forDirective = prop;
								forParseResult = prop.forParseResult;
							} else if (
								prop.type === vue.NodeTypes.DIRECTIVE &&
								prop.name === "bind" &&
								vue.isStaticArgOf(prop.arg, "key")
							) {
								keyProp = prop;
							} else if (
								prop.type === vue.NodeTypes.ATTRIBUTE &&
								prop.name === "key"
							) {
								keyProp = prop;
							}
						}
						if (forDirective && forParseResult) {
							checkFor(forDirective, forParseResult, keyProp);
						}
						for (const child of node.children) {
							visitTag(child);
						}
					};
					for (const child of templateBlock.children) {
						visitTag(child);
					}
				},
			},
		};
	},
});
