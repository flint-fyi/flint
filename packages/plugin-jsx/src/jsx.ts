import { createPlugin } from "@flint.fyi/core";

import accessKeys from "./rules/accessKeys.js";
import altTexts from "./rules/altTexts.js";
import anchorAmbiguousText from "./rules/anchorAmbiguousText.js";
import anchorContent from "./rules/anchorContent.js";
import anchorValidity from "./rules/anchorValidity.js";
import ariaActiveDescendantTabIndex from "./rules/ariaActiveDescendantTabIndex.js";
import ariaHiddenFocusables from "./rules/ariaHiddenFocusables.js";
import ariaProps from "./rules/ariaProps.js";
import ariaPropTypes from "./rules/ariaPropTypes.ts";
import ariaRoleValidity from "./rules/ariaRoleValidity.js";
import ariaUnsupportedElements from "./rules/ariaUnsupportedElements.js";
import autocomplete from "./rules/autocomplete.js";
import autoFocusProps from "./rules/autoFocusProps.js";
import booleanValues from "./rules/booleanValues.ts";
import bracedStatements from "./rules/bracedStatements.ts";
import buttonTypes from "./rules/buttonTypes.ts";
import childrenProps from "./rules/childrenProps.ts";
import clickEventKeyEvents from "./rules/clickEventKeyEvents.js";
import commentTextNodes from "./rules/commentTextNodes.ts";
import distractingElements from "./rules/distractingElements.js";
import elementChildrenValidity from "./rules/elementChildrenValidity.ts";
import headingContents from "./rules/headingContents.js";
import htmlLangs from "./rules/htmlLangs.js";
import iframeTitles from "./rules/iframeTitles.js";
import interactiveElementNonInteractiveRoles from "./rules/interactiveElementNonInteractiveRoles.js";
import interactiveElementRoles from "./rules/interactiveElementRoles.ts";
import interactiveElementsFocusable from "./rules/interactiveElementsFocusable.ts";
import labelAssociatedControls from "./rules/labelAssociatedControls.ts";
import langValidity from "./rules/langValidity.js";
import mediaCaptions from "./rules/mediaCaptions.js";
import mouseEventKeyEvents from "./rules/mouseEventKeyEvents.js";
import nonInteractiveElementInteractions from "./rules/nonInteractiveElementInteractions.ts";
import nonInteractiveElementRoles from "./rules/nonInteractiveElementRoles.js";
import nonInteractiveElementTabIndexes from "./rules/nonInteractiveElementTabIndexes.js";
import propDuplicates from "./rules/propDuplicates.ts";
import roleRedundancies from "./rules/roleRedundancies.js";
import roleRequiredAriaProps from "./rules/roleRequiredAriaProps.js";
import roleSupportedAriaProps from "./rules/roleSupportedAriaProps.js";
import roleTags from "./rules/roleTags.js";
import scopeProps from "./rules/scopeProps.js";
import staticElementInteractions from "./rules/staticElementInteractions.js";
import svgTitles from "./rules/svgTitles.ts";
import tabIndexPositiveValues from "./rules/tabIndexPositiveValues.js";
import unescapedEntities from "./rules/unescapedEntities.ts";
import unnecessaryFragments from "./rules/unnecessaryFragments.ts";

export const jsx = createPlugin({
	name: "JSX",
	rules: [
		accessKeys,
		altTexts,
		anchorAmbiguousText,
		anchorContent,
		anchorValidity,
		ariaActiveDescendantTabIndex,
		ariaHiddenFocusables,
		ariaProps,
		ariaPropTypes,
		ariaRoleValidity,
		ariaUnsupportedElements,
		autocomplete,
		autoFocusProps,
		booleanValues,
		bracedStatements,
		buttonTypes,
		childrenProps,
		clickEventKeyEvents,
		commentTextNodes,
		distractingElements,
		headingContents,
		htmlLangs,
		iframeTitles,
		interactiveElementNonInteractiveRoles,
		interactiveElementRoles,
		interactiveElementsFocusable,
		labelAssociatedControls,
		langValidity,
		mediaCaptions,
		mouseEventKeyEvents,
		nonInteractiveElementInteractions,
		nonInteractiveElementRoles,
		propDuplicates,
		nonInteractiveElementTabIndexes,
		roleRedundancies,
		roleRequiredAriaProps,
		roleSupportedAriaProps,
		roleTags,
		scopeProps,
		staticElementInteractions,
		svgTitles,
		tabIndexPositiveValues,
		unescapedEntities,
		unnecessaryFragments,
		elementChildrenValidity,
	],
});
