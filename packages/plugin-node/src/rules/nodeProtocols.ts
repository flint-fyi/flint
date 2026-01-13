import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import ts, { SyntaxKind } from "typescript";

import { isDeclaredInNodeTypes } from "./utils/isDeclaredInNodeTypes.ts";

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

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer the `node:` protocol prefix for Node.js built-in modules for clarity and consistency.",
		id: "nodeProtocols",
		preset: "logical",
	},
	messages: {
		preferNodeProtocol: {
			primary:
				"Prefer the more explicit `node:{{ moduleName }}` over `{{ moduleName }}`.",
			secondary: [
				"The `node:` protocol makes it explicit that the module is a Node.js built-in.",
				"This prevents confusion with npm packages that might have the same name.",
				"The protocol is supported in Node.js 16+ and is the recommended way to import built-ins.",
			],
			suggestions: ["Use the `node:` protocol prefix for built-in modules."],
		},
	},
	setup(context) {
		function checkNode(node: AST.Expression, sourceFile: ts.SourceFile) {
			if (
				node.kind === SyntaxKind.StringLiteral &&
				nodeBuiltinModules.has(node.text) &&
				!node.text.startsWith("node:")
			) {
				context.report({
					data: { moduleName: node.text },
					message: "preferNodeProtocol",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind === SyntaxKind.Identifier &&
						node.expression.text === "require" &&
						node.arguments.length > 0 &&
						isDeclaredInNodeTypes(node.expression, typeChecker)
					) {
						checkNode(
							nullThrows(
								node.arguments[0],
								"First argument is expected to be present by prior length check",
							),
							sourceFile,
						);
					}
				},
				ImportDeclaration(node, { sourceFile }) {
					checkNode(node.moduleSpecifier, sourceFile);
				},
				ImportEqualsDeclaration(node, { sourceFile }) {
					if (
						node.moduleReference.kind === SyntaxKind.ExternalModuleReference
					) {
						checkNode(node.moduleReference.expression, sourceFile);
					}
				},
			},
		};
	},
});
