import { ruleTester } from "./ruleTester.ts";
import rule from "./windowMessagingTargetOrigin.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
window.postMessage("message");
`,
			snapshot: `
window.postMessage("message");
       ~~~~~~~~~~~
       This \`postMessage()\` call is missing the required \`targetOrigin\` argument.
`,
		},
		{
			code: `
self.postMessage("message");
`,
			snapshot: `
self.postMessage("message");
     ~~~~~~~~~~~
     This \`postMessage()\` call is missing the required \`targetOrigin\` argument.
`,
		},
		{
			code: `
globalThis.postMessage("message");
`,
			snapshot: `
globalThis.postMessage("message");
           ~~~~~~~~~~~
           This \`postMessage()\` call is missing the required \`targetOrigin\` argument.
`,
		},
		{
			code: `
parent.postMessage("message");
`,
			snapshot: `
parent.postMessage("message");
       ~~~~~~~~~~~
       This \`postMessage()\` call is missing the required \`targetOrigin\` argument.
`,
		},
		{
			code: `
if (top)
top.postMessage("message");
`,
			snapshot: `
if (top)
top.postMessage("message");
    ~~~~~~~~~~~
    This \`postMessage()\` call is missing the required \`targetOrigin\` argument.
`,
		},
	],
	valid: [
		`window.postMessage("message", "https://example.com");`,
		`window.postMessage("message", "*");`,
		`self.postMessage("message", "https://example.com");`,
		`globalThis.postMessage("message", "*");`,
		`parent.postMessage("message", "https://example.com");`,
		`
			if (top)
			top.postMessage("message", "*");
		`,
		`
			declare const worker: Worker;
			worker.postMessage("message");
		`,
		`
			declare const messagePort: MessagePort;
			messagePort.postMessage("message");
		`,
		`
			declare const broadcastChannel: BroadcastChannel;
			broadcastChannel.postMessage("message");
		`,
		`
			declare const otherObject: { postMessage(message: string): void };
			otherObject.postMessage("message");
		`,
		`
			declare const other: { postMessage(message: string): void };
			other.postMessage("message");
		`,
		`
			declare const window: { postMessage(message: string): void };
			window.postMessage("message");
			export {};
		`,
	],
});
