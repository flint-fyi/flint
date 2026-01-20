import rule from "./nodePropertyInChecks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import ts from "typescript";
declare const node: ts.Node;
if('a' in node) {}
`,
			snapshot: `
import ts from "typescript";
declare const node: ts.Node;
if('a' in node) {}
   ~~~~~~~~~~~
   Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import ts from "typescript";
declare const node: string | ts.Node;
if('a' in node) {}
`,
			snapshot: `
import ts from "typescript";
declare const node: string | ts.Node;
if('a' in node) {}
   ~~~~~~~~~~~
   Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
		{
			code: `
import ts from "typescript";
interface CustomNode extends ts.Node {}
declare const node: CustomNode;
if('a' in node) {}
`,
			snapshot: `
import ts from "typescript";
interface CustomNode extends ts.Node {}
declare const node: CustomNode;
if('a' in node) {}
   ~~~~~~~~~~~
   Avoid using the \`in\` operator to check properties on TypeScript nodes.
`,
		},
	],
	valid: [
		'import ts from "typescript"; declare const node: ts.Node; if(node.a) {}',
	],
});
