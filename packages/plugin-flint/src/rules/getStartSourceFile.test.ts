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
declare const node: ts.Node;
const start = node.getStart();
const end = node.getEnd();
`,
			snapshot: `
import ts from "typescript";
declare const node: ts.Node;
const start = node.getStart();
              ~~~~~~~~~~~~~~~
              \`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
const end = node.getEnd();
`,
		},
		{
			code: `
import ts from "typescript";
function visit(node: ts.Node) {
    const position = node.getStart();
    return position;
}
`,
			snapshot: `
import ts from "typescript";
function visit(node: ts.Node) {
    const position = node.getStart();
                     ~~~~~~~~~~~~~~~
                     \`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
    return position;
}
`,
		},
		{
			code: `
import ts from "typescript";
declare const node: ts.Node;
const range = [
    node.getStart(),
    node.getEnd()
];
`,
			snapshot: `
import ts from "typescript";
declare const node: ts.Node;
const range = [
    node.getStart(),
    ~~~~~~~~~~~~~~~
    \`getStart()\` should be called with a \`sourceFile\` parameter for better performance.
    node.getEnd()
];
`,
		},
	],
	valid: [
		`import ts from "typescript"; declare const node: ts.Node; declare const sourceFile: ts.SourceFile; node.getStart(sourceFile)`,
		`import ts from "typescript"; declare const custom: ts.Node; declare const sourceFile: ts.SourceFile; const custom = node.getStart(sourceFile)`,
		`import ts from "typescript"; function visit(node: ts.Node, sourceFile: ts.SourceFile) { return node.getStart(sourceFile); }`,
		`import ts from "typescript"; declare const node: ts.Node; node.getEnd()`,
		`declare const someOtherMethod: { getStart(): void }; someOtherMethod.getStart()`,
		`declare const nonNodeObject: { getStart(): void }; nonNodeObject.getStart()`,
	],
});
