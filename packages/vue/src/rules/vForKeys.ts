import type { CharacterReportRange } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import { reportSourceCode } from "@flint.fyi/volar-language";
import { vueLanguage } from "@flint.fyi/vue-language";
import * as vue from "@vue/compiler-dom";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(vueLanguage, {
	about: {
		description: "Reports v-for directives without a valid key binding.",
		id: "vForKeys",
		preset: "logical",
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
		return {
			visitors: {
				SourceFile(node, services) {
					if (services.vue == null) {
						return;
					}
					const { map, sfc } = services.vue;

					const toGeneratedLocation = (sourceLocation: number) => {
						for (const [loc] of map.toGeneratedLocation(sourceLocation)) {
							return loc;
						}
						return undefined;
					};

					const toGeneratedLocationOrThrow = (sourceLocation: number) => {
						return nullThrows(
							toGeneratedLocation(sourceLocation),
							"Unable to map source location to generated location",
						);
					};

					const templateBlock = sfc.children.find(
						(c): c is vue.ElementNode =>
							c.type === vue.NodeTypes.ELEMENT && c.tag === "template",
					);
					if (templateBlock == null) {
						return {};
					}

					const propValueRange = (propValue: vue.TextNode) => {
						const strip = propValue.loc.source === propValue.content ? 0 : 1;
						return {
							begin: propValue.loc.start.offset + strip,
							end: propValue.loc.end.offset - strip,
						};
					};

					const checkFor = (
						forDirective: vue.DirectiveNode,
						forParseResult: vue.ForParseResult,
						keyProp: null | vue.AttributeNode | vue.DirectiveNode,
					) => {
						if (keyProp == null) {
							reportSourceCode(context, {
								message: "missingKey",
								range: {
									begin: forDirective.loc.start.offset,
									end: forDirective.loc.start.offset + "v-for".length,
								},
							});
							return;
						}
						if (keyProp.type === vue.NodeTypes.ATTRIBUTE) {
							if (keyProp.value == null) {
								return; // TS error
							}
							reportSourceCode(context, {
								message: "staticKey",
								range: propValueRange(keyProp.value),
							});
							return;
						}

						let reportRange: CharacterReportRange;
						let valueRange: CharacterReportRange;

						if (keyProp.exp == null) {
							// :key
							reportRange = {
								begin: keyProp.loc.start.offset,
								end: keyProp.loc.end.offset,
							};
							const generatedLocations = Array.from(
								map.toGeneratedLocation(
									nullThrows(keyProp.arg, "Expected keyProp.arg to be non-null")
										.loc.start.offset,
								),
							).filter(
								([, m]) =>
									nullThrows(
										m.lengths[0],
										"Expected mapping to have at least one range",
									) > 0,
							);

							// |key|: |key|
							//        ^^^^^
							// |key|: __VLS_ctx.|key|
							//                  ^^^^^
							const valueMapping = nullThrows(
								generatedLocations[1],
								"Expected :key two have two mappings",
							)[1];

							const generatedBegin = nullThrows(
								valueMapping.generatedOffsets[0],
								"Expected mapping to have at least one range",
							);
							valueRange = {
								begin: generatedBegin,
								end:
									generatedBegin +
									nullThrows(
										valueMapping.lengths[0],
										"Expected mapping to have at least one range",
									),
							};
						} else {
							reportRange = {
								begin: keyProp.exp.loc.start.offset,
								end: keyProp.exp.loc.end.offset,
							};

							valueRange = {
								begin: toGeneratedLocationOrThrow(keyProp.exp.loc.start.offset),
								end: toGeneratedLocationOrThrow(keyProp.exp.loc.end.offset),
							};
						}

						const loopVariableRanges = [
							forParseResult.value,
							forParseResult.key,
							forParseResult.index,
						]
							.filter((v) => v != null)
							.map((v) => ({
								begin: toGeneratedLocationOrThrow(v.loc.start.offset),
								end: toGeneratedLocationOrThrow(v.loc.end.offset),
							}));

						// TODO(perf): use ScopeManager instead
						// https://github.com/flint-fyi/flint/issues/400
						const find = (current: ts.Node) => {
							const currentBegin = current.getStart(node);
							const currentEnd = current.getEnd();
							if (
								currentBegin > valueRange.end ||
								currentEnd <= valueRange.begin
							) {
								return false;
							}
							if (
								currentBegin >= valueRange.begin &&
								currentEnd <= valueRange.end &&
								ts.isIdentifier(current)
							) {
								const symbol =
									services.typeChecker.getSymbolAtLocation(current);
								if (symbol?.valueDeclaration == null) {
									return false;
								}
								const declStart = symbol.valueDeclaration.getStart(node);
								const declEnd = symbol.valueDeclaration.getEnd();

								return loopVariableRanges.some(
									({ begin, end }) => declStart >= begin && declEnd <= end,
								);
							}

							return current.getChildren(node).some(find);
						};

						if (!find(node)) {
							reportSourceCode(context, {
								message: "invalidKey",
								range: reportRange,
							});
						}
					};

					// TODO: add vue: listeners to the language
					function visitTag(node: vue.TemplateChildNode) {
						if (node.type === vue.NodeTypes.ELEMENT) {
							let forDirective: null | vue.DirectiveNode = null;
							let forParseResult: null | vue.ForParseResult = null;
							let keyProp: null | vue.AttributeNode | vue.DirectiveNode = null;

							for (const prop of node.props) {
								if (
									prop.type === vue.NodeTypes.DIRECTIVE &&
									prop.name === "for" &&
									prop.forParseResult != null
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

							if (forDirective != null && forParseResult != null) {
								checkFor(forDirective, forParseResult, keyProp);
							}

							for (const child of node.children) {
								visitTag(child);
							}
						}
					}
					for (const child of templateBlock.children) {
						visitTag(child);
					}
				},
			},
		};
	},
});
