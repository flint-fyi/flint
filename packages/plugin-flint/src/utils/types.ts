import type { InvalidTestCase, TestCase } from "@flint.fyi/rule-tester";
import type {
	AST,
	StaticString,
	StringRawNoSubstitution,
} from "@flint.fyi/typescript-language";

export type ParsedTestCase = TestCase & {
	nodes: ParsedTestCaseNodes;
};

export type ParsedTestCaseCodeNode =
	| AST.NoSubstitutionTemplateLiteral
	| AST.StringLiteral
	| (AST.TaggedTemplateExpression & {
			template: AST.NoSubstitutionTemplateLiteral;
	  });

export type ParsedTestCaseInvalid = InvalidTestCase & {
	nodes: ParsedTestCaseNodesInvalid;
};

export interface ParsedTestCaseNodes {
	case: AST.ObjectLiteralExpression | StaticString | StringRawNoSubstitution;
	code?: ParsedTestCaseCodeNode | undefined;
	fileCodes?: Record<string, ParsedTestCaseCodeNode> | undefined;
	files?: AST.ObjectLiteralExpression | undefined;
	name?: ParsedTestCaseStaticStringNode | undefined;
	options?: AST.ObjectLiteralExpression | undefined;
}

export interface ParsedTestCaseNodesInvalid extends ParsedTestCaseNodes {
	snapshot: AST.ObjectLiteralExpression | ParsedTestCaseCodeNode;
	snapshotFiles?: Record<string, ParsedTestCaseCodeNode> | undefined;
}
export type ParsedTestCaseStaticStringNode =
	AST.NoSubstitutionTemplateLiteral | AST.StringLiteral;
