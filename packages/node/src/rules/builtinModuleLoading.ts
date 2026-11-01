import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const nodeBuiltinModules = new Set([
	"assert",
	"assert/strict",
	"async_hooks",
	"buffer",
	"child_process",
	"cluster",
	"console",
	"constants",
	"crypto",
	"dgram",
	"diagnostics_channel",
	"dns",
	"dns/promises",
	"domain",
	"events",
	"fs",
	"fs/promises",
	"http",
	"http2",
	"https",
	"inspector",
	"inspector/promises",
	"module",
	"net",
	"os",
	"path",
	"path/posix",
	"path/win32",
	"perf_hooks",
	"process",
	"punycode",
	"querystring",
	"readline",
	"readline/promises",
	"repl",
	"stream",
	"stream/consumers",
	"stream/promises",
	"stream/web",
	"string_decoder",
	"sys",
	"timers",
	"timers/promises",
	"tls",
	"trace_events",
	"tty",
	"url",
	"util",
	"util/types",
	"v8",
	"vm",
	"wasi",
	"worker_threads",
	"zlib",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer process.getBuiltinModule() when loading Node.js built-in modules.",
		id: "builtinModuleLoading",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferBuiltinModuleLoading: {
			primary:
				"Prefer `process.getBuiltinModule()` over loading Node.js built-in modules.",
			secondary: [],
			suggestions: [""],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (node.parent.kind !== SyntaxKind.AwaitExpression) {
						return;
					}

					const argument = node.arguments[0];

					if (argument?.kind !== SyntaxKind.StringLiteral) {
						return;
					}

					const moduleName = argument.text.replace(/^node:/, "");

					if (!nodeBuiltinModules.has(moduleName)) {
						return;
					}

					context.report({
						message: "preferBuiltinModuleLoading",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
