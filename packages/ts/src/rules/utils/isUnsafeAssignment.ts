import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	TypeFlags,
	type Checker,
	type Type,
} from "typescript-native/unstable/sync";

import type { AST } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

/**
 * Does a simple check to see if there is an any being assigned to a non-any type.
 *
 * This also checks generic positions to ensure there's no unsafe sub-assignments.
 * Note: in the case of generic positions, it makes the assumption that the two types are the same.
 * @example See tests for examples
 * @returns false if it's safe, or an object with the two types if it's unsafe
 */
export function isUnsafeAssignment(
	type: Type,
	receiver: Type,
	senderNode: AST.Expression,
	checker: Checker,
): false | { receiver: Type; sender: Type } {
	return isUnsafeAssignmentWorker(
		type,
		receiver,
		senderNode,
		checker,
		new Map(),
	);
}

function isUnsafeAssignmentWorker(
	type: Type,
	receiver: Type,
	senderNode: AST.Expression,
	checker: Checker,
	visited: Map<number, Set<number>>,
): false | { receiver: Type; sender: Type } {
	if (type.flags & TypeFlags.Any) {
		// Allow assignment of any ==> unknown.
		if (receiver.flags & TypeFlags.Unknown) {
			return false;
		}

		if (!(receiver.flags & TypeFlags.Any)) {
			return { receiver, sender: type };
		}
	}

	const typeAlreadyVisited = visited.get(type.id);

	if (typeAlreadyVisited) {
		if (typeAlreadyVisited.has(receiver.id)) {
			return false;
		}
		typeAlreadyVisited.add(receiver.id);
	} else {
		visited.set(type.id, new Set([receiver.id]));
	}

	if (type.isTypeReference() && receiver.isTypeReference()) {
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

		if (type.getTarget().id !== receiver.getTarget().id) {
			// if the type references are different, assume safe, as we won't know how to compare the two types
			// the generic positions might not be equivalent for both types
			return false;
		}

		if (
			senderNode.kind === SyntaxKind.NewExpression &&
			senderNode.expression.kind === SyntaxKind.Identifier &&
			senderNode.expression.text === "Map" &&
			!senderNode.arguments?.length &&
			senderNode.typeArguments == null
		) {
			// special case to handle `new Map()`
			// unfortunately Map's default empty constructor is typed to return `Map<any, any>` :(
			// https://github.com/typescript-eslint/typescript-eslint/issues/2109#issuecomment-634144396
			return false;
		}

		const typeArguments = checker.getTypeArguments(type);
		const receiverTypeArguments = checker.getTypeArguments(receiver);

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
				senderNode,
				checker,
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
