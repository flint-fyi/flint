import { createPlugin } from "@flint.fyi/core";

import alerts from "./rules/alerts.ts";
import classListToggles from "./rules/classListToggles.ts";
import documentCookies from "./rules/documentCookies.ts";
import eventListenerSubscriptions from "./rules/eventListenerSubscriptions.ts";
import implicitGlobals from "./rules/implicitGlobals.ts";
import keyboardEventKeys from "./rules/keyboardEventKeys.ts";
import nodeAppendMethods from "./rules/nodeAppendMethods.ts";
import nodeDatasetAttributes from "./rules/nodeDatasetAttributes.ts";
import nodeModificationMethods from "./rules/nodeModificationMethods.ts";
import nodeQueryMethods from "./rules/nodeQueryMethods.ts";
import nodeRemoveMethods from "./rules/nodeRemoveMethods.ts";
import nodeTextContents from "./rules/nodeTextContents.ts";
import removeEventListenerExpressions from "./rules/removeEventListenerExpressions.ts";
import scriptUrls from "./rules/scriptUrls.ts";
import windowMessagingTargetOrigin from "./rules/windowMessagingTargetOrigin.ts";

export const browser = createPlugin({
	name: "Browser",
	rules: [
		alerts,
		classListToggles,
		documentCookies,
		eventListenerSubscriptions,
		implicitGlobals,
		keyboardEventKeys,
		nodeAppendMethods,
		nodeDatasetAttributes,
		nodeModificationMethods,
		nodeQueryMethods,
		nodeRemoveMethods,
		nodeTextContents,
		removeEventListenerExpressions,
		scriptUrls,
		windowMessagingTargetOrigin,
	],
});
