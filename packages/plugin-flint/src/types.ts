import type { InvalidTestCase, TestCase } from "@flint.fyi/rule-tester";
import type { AST } from "@flint.fyi/ts";
import type * as ts from "typescript";

export interface ParsedTestCase extends TestCase {
	nodes: ParsedTestCaseNodes;
}

export interface ParsedTestCaseInvalid extends InvalidTestCase {
	nodes: ParsedTestCaseNodesInvalid;
}

export interface ParsedTestCaseNodes {
	case: ts.Node;
	code: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral;
	fileName?: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral | undefined;
	options?: AST.ObjectLiteralExpression | undefined;
}

export interface ParsedTestCaseNodesInvalid extends ParsedTestCaseNodes {
	snapshot: ts.Node;
}
