import { nullThrows } from "@flint.fyi/utils";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import type { AST } from "../../index.ts";
import type { Checker } from "../../types/checker.ts";

/**
 * Does a simple check to see if there is an any being assigned to a non-any type.
 *
 * This also checks generic positions to ensure there's no unsafe sub-assignments.
 * Note: in the case of generic positions, it makes the assumption that the two types are the same.
 * @example See tests for examples
 * @returns false if it's safe, or an object with the two types if it's unsafe
 */
export function isUnsafeAssignment(
	type: ts.Type,
	receiver: ts.Type,
	checker: Checker,
	senderNode: AST.Expression,
): false | { receiver: ts.Type; sender: ts.Type } {
	return isUnsafeAssignmentWorker(
		type,
		receiver,
		checker,
		senderNode,
		new Map(),
	);
}

function isUnsafeAssignmentWorker(
	type: ts.Type,
	receiver: ts.Type,
	checker: Checker,
	senderNode: AST.Expression,
	visited: Map<ts.Type, Set<ts.Type>>,
): false | { receiver: ts.Type; sender: ts.Type } {
	if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
		// Allow assignment of any ==> unknown.
		if (tsutils.isTypeFlagSet(receiver, ts.TypeFlags.Unknown)) {
			return false;
		}

		if (!tsutils.isTypeFlagSet(receiver, ts.TypeFlags.Any)) {
			return { receiver, sender: type };
		}
	}

	const typeAlreadyVisited = visited.get(type);

	if (typeAlreadyVisited) {
		if (typeAlreadyVisited.has(receiver)) {
			return false;
		}
		typeAlreadyVisited.add(receiver);
	} else {
		visited.set(type, new Set([receiver]));
	}

	if (tsutils.isTypeReference(type) && tsutils.isTypeReference(receiver)) {
		// TODO - figure out how to handle cases like this,
		// where the types are assignable, but not the same type
		/*
    function foo(): ReadonlySet<number> { return new Set<any>(); }

    // and

    type Test<T> = { prop: T }
    type Test2 = { prop: string }
    declare const a: Test<any>;
    const b: Test2 = a;
    */

		if (type.target !== receiver.target) {
			// if the type references are different, assume safe, as we won't know how to compare the two types
			// the generic positions might not be equivalent for both types
			return false;
		}

		if (
			senderNode.kind === SyntaxKind.NewExpression &&
			senderNode.expression.kind === SyntaxKind.Identifier &&
			senderNode.expression.text === "Map" &&
			(senderNode.arguments == null || senderNode.arguments.length === 0) &&
			senderNode.typeArguments == null
		) {
			// special case to handle `new Map()`
			// unfortunately Map's default empty constructor is typed to return `Map<any, any>` :(
			// https://github.com/typescript-eslint/typescript-eslint/issues/2109#issuecomment-634144396
			return false;
		}

		const typeArguments = type.typeArguments ?? [];
		const receiverTypeArguments = receiver.typeArguments ?? [];

		for (let i = 0; i < typeArguments.length; i += 1) {
			const arg = nullThrows(
				typeArguments[i],
				"Type argument is expected to be present by the loop condition",
			);
			const receiverArg = nullThrows(
				receiverTypeArguments[i],
				"Receiver type should have the same number of type arguments as the sender type when they share the same target",
			);

			const unsafe = isUnsafeAssignmentWorker(
				arg,
				receiverArg,
				checker,
				senderNode,
				visited,
			);
			if (unsafe) {
				return { receiver, sender: type };
			}
		}

		return false;
	}

	return false;
}
