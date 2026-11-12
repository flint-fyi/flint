import rule from "./nodePropertyInChecks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
if ('a' in node) {}
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
if ('a' in node) {}
    ~~~~~~~~~~~
    Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Expression | AST.Statement;
if ('a' in node) {}
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Expression | AST.Statement;
if ('a' in node) {}
    ~~~~~~~~~~~
    Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
interface CustomNode extends AST.NodeBase {}
declare const node: CustomNode;
if ('a' in node) {}
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
interface CustomNode extends AST.NodeBase {}
declare const node: CustomNode;
if ('a' in node) {}
    ~~~~~~~~~~~
    Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
declare const node: Node;
if ('a' in node) {}
`,
			snapshot: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
declare const node: Node;
if ('a' in node) {}
    ~~~~~~~~~~~
    Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
interface CustomNode extends Node {}
declare const node: CustomNode;
if ('a' in node) {}
`,
			snapshot: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
interface CustomNode extends Node {}
declare const node: CustomNode;
if ('a' in node) {}
    ~~~~~~~~~~~
    Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
	],
	valid: [
		`
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
if (node.kind) {}
`,
		`
interface Node {
	kind: number;
}
declare const node: Node;
if ('a' in node) {}
`,
		`
interface NodeBase {
	kind: number;
}
declare const node: NodeBase;
if ('a' in node) {}
`,
	],
});
