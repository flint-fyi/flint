/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getFunctionName } from "./utils/getFunctionName.ts";

function isOverloadSignature(node: ts.Node): boolean {
	if (ts.isFunctionDeclaration(node)) {
		return !node.body;
	}

	return ts.isMethodSignature(node);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Require that function overload signatures be consecutive.",
		id: "overloadSignaturesAdjacent",
		presets: ["stylistic"],
	},
	messages: {
		overloadSignatureSeparated: {
			primary: "Function overload signatures should be consecutive.",
			secondary: [
				"Separating overload signatures makes code harder to read and maintain.",
				"Grouping all overloads for a function together makes it easier to read and understand that function.",
			],
			suggestions: [
				"Group all overload signatures for this function together.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				InterfaceDeclaration: (node, { sourceFile }) => {
					const overloads = new Map<
						string,
						{ index: number; node: ts.Node }[]
					>();

					for (let i = 0; i < node.members.length; i++) {
						const member = node.members[i]!;

						if (member.kind === ts.SyntaxKind.MethodSignature) {
							const name = getFunctionName(member);

							if (name) {
								const existing = overloads.get(name);
								if (existing) {
									existing.push({ index: i, node: member });
								} else {
									overloads.set(name, [{ index: i, node: member }]);
								}
							}
						}
					}

					for (const signatures of overloads.values()) {
						if (signatures.length < 2) {
							continue;
						}

						for (let i = 0; i < signatures.length - 1; i++) {
							const currentIndex = signatures[i]!.index;
							const nextIndex = signatures[i + 1]!.index;

							if (nextIndex !== currentIndex + 1) {
								context.report({
									message: "overloadSignatureSeparated",
									range: getTSNodeRange(signatures[i + 1]!.node, sourceFile),
								});
							}
						}
					}
				},
				SourceFile: (sourceFile) => {
					const overloads = new Map<
						string,
						{ index: number; node: ts.Node }[]
					>();

					for (let i = 0; i < sourceFile.statements.length; i++) {
						const statement = sourceFile.statements[i];

						if (
							ts.isFunctionDeclaration(statement) &&
							isOverloadSignature(statement)
						) {
							const name = getFunctionName(statement);

							if (name) {
								const existing = overloads.get(name);
								if (existing) {
									existing.push({ index: i, node: statement });
								} else {
									overloads.set(name, [{ index: i, node: statement }]);
								}
							}
						}
					}

					for (const signatures of overloads.values()) {
						if (signatures.length < 2) {
							continue;
						}

						for (let i = 0; i < signatures.length - 1; i++) {
							const currentIndex = signatures[i].index;
							const nextIndex = signatures[i + 1].index;

							if (nextIndex !== currentIndex + 1) {
								context.report({
									message: "overloadSignatureSeparated",
									range: getTSNodeRange(signatures[i + 1].node, sourceFile),
								});
							}
						}
					}
				},
				TypeLiteral: (node, { sourceFile }) => {
					const overloads = new Map<
						string,
						{ index: number; node: ts.Node }[]
					>();

					for (let i = 0; i < node.members.length; i++) {
						const member = node.members[i];

						if (ts.isMethodSignature(member)) {
							const name = getFunctionName(member);

							if (name) {
								const existing = overloads.get(name);
								if (existing) {
									existing.push({ index: i, node: member });
								} else {
									overloads.set(name, [{ index: i, node: member }]);
								}
							}
						}
					}

					for (const signatures of overloads.values()) {
						if (signatures.length < 2) {
							continue;
						}

						for (let i = 0; i < signatures.length - 1; i++) {
							const currentIndex = signatures[i].index;
							const nextIndex = signatures[i + 1].index;

							if (nextIndex !== currentIndex + 1) {
								context.report({
									message: "overloadSignatureSeparated",
									range: getTSNodeRange(signatures[i + 1].node, sourceFile),
								});
							}
						}
					}
				},
			},
		};
	},
});
