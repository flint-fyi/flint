import type { InvalidTestCase, TestCase } from "@flint.fyi/rule-tester";
import type { AST } from "@flint.fyi/typescript-language";
import type * as ts from "typescript";

export interface ParsedTestCase extends TestCase {
	nodes: ParsedTestCaseNodes;
}

export interface ParsedTestCaseInvalid extends InvalidTestCase {
	nodes: ParsedTestCaseNodesInvalid;
}

export interface ParsedTestCaseNodes {
	case: ts.Node;
	code:
		| AST.NoSubstitutionTemplateLiteral
		| AST.StringLiteral
		| (AST.TaggedTemplateExpression & {
				template: AST.NoSubstitutionTemplateLiteral;
		  });
	fileName?:
		| AST.NoSubstitutionTemplateLiteral
		| AST.StringLiteral
		| (AST.TaggedTemplateExpression & {
				template: AST.NoSubstitutionTemplateLiteral;
		  })
		| undefined;
	files?: AST.ObjectLiteralExpression | undefined;
	name?:
		| AST.NoSubstitutionTemplateLiteral
		| AST.StringLiteral
		| (AST.TaggedTemplateExpression & {
				template: AST.NoSubstitutionTemplateLiteral;
		  })
		| undefined;
	options?: AST.ObjectLiteralExpression | undefined;
}
export interface ParsedTestCaseNodesInvalid extends ParsedTestCaseNodes {
	snapshot: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral;
}
