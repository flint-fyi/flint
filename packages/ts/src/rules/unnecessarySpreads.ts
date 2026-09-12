import { SyntaxKind, TypeFlags, type Program } from "typescript";

import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	unwrapParenthesizedNode,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { countCommentsInRange } from "./utils/countCommentsInRange.ts";

const collectionNames = new Set(["Map", "Set", "WeakMap", "WeakSet"]);
const freshArrayMethods = new Set([
	"concat",
	"filter",
	"flat",
	"flatMap",
	"map",
	"slice",
	"splice",
	"toReversed",
	"toSorted",
	"toSpliced",
	"with",
]);
const iterableStaticMethods = new Map([
	["Array", new Set(["from"])],
	["Object", new Set(["fromEntries"])],
	["Promise", new Set(["all", "allSettled", "any", "race"])],
]);
const typedArrayNames = new Set([
	"BigInt64Array",
	"BigUint64Array",
	"Float16Array",
	"Float32Array",
	"Float64Array",
	"Int8Array",
	"Int16Array",
	"Int32Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Uint16Array",
	"Uint32Array",
]);

function canFixFreshArray(
	node: AST.ArrayLiteralExpression,
	expression: AST.Expression,
	typeChecker: Checker,
) {
	if (
		node.parent.kind === SyntaxKind.AsExpression ||
		typeChecker.isTupleType(typeChecker.getTypeAtLocation(expression))
	) {
		return false;
	}

	const unwrapped = unwrapParenthesizedNode(expression);
	return !(
		(unwrapped.kind === SyntaxKind.CallExpression ||
			unwrapped.kind === SyntaxKind.NewExpression) &&
		unwrapped.expression.kind === SyntaxKind.Identifier &&
		unwrapped.expression.text === "Array" &&
		unwrapped.arguments?.length === 1
	);
}

function getDirectStaticCall(node: AST.CallExpression) {
	if (
		node.questionDotToken ||
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.questionDotToken
	) {
		return;
	}

	return node.expression;
}

function getFreshArrayExpression(
	expression: AST.Expression,
	typeChecker: Checker,
	program: Program,
) {
	const unwrapped = unwrapParenthesizedNode(expression);
	if (unwrapped.kind === SyntaxKind.AwaitExpression) {
		const awaited = unwrapParenthesizedNode(unwrapped.expression);
		if (awaited.kind !== SyntaxKind.CallExpression) {
			return;
		}

		const access = getDirectStaticCall(awaited);
		if (
			access?.expression.kind === SyntaxKind.Identifier &&
			access.expression.text === "Promise" &&
			(access.name.text === "all" || access.name.text === "allSettled") &&
			isGlobalName(access.expression, "Promise", typeChecker, program) &&
			isDefaultLibraryCall(awaited, typeChecker, program)
		) {
			return unwrapped;
		}

		return;
	}

	if (
		unwrapped.kind !== SyntaxKind.CallExpression &&
		unwrapped.kind !== SyntaxKind.NewExpression
	) {
		return;
	}

	if (
		isGlobalName(unwrapped.expression, "Array", typeChecker, program) &&
		isDefaultLibraryCall(unwrapped, typeChecker, program)
	) {
		return unwrapped;
	}

	if (unwrapped.kind === SyntaxKind.NewExpression) {
		return;
	}

	const access = getDirectStaticCall(unwrapped);
	if (!access || !isDefaultLibraryCall(unwrapped, typeChecker, program)) {
		return;
	}

	if (
		access.expression.kind === SyntaxKind.Identifier &&
		((access.expression.text === "Array" &&
			(access.name.text === "from" || access.name.text === "of")) ||
			(access.expression.text === "Object" &&
				(access.name.text === "keys" || access.name.text === "values"))) &&
		isGlobalName(
			access.expression,
			access.expression.text,
			typeChecker,
			program,
		)
	) {
		return unwrapped;
	}

	if (
		freshArrayMethods.has(access.name.text) &&
		isDefinitelyOrdinaryArray(access.expression, typeChecker)
	) {
		return unwrapped;
	}

	if (
		access.name.text === "split" &&
		(typeChecker.getTypeAtLocation(access.expression).flags &
			TypeFlags.StringLike) !==
			0
	) {
		return unwrapped;
	}
}

function getLiteralSpreadFix(
	spread: AST.SpreadAssignment | AST.SpreadElement,
	literal: AST.ArrayLiteralExpression | AST.ObjectLiteralExpression,
	container: AST.ExpressionParent | AST.ObjectLiteralExpression,
	sourceFile: AST.SourceFile,
) {
	if (
		hasComments(spread, sourceFile) ||
		(literal.kind === SyntaxKind.ObjectLiteralExpression &&
			isUnsafeObjectLiteral(literal)) ||
		(literal.kind === SyntaxKind.ArrayLiteralExpression &&
			container.kind === SyntaxKind.ArrayLiteralExpression &&
			literal.elements.some(
				(element) => element.kind === SyntaxKind.OmittedExpression,
			))
	) {
		return;
	}

	const items =
		literal.kind === SyntaxKind.ArrayLiteralExpression
			? literal.elements
			: literal.properties;
	if (!items.length) {
		return;
	}

	const text = items
		.map((item) =>
			item.kind === SyntaxKind.OmittedExpression
				? "undefined"
				: sourceFile.text.slice(item.getStart(sourceFile), item.getEnd()),
		)
		.join(", ");

	return [
		{
			range: getTSNodeRange(spread, sourceFile),
			text,
		},
	];
}

function getParentOutsideParentheses(node: AST.AnyNode) {
	let current = node;
	while (current.parent.kind === SyntaxKind.ParenthesizedExpression) {
		current = current.parent;
	}

	return current.parent;
}

function getSingleSpread(node: AST.ArrayLiteralExpression) {
	const element = node.elements[0];
	return node.elements.length === 1 &&
		element?.kind === SyntaxKind.SpreadElement
		? element
		: undefined;
}

function hasComments(node: AST.AnyNode, sourceFile: AST.SourceFile) {
	return (
		countCommentsInRange(sourceFile.text, getTSNodeRange(node, sourceFile)) > 0
	);
}

function isDefaultLibraryCall(
	node: AST.CallExpression | AST.NewExpression,
	typeChecker: Checker,
	program: Program,
) {
	const declaration = typeChecker.getResolvedSignature(node)?.getDeclaration();
	return (
		declaration !== undefined &&
		program.isSourceFileDefaultLibrary(declaration.getSourceFile())
	);
}

function isDefinitelyOrdinaryArray(node: AST.Expression, typeChecker: Checker) {
	function checkType(type: ReturnType<Checker["getTypeAtLocation"]>): boolean {
		if (type.isUnion()) {
			return type.types.every(checkType);
		}

		if (
			type.isIntersection() ||
			(type.flags &
				(TypeFlags.Any | TypeFlags.Unknown | TypeFlags.TypeParameter)) !==
				0
		) {
			return false;
		}

		return typeChecker.isArrayType(type) || typeChecker.isTupleType(type);
	}

	return checkType(typeChecker.getTypeAtLocation(node));
}

function isGlobalName(
	node: AST.Expression,
	name: string,
	typeChecker: Checker,
	program: Program,
) {
	return (
		node.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(node, name, typeChecker, program)
	);
}

function isIterableConsumer(
	node: AST.ArrayLiteralExpression,
	typeChecker: Checker,
	program: Program,
) {
	const parent = getParentOutsideParentheses(node);
	if (
		parent.kind === SyntaxKind.ForOfStatement &&
		unwrapParenthesizedNode(parent.expression) === node
	) {
		return true;
	}

	if (
		parent.kind === SyntaxKind.YieldExpression &&
		parent.asteriskToken &&
		parent.expression &&
		unwrapParenthesizedNode(parent.expression) === node
	) {
		return true;
	}

	if (
		(parent.kind !== SyntaxKind.CallExpression &&
			parent.kind !== SyntaxKind.NewExpression) ||
		parent.arguments?.length !== 1 ||
		!isDefaultLibraryCall(parent, typeChecker, program)
	) {
		return false;
	}

	if (parent.kind === SyntaxKind.NewExpression) {
		return (
			parent.expression.kind === SyntaxKind.Identifier &&
			(collectionNames.has(parent.expression.text) ||
				typedArrayNames.has(parent.expression.text)) &&
			isGlobalName(
				parent.expression,
				parent.expression.text,
				typeChecker,
				program,
			)
		);
	}

	const access = getDirectStaticCall(parent);
	if (access?.expression.kind !== SyntaxKind.Identifier) {
		return false;
	}

	return (
		(iterableStaticMethods
			.get(access.expression.text)
			?.has(access.name.text) === true ||
			(typedArrayNames.has(access.expression.text) &&
				access.name.text === "from")) &&
		isGlobalName(
			access.expression,
			access.expression.text,
			typeChecker,
			program,
		)
	);
}

function isUnsafeObjectLiteral(node: AST.ObjectLiteralExpression) {
	return node.properties.some((property) => {
		if (
			property.kind !== SyntaxKind.PropertyAssignment &&
			property.kind !== SyntaxKind.ShorthandPropertyAssignment &&
			property.kind !== SyntaxKind.SpreadAssignment
		) {
			return true;
		}

		return (
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.Identifier &&
			property.name.text === "__proto__"
		);
	});
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports spread syntax that redundantly copies values into literals or built-in operations.",
		id: "unnecessarySpreads",
		presets: ["logical"],
	},
	messages: {
		spreadCollectionArguments: {
			primary:
				"Pass the iterable as one argument to the standard `{{ name }}` constructor instead of spreading it into arguments.",
			secondary: [],
			suggestions: [],
		},
		unnecessaryFreshArraySpread: {
			primary: "Spreading this newly created array creates a second array.",
			secondary: [],
			suggestions: [],
		},
		unnecessaryIterableMaterialization: {
			primary:
				"This operation can consume the iterable without first creating a spread array.",
			secondary: [
				"Removing the array changes when iterator side effects occur, so review the eager materialization before changing it.",
			],
			suggestions: [],
		},
		unnecessaryLiteralSpread: {
			primary:
				"Spreading this literal into the surrounding literal or argument list is unnecessary.",
			secondary: [],
			suggestions: [],
		},
		unnecessaryObjectAssignWrapper: {
			primary:
				"This spread-only object is an unnecessary `Object.assign()` source wrapper.",
			secondary: [
				"Removing the wrapper changes property-read and target-write timing, so review side effects before changing it.",
			],
			suggestions: [],
		},
	},
	setup(context) {
		return {
			visitors: {
				ArrayLiteralExpression: (
					node,
					{ program, sourceFile, typeChecker },
				) => {
					const parent = getParentOutsideParentheses(node);
					if (
						parent.kind === SyntaxKind.SpreadElement &&
						unwrapParenthesizedNode(parent.expression) === node
					) {
						const container = parent.parent;
						const collectionConstructor =
							container.kind === SyntaxKind.NewExpression &&
							container.expression.kind === SyntaxKind.Identifier &&
							collectionNames.has(container.expression.text) &&
							isGlobalName(
								container.expression,
								container.expression.text,
								typeChecker,
								program,
							);
						context.report({
							fix: collectionConstructor
								? undefined
								: getLiteralSpreadFix(parent, node, container, sourceFile),
							message: "unnecessaryLiteralSpread",
							range: getTSNodeRange(parent, sourceFile),
						});
						return;
					}

					const spread = getSingleSpread(node);
					if (!spread) {
						return;
					}

					if (isIterableConsumer(node, typeChecker, program)) {
						context.report({
							message: "unnecessaryIterableMaterialization",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					const expression = getFreshArrayExpression(
						spread.expression,
						typeChecker,
						program,
					);
					if (!expression) {
						return;
					}

					context.report({
						fix:
							canFixFreshArray(node, expression, typeChecker) &&
							!hasComments(node, sourceFile)
								? [
										{
											range: getTSNodeRange(node, sourceFile),
											text: `(${sourceFile.text.slice(
												expression.getStart(sourceFile),
												expression.getEnd(),
											)})`,
										},
									]
								: undefined,
						message: "unnecessaryFreshArraySpread",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				NewExpression: (node, { program, sourceFile, typeChecker }) => {
					const argument = node.arguments?.[0];
					if (
						node.arguments?.length !== 1 ||
						argument?.kind !== SyntaxKind.SpreadElement ||
						node.expression.kind !== SyntaxKind.Identifier ||
						!collectionNames.has(node.expression.text) ||
						!isGlobalName(
							node.expression,
							node.expression.text,
							typeChecker,
							program,
						) ||
						unwrapParenthesizedNode(argument.expression).kind ===
							SyntaxKind.ArrayLiteralExpression
					) {
						return;
					}

					context.report({
						data: { name: node.expression.text },
						message: "spreadCollectionArguments",
						range: getTSNodeRange(argument, sourceFile),
					});
				},
				ObjectLiteralExpression: (
					node,
					{ program, sourceFile, typeChecker },
				) => {
					const parent = getParentOutsideParentheses(node);
					if (
						parent.kind === SyntaxKind.SpreadAssignment &&
						unwrapParenthesizedNode(parent.expression) === node
					) {
						const container = parent.parent;
						context.report({
							fix: getLiteralSpreadFix(parent, node, container, sourceFile),
							message: "unnecessaryLiteralSpread",
							range: getTSNodeRange(parent, sourceFile),
						});
						return;
					}

					if (
						!node.properties.length ||
						!node.properties.every(
							(property) => property.kind === SyntaxKind.SpreadAssignment,
						) ||
						parent.kind !== SyntaxKind.CallExpression
					) {
						return;
					}

					const index = parent.arguments.indexOf(node);
					const access = getDirectStaticCall(parent);
					if (
						index <= 0 ||
						access?.expression.kind !== SyntaxKind.Identifier ||
						access.expression.text !== "Object" ||
						access.name.text !== "assign" ||
						!isGlobalName(access.expression, "Object", typeChecker, program) ||
						!isDefaultLibraryCall(parent, typeChecker, program) ||
						!parent.arguments
							.slice(0, index)
							.some((argument) => argument.kind !== SyntaxKind.SpreadElement)
					) {
						return;
					}

					context.report({
						message: "unnecessaryObjectAssignWrapper",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
