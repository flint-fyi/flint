import { createPlugin } from "@flint.fyi/core";

import accessKeys from "./rules/accessKeys.ts";
import altTexts from "./rules/altTexts.ts";
import anchorAmbiguousText from "./rules/anchorAmbiguousText.ts";
import anchorContent from "./rules/anchorContent.ts";
import anchorValidity from "./rules/anchorValidity.ts";
import ariaActiveDescendantTabIndex from "./rules/ariaActiveDescendantTabIndex.ts";
import ariaHiddenFocusables from "./rules/ariaHiddenFocusables.ts";
import ariaProps from "./rules/ariaProps.ts";
import ariaPropTypes from "./rules/ariaPropTypes.ts";
import ariaRoleValidity from "./rules/ariaRoleValidity.ts";
import ariaUnsupportedElements from "./rules/ariaUnsupportedElements.ts";
import autocomplete from "./rules/autocomplete.ts";
import autoFocusProps from "./rules/autoFocusProps.ts";
import booleanValues from "./rules/booleanValues.ts";
import bracedStatements from "./rules/bracedStatements.ts";
import buttonTypes from "./rules/buttonTypes.ts";
import childrenProps from "./rules/childrenProps.ts";
import clickEventKeyEvents from "./rules/clickEventKeyEvents.ts";
import commentTextNodes from "./rules/commentTextNodes.ts";
import distractingElements from "./rules/distractingElements.ts";
import elementChildrenValidity from "./rules/elementChildrenValidity.ts";
import headingContents from "./rules/headingContents.ts";
import htmlLangs from "./rules/htmlLangs.ts";
import iframeTitles from "./rules/iframeTitles.ts";
import interactiveElementRoles from "./rules/interactiveElementRoles.ts";
import interactiveElementsFocusable from "./rules/interactiveElementsFocusable.ts";
import labelAssociatedControls from "./rules/labelAssociatedControls.ts";
import langValidity from "./rules/langValidity.ts";
import mediaCaptions from "./rules/mediaCaptions.ts";
import mouseEventKeyEvents from "./rules/mouseEventKeyEvents.ts";
import nonInteractiveElementInteractions from "./rules/nonInteractiveElementInteractions.ts";
import nonInteractiveElementRoles from "./rules/nonInteractiveElementRoles.ts";
import nonInteractiveElementTabIndexes from "./rules/nonInteractiveElementTabIndexes.ts";
import propDuplicates from "./rules/propDuplicates.ts";
import roleRedundancies from "./rules/roleRedundancies.ts";
import roleRequiredAriaProps from "./rules/roleRequiredAriaProps.ts";
import roleSupportedAriaProps from "./rules/roleSupportedAriaProps.ts";
import roleTags from "./rules/roleTags.ts";
import scopeProps from "./rules/scopeProps.ts";
import staticElementInteractions from "./rules/staticElementInteractions.ts";
import svgTitles from "./rules/svgTitles.ts";
import tabIndexPositiveValues from "./rules/tabIndexPositiveValues.ts";
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
		propDuplicates,
		headingContents,
		htmlLangs,
		iframeTitles,
		interactiveElementsFocusable,
		interactiveElementRoles,
		labelAssociatedControls,
		langValidity,
		mediaCaptions,
		mouseEventKeyEvents,
		nonInteractiveElementInteractions,
		nonInteractiveElementRoles,
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
