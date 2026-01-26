import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface SignatureInfo {
	node: ts.SignatureDeclaration;
	params: string[];
	returnType: string;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports function overloads that could be unified.",
		id: "unifiedSignatures",
		presets: ["stylistic"],
	},
	messages: {
		useUnionType: {
			primary: "These overloads could be unified using a union type.",
			secondary: [
				"Multiple overloads that differ only in one parameter type can use a union.",
			],
			suggestions: ["Combine the parameter types using a union type."],
		},
		useOptionalParam: {
			primary: "These overloads could be unified using an optional parameter.",
			secondary: [
				"Overloads that differ by an extra parameter can use optional parameters.",
			],
			suggestions: ["Make the extra parameter optional."],
		},
	},
	setup(context) {
		function getSignatures(
			members: ts.NodeArray<ts.TypeElement> | ts.NodeArray<ts.ClassElement>,
			sourceFile: ts.SourceFile,
		): Map<string, SignatureInfo[]> {
			const signatures = new Map<string, SignatureInfo[]>();

			for (const member of members) {
				if (
					(ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) &&
					member.name &&
					ts.isIdentifier(member.name)
				) {
					const name = member.name.text;
					const params = member.parameters.map((p) =>
						p.type ? p.type.getText(sourceFile) : "any",
					);
					const returnType = member.type
						? member.type.getText(sourceFile)
						: "void";

					const info: SignatureInfo = { node: member, params, returnType };
					const existing = signatures.get(name) ?? [];
					existing.push(info);
					signatures.set(name, existing);
				}

				if (ts.isCallSignatureDeclaration(member)) {
					const name = "__call";
					const params = member.parameters.map((p) =>
						p.type ? p.type.getText(sourceFile) : "any",
					);
					const returnType = member.type
						? member.type.getText(sourceFile)
						: "void";

					const info: SignatureInfo = { node: member, params, returnType };
					const existing = signatures.get(name) ?? [];
					existing.push(info);
					signatures.set(name, existing);
				}
			}

			return signatures;
		}

		function checkOverloads(
			signatures: SignatureInfo[],
			{ sourceFile }: TypeScriptFileServices,
		) {
			for (let i = 0; i < signatures.length; i++) {
				for (let j = i + 1; j < signatures.length; j++) {
					const sig1 = signatures[i];
					const sig2 = signatures[j];

					if (sig1.returnType !== sig2.returnType) {
						continue;
					}

					if (sig1.params.length === sig2.params.length) {
						let diffCount = 0;
						for (let k = 0; k < sig1.params.length; k++) {
							if (sig1.params[k] !== sig2.params[k]) {
								diffCount++;
							}
						}

						if (diffCount === 1) {
							context.report({
								message: "useUnionType",
								range: getTSNodeRange(sig2.node, sourceFile),
							});
						}
					} else if (Math.abs(sig1.params.length - sig2.params.length) === 1) {
						const shorter =
							sig1.params.length < sig2.params.length ? sig1 : sig2;
						const longer =
							sig1.params.length < sig2.params.length ? sig2 : sig1;

						let matches = true;
						for (let k = 0; k < shorter.params.length; k++) {
							if (shorter.params[k] !== longer.params[k]) {
								matches = false;
								break;
							}
						}

						if (matches) {
							context.report({
								message: "useOptionalParam",
								range: getTSNodeRange(longer.node, sourceFile),
							});
						}
					}
				}
			}
		}

		function checkNode(
			node: AST.InterfaceDeclaration | AST.TypeLiteralNode,
			services: TypeScriptFileServices,
		) {
			const signatures = getSignatures(node.members, services.sourceFile);
			for (const sigs of signatures.values()) {
				if (sigs.length > 1) {
					checkOverloads(sigs, services);
				}
			}
		}

		return {
			visitors: {
				InterfaceDeclaration: checkNode,
				TypeLiteral: checkNode,
			},
		};
	},
});
