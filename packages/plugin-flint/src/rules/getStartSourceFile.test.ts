import rule from "./getStartSourceFile.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
node.getStart();
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Expression | AST.Statement;
node.getStart();
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Expression | AST.Statement;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
		{
			code: `
import type { AST } from "@flint.fyi/typescript-language";
interface CustomNode extends AST.NodeBase {}
declare const node: CustomNode;
node.getStart();
`,
			snapshot: `
import type { AST } from "@flint.fyi/typescript-language";
interface CustomNode extends AST.NodeBase {}
declare const node: CustomNode;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
		{
			code: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
declare const node: Node;
node.getStart();
`,
			snapshot: `
import type { Node } from "@flint.fyi/typescript-language/native/ast";
declare const node: Node;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
	],
	valid: [
		`
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Node;
declare const sourceFile: AST.SourceFile;
node.getStart(sourceFile);
`,
		`
import type { AST } from "@flint.fyi/typescript-language";
declare const node: AST.Expression | AST.Statement;
declare const sourceFile: AST.SourceFile;
node.getStart(sourceFile);
`,
		`
import type { Node, SourceFile } from "@flint.fyi/typescript-language/native/ast";
interface CustomNode extends Node {}
declare const node: CustomNode;
declare const sourceFile: SourceFile;
node.getStart(sourceFile);
`,
		`
interface Node {
	getStart(): number;
}
declare const node: Node;
node.getStart();
`,
	],
});
