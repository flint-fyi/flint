import type { InvalidTestCase, TestCase } from "@flint.fyi/rule-tester";
import type {
	AST,
	StaticString,
	StringRawNoSubstitution,
} from "@flint.fyi/typescript-language";

export interface ParsedTestCase extends TestCase {
	nodes: ParsedTestCaseNodes;
}

export type ParsedTestCaseCodeNode =
	| AST.NoSubstitutionTemplateLiteral
	| AST.StringLiteral
	| (AST.TaggedTemplateExpression & {
			template: AST.NoSubstitutionTemplateLiteral;
	  });

export interface ParsedTestCaseInvalid extends InvalidTestCase {
	nodes: ParsedTestCaseNodesInvalid;
}

export interface ParsedTestCaseNodes {
	case: AST.ObjectLiteralExpression | StaticString | StringRawNoSubstitution;
	code: ParsedTestCaseCodeNode;
	fileName?: ParsedTestCaseStaticStringNode | undefined;
	files?: AST.ObjectLiteralExpression | undefined;
	name?: ParsedTestCaseStaticStringNode | undefined;
	options?: AST.ObjectLiteralExpression | undefined;
}

export interface ParsedTestCaseNodesInvalid extends ParsedTestCaseNodes {
	snapshot: ParsedTestCaseCodeNode;
}
export type ParsedTestCaseStaticStringNode =
	| AST.NoSubstitutionTemplateLiteral
	| AST.StringLiteral;
