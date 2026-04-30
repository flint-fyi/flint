import rule from "./getStartSourceFile.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import ts from "typescript";
declare const node: ts.Node;
node.getStart();
`,
			snapshot: `
import ts from "typescript";
declare const node: ts.Node;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
		{
			code: `
import ts from "typescript";
declare const node: string | ts.Node;
node.getStart();
`,
			snapshot: `
import ts from "typescript";
declare const node: string | ts.Node;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
		{
			code: `
import ts from "typescript";
interface CustomNode extends ts.Node {}
declare const node: CustomNode;
node.getStart();
`,
			snapshot: `
import ts from "typescript";
interface CustomNode extends ts.Node {}
declare const node: CustomNode;
node.getStart();
~~~~~~~~~~~~~~~
\`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
`,
		},
	],
	valid: [
		'import ts from "typescript"; declare const node: ts.Node; declare const sourceFile: ts.SourceFile;node.getStart(sourceFile);',
		'import ts from "typescript"; declare const node: string | ts.Node; declare const sourceFile: ts.SourceFile;node.getStart(sourceFile);',
		'import ts from "typescript"; interface CustomNode extends ts.Node {} declare const node: CustomNode; node.getStart(sourceFile);',
	],
});
