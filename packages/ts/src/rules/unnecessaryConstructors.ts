import ts from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports constructors that are equivalent to the implicit default constructor.",
		id: "unnecessaryConstructors",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unnecessaryConstructor: {
			primary:
				"This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.",
			secondary: [
				"Classes without an explicit constructor receive an implicit one: empty in base classes, and forwarding all arguments to the parent class in derived classes.",
				"Writing that same behavior out manually adds code to read without changing how the class works.",
			],
			suggestions: [
				"Remove the constructor in favor of the implicit default constructor.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				Constructor: (node, { sourceFile }) => {
					if (
						!node.body ||
						hasUsefulAccessibility(node) ||
						hasParameterPropertiesOrDecorators(node)
					) {
						return;
					}

					const redundant = classHasExtendsClause(node.parent)
						? isRedundantSuperCall(node.body, node.parameters)
						: !node.body.statements.length;

					if (!redundant) {
						return;
					}

					context.report({
						message: "unnecessaryConstructor",
						range: {
							begin: node.getStart(sourceFile),
							end: getConstructorKeywordEnd(node, sourceFile),
						},
						suggestions: [
							{
								id: "removeConstructor",
								range: {
									begin: node.getStart(sourceFile),
									end: node.getEnd(),
								},
								text: needsSeparatingSemicolon(node, sourceFile) ? ";" : "",
							},
						],
					});
				},
			},
		};
	},
});

function beginsWithExpressionContinuation(
	member: AST.ClassElement | undefined,
	sourceFile: AST.SourceFile,
) {
	const firstToken = member?.getFirstToken(sourceFile);
	if (!firstToken) {
		return false;
	}

	if (ts.isIdentifier(firstToken)) {
		return firstToken.text === "in" || firstToken.text === "instanceof";
	}

	return (
		firstToken.kind === ts.SyntaxKind.AsteriskToken ||
		firstToken.kind === ts.SyntaxKind.OpenBracketToken
	);
}

function classHasExtendsClause(
	node: AST.ClassDeclaration | AST.ClassExpression,
) {
	return (
		node.heritageClauses?.some(
			(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
		) ?? false
	);
}

function endsWithUnterminatedInitializer(
	member: AST.ClassElement | undefined,
	sourceFile: AST.SourceFile,
) {
	return (
		member !== undefined &&
		ts.isPropertyDeclaration(member) &&
		member.initializer !== undefined &&
		member.getLastToken(sourceFile)?.kind !== ts.SyntaxKind.SemicolonToken
	);
}

function getConstructorKeywordEnd(
	node: AST.ConstructorDeclaration,
	sourceFile: AST.SourceFile,
) {
	const keywordOrName = node
		.getChildren(sourceFile)
		.find(
			(child) =>
				child.kind === ts.SyntaxKind.ConstructorKeyword ||
				child.kind === ts.SyntaxKind.StringLiteral,
		);

	return (
		keywordOrName?.getEnd() ??
		node.getStart(sourceFile) + "constructor".length
	);
}

function hasParameterPropertiesOrDecorators(node: AST.ConstructorDeclaration) {
	return node.parameters.some(
		(parameter) =>
			ts.isParameterPropertyDeclaration(parameter, node) ||
			(ts.canHaveDecorators(parameter) &&
				!!ts.getDecorators(parameter)?.length),
	);
}

function hasUsefulAccessibility(node: AST.ConstructorDeclaration) {
	for (const modifier of node.modifiers ?? []) {
		switch (modifier.kind) {
			case ts.SyntaxKind.PrivateKeyword:
			case ts.SyntaxKind.ProtectedKeyword:
				return true;

			case ts.SyntaxKind.PublicKeyword:
				return classHasExtendsClause(node.parent);
		}
	}

	return false;
}

function isMatchingArgument(
	parameter: AST.ParameterDeclaration,
	argument: ts.Expression,
) {
	return parameter.dotDotDotToken
		? ts.isSpreadElement(argument) &&
				isMatchingIdentifiers(
					parameter.name,
					ts.skipParentheses(argument.expression),
				)
		: isMatchingIdentifiers(parameter.name, ts.skipParentheses(argument));
}

function isMatchingIdentifiers(first: ts.Node, second: ts.Node) {
	return (
		ts.isIdentifier(first) &&
		ts.isIdentifier(second) &&
		first.text === second.text
	);
}

function isPassingThrough(
	parameters: ts.NodeArray<AST.ParameterDeclaration>,
	superArguments: ts.NodeArray<ts.Expression>,
) {
	return (
		parameters.length === superArguments.length &&
		parameters.every((parameter, index) => {
			const argument = superArguments[index];
			return argument !== undefined && isMatchingArgument(parameter, argument);
		})
	);
}

function isRedundantSuperCall(
	body: AST.FunctionBody,
	parameters: ts.NodeArray<AST.ParameterDeclaration>,
) {
	const [statement] = body.statements;
	if (
		body.statements.length !== 1 ||
		!statement ||
		!ts.isExpressionStatement(statement)
	) {
		return false;
	}

	const call = ts.skipParentheses(statement.expression);

	return (
		ts.isCallExpression(call) &&
		call.expression.kind === ts.SyntaxKind.SuperKeyword &&
		parameters.every(isSimpleParameter) &&
		(isSpreadArguments(call.arguments) ||
			isPassingThrough(parameters, call.arguments))
	);
}

function isSimpleParameter(parameter: AST.ParameterDeclaration) {
	return ts.isIdentifier(parameter.name) && !parameter.initializer;
}

function isSpreadArguments(superArguments: ts.NodeArray<ts.Expression>) {
	const [argument] = superArguments;
	if (
		superArguments.length !== 1 ||
		!argument ||
		!ts.isSpreadElement(argument)
	) {
		return false;
	}

	const value = ts.skipParentheses(argument.expression);

	return ts.isIdentifier(value) && value.text === "arguments";
}

function needsSeparatingSemicolon(
	node: AST.ConstructorDeclaration,
	sourceFile: AST.SourceFile,
) {
	const members = node.parent.members;
	const index = members.indexOf(node);

	return (
		index > 0 &&
		endsWithUnterminatedInitializer(members.at(index - 1), sourceFile) &&
		beginsWithExpressionContinuation(members.at(index + 1), sourceFile)
	);
}
