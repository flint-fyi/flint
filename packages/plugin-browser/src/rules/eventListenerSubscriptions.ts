import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const eventHandlerProperties = new Set([
	"onabort",
	"onanimationcancel",
	"onanimationend",
	"onanimationiteration",
	"onanimationstart",
	"onauxclick",
	"onbeforeinput",
	"onblur",
	"oncancel",
	"oncanplay",
	"oncanplaythrough",
	"onchange",
	"onclick",
	"onclose",
	"oncontextmenu",
	"oncopy",
	"oncuechange",
	"oncut",
	"ondblclick",
	"ondrag",
	"ondragend",
	"ondragenter",
	"ondragleave",
	"ondragover",
	"ondragstart",
	"ondrop",
	"ondurationchange",
	"onemptied",
	"onended",
	"onerror",
	"onfocus",
	"onfocusin",
	"onfocusout",
	"onformdata",
	"ongotpointercapture",
	"oninput",
	"oninvalid",
	"onkeydown",
	"onkeypress",
	"onkeyup",
	"onload",
	"onloadeddata",
	"onloadedmetadata",
	"onloadstart",
	"onlostpointercapture",
	"onmousedown",
	"onmouseenter",
	"onmouseleave",
	"onmousemove",
	"onmouseout",
	"onmouseover",
	"onmouseup",
	"onpaste",
	"onpause",
	"onplay",
	"onplaying",
	"onpointercancel",
	"onpointerdown",
	"onpointerenter",
	"onpointerleave",
	"onpointermove",
	"onpointerout",
	"onpointerover",
	"onpointerup",
	"onprogress",
	"onratechange",
	"onreset",
	"onresize",
	"onscroll",
	"onsecuritypolicyviolation",
	"onseeked",
	"onseeking",
	"onselect",
	"onselectionchange",
	"onselectstart",
	"onslotchange",
	"onstalled",
	"onsubmit",
	"onsuspend",
	"ontimeupdate",
	"ontoggle",
	"ontouchcancel",
	"ontouchend",
	"ontouchmove",
	"ontouchstart",
	"ontransitioncancel",
	"ontransitionend",
	"ontransitionrun",
	"ontransitionstart",
	"onvolumechange",
	"onwaiting",
	"onwheel",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer addEventListener over assigning to on* event handler properties.",
		id: "eventListenerSubscriptions",
		preset: "logical",
	},
	messages: {
		preferAddEventListener: {
			primary:
				"Prefer the multi-use `addEventListener` over assigning to the single-use `{{ property }}` property.",
			secondary: [
				"Using `addEventListener` provides more flexibility and follows modern DOM event handling practices.",
				"Event handler properties can only hold one function at a time, overwriting previous handlers.",
				"`addEventListener` allows multiple listeners for the same event and provides options for capture phase and passive listeners.",
			],
			suggestions: [
				"Replace with `addEventListener('{{ eventType }}', handler)` for better control and flexibility.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression(node, { sourceFile, typeChecker }) {
					if (
						node.operatorToken.kind !== SyntaxKind.EqualsToken ||
						node.left.kind !== SyntaxKind.PropertyAccessExpression ||
						!eventHandlerProperties.has(node.left.name.text.toLowerCase()) ||
						!isGlobalDeclaration(node.left, typeChecker)
					) {
						return;
					}

					const eventType = node.left.name.text.slice(2);

					context.report({
						data: { eventType, property: node.left.name.text },
						message: "preferAddEventListener",
						range: getTSNodeRange(node.left.name, sourceFile),
					});
				},
			},
		};
	},
});
