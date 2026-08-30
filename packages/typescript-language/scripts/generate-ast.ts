import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";
import { SyntaxKind } from "typescript-native/unstable/ast";
import { createScanner } from "typescript-native/unstable/ast/scanner";

interface AliasData {
	type: string;
	typeParameters: boolean;
}

interface InterfaceData {
	bases: string[];
	hasKind: boolean;
	kindType?: string;
	typeParameterConstraint?: string;
}

interface TokenData {
	end: number;
	start: number;
	text: string;
}

const packageDirectory = path.resolve(fileURLToPath(import.meta.url), "../..");
const astDirectory = path.join(
	packageDirectory,
	"node_modules/typescript-native/dist/ast",
);
const outputPath = path.join(packageDirectory, "src/types/ast.ts");
const interfaces = new Map<string, InterfaceData>();
const aliases = new Map<string, AliasData>();
const categoryCompatibilityMembers = new Map([
	["IterationStatement", ["ForInStatement", "ForOfStatement"]],
]);

function closingAngleCount(text: string): number {
	return text.startsWith(">>>") ? 3 : text.startsWith(">>") ? 2 : 1;
}

function findEnd(
	tokens: TokenData[],
	start: number,
	terminator: string,
): number {
	let braceDepth = 0;
	let bracketDepth = 0;
	let parenthesisDepth = 0;
	let angleDepth = 0;
	for (let index = start; index < tokens.length; index += 1) {
		const text = tokens[index].text;
		if (
			text === terminator &&
			braceDepth === 0 &&
			bracketDepth === 0 &&
			parenthesisDepth === 0 &&
			angleDepth === 0
		) {
			return index;
		}
		braceDepth += text === "{" ? 1 : text === "}" ? -1 : 0;
		bracketDepth += text === "[" ? 1 : text === "]" ? -1 : 0;
		parenthesisDepth += text === "(" ? 1 : text === ")" ? -1 : 0;
		angleDepth +=
			text === "<" ? 1 : text.startsWith(">") ? -closingAngleCount(text) : 0;
	}
	throw new Error(`Missing ${terminator} in native AST declarations.`);
}

function parseDeclarations(text: string): void {
	const tokens = scan(text);
	for (let index = 0; index < tokens.length - 2; index += 1) {
		if (tokens[index].text !== "export") {
			continue;
		}
		const declarationKind = tokens[index + 1].text;
		const name = tokens[index + 2].text;
		if (declarationKind !== "interface" && declarationKind !== "type") {
			continue;
		}

		let cursor = index + 3;
		let typeParameterConstraint: string | undefined;
		let hasTypeParameters = false;
		if (tokens[cursor]?.text === "<") {
			hasTypeParameters = true;
			const end = findEnd(tokens, cursor + 1, ">");
			const typeParameterTokens = tokens.slice(cursor + 1, end);
			const extendsOffset = typeParameterTokens.findIndex(
				(token) => token.text === "extends",
			);
			const equalsOffset = typeParameterTokens.findIndex(
				(token) => token.text === "=",
			);
			const extendsIndex =
				extendsOffset === -1 ? -1 : cursor + 1 + extendsOffset;
			if (extendsIndex !== -1) {
				typeParameterConstraint = textBetween(
					text,
					tokens,
					extendsIndex + 1,
					equalsOffset === -1 ? end - 1 : cursor + equalsOffset,
				);
			}
			cursor = end + 1;
		}

		if (declarationKind === "type") {
			if (tokens[cursor]?.text !== "=") {
				throw new Error(`Missing = for native AST alias ${name}.`);
			}
			const end = findEnd(tokens, cursor + 1, ";");
			aliases.set(name, {
				type: textBetween(text, tokens, cursor + 1, end - 1),
				typeParameters: hasTypeParameters,
			});
			index = end;
			continue;
		}

		const bases: string[] = [];
		if (tokens[cursor]?.text === "extends") {
			cursor += 1;
			while (tokens[cursor]?.text !== "{") {
				const baseStart = cursor;
				while (tokens[cursor]?.text !== "," && tokens[cursor]?.text !== "{") {
					cursor += 1;
				}
				bases.push(tokens[baseStart].text);
				if (tokens[cursor].text === ",") {
					cursor += 1;
				}
			}
		}
		if (tokens[cursor]?.text !== "{") {
			throw new Error(`Missing body for native AST interface ${name}.`);
		}
		const bodyEnd = findEnd(tokens, cursor + 1, "}");
		let kindType: string | undefined;
		for (let member = cursor + 1; member < bodyEnd; member += 1) {
			if (tokens[member].text !== "kind" || tokens[member + 1]?.text !== ":") {
				continue;
			}
			const kindEnd = findEnd(tokens, member + 2, ";");
			kindType = textBetween(text, tokens, member + 2, kindEnd - 1);
			break;
		}
		interfaces.set(name, {
			bases,
			hasKind: kindType !== undefined,
			kindType,
			typeParameterConstraint,
		});
		index = bodyEnd;
	}
}

function scan(text: string): TokenData[] {
	const scanner = createScanner(true, undefined, text);
	const tokens: TokenData[] = [];
	while (scanner.scan() !== SyntaxKind.EndOfFile) {
		tokens.push({
			end: scanner.getTokenEnd(),
			start: scanner.getTokenStart(),
			text: scanner.getTokenText(),
		});
	}
	return tokens;
}

function textBetween(
	text: string,
	tokens: TokenData[],
	start: number,
	end: number,
): string {
	return text.slice(tokens[start].start, tokens[end].end);
}

for (const fileName of fs.readdirSync(astDirectory).sort()) {
	if (fileName !== "ast.d.ts" && fileName !== "ast.generated.d.ts") {
		continue;
	}

	parseDeclarations(fs.readFileSync(path.join(astDirectory, fileName), "utf8"));
}

function inheritsFrom(
	name: string,
	ancestor: string,
	seen = new Set<string>(),
): boolean {
	if (name === ancestor) {
		return true;
	}
	if (seen.has(name)) {
		return false;
	}
	seen.add(name);
	return (
		interfaces
			.get(name)
			?.bases.some((base) => inheritsFrom(base, ancestor, seen)) ?? false
	);
}

const concreteNames = new Set(
	[...interfaces]
		.filter(
			([name, data]) =>
				data.hasKind &&
				(name === "SourceFile" || inheritsFrom(name, "NodeBase")) &&
				!name.endsWith("Base") &&
				!data.typeParameterConstraint,
		)
		.map(([name]) => name),
);

function syntaxKindsFor(typeName: string, seen = new Set<string>()): string[] {
	if (seen.has(typeName)) {
		return [];
	}
	seen.add(typeName);
	const alias = aliases.get(typeName);
	if (!alias) {
		return typeName.startsWith("SyntaxKind.") ? [typeName] : [];
	}
	return alias.type
		.split("|")
		.flatMap((type) => syntaxKindsFor(type.trim(), new Set(seen)));
}

const genericMembers = new Map<string, string[]>();
const coveredSyntaxKinds = new Set(
	[...interfaces.values()].flatMap((data) =>
		data.kindType && !data.typeParameterConstraint
			? syntaxKindsFor(data.kindType)
			: [],
	),
);
for (const alias of aliases.values()) {
	const typeArgument = /^\w+<\s*(SyntaxKind\.\w+)\s*>$/.exec(alias.type)?.[1];
	if (typeArgument) {
		coveredSyntaxKinds.add(typeArgument);
	}
}
for (const [name, data] of interfaces) {
	if (data.hasKind && data.typeParameterConstraint) {
		genericMembers.set(
			name,
			syntaxKindsFor(data.typeParameterConstraint)
				.filter((kind) => name !== "Token" || !coveredSyntaxKinds.has(kind))
				.map((kind) => `NativeAST.${name}<NativeAST.${kind}>`),
		);
	}
}

for (const [name, declaration] of aliases) {
	if (declaration.typeParameters) {
		continue;
	}
	const reference = /^(\w+)<\s*(SyntaxKind\.\w+)\s*>$/.exec(declaration.type);
	const target = reference?.[1];
	const typeArgument = reference?.[2];
	if (genericMembers.has(target) && typeArgument?.startsWith("SyntaxKind.")) {
		concreteNames.add(name);
	}
}

const categoryBases = [...interfaces.keys()]
	.filter((name) => name.endsWith("Base") && inheritsFrom(name, "Node"))
	.sort();
const categoryNames = new Set(categoryBases.map((name) => name.slice(0, -4)));
categoryNames.add("Node");

for (const name of genericMembers.keys()) {
	if (name !== "Token") {
		categoryNames.add(name);
	}
}

function membersFor(base: string): string[] {
	const categoryName = base.slice(0, -4);
	const members = [...concreteNames]
		.filter((name) => {
			const declaration = aliases.get(name);
			if (categoryCompatibilityMembers.get(categoryName)?.includes(name)) {
				return true;
			}
			const target = declaration && /^(\w+)</.exec(declaration.type)?.[1];
			return inheritsFrom(target ?? name, base);
		})
		.flatMap((name) => {
			const data = interfaces.get(name);
			const kinds = data?.kindType ? syntaxKindsFor(data.kindType) : [];
			return kinds.length > 1
				? kinds.map(
						(kind) =>
							`NativeAST.${name} & { readonly kind: NativeAST.${kind} }`,
					)
				: [`NativeAST.${name}`];
		});
	for (const [name, genericVariants] of genericMembers) {
		if (inheritsFrom(name, base)) {
			members.push(...genericVariants);
		}
	}
	return members.sort();
}

const exportedNames = new Set([...interfaces.keys(), ...aliases.keys()]);
const lines = [
	"// Generated by scripts/generate-ast.ts. Do not edit.",
	"/* eslint-disable perfectionist/sort-modules, perfectionist/sort-union-types */",
	'import type * as NativeAST from "typescript-native/unstable/ast";',
	"",
];

for (const name of [...exportedNames].sort()) {
	if (
		name.endsWith("Base") ||
		categoryNames.has(name) ||
		interfaces.get(name)?.typeParameterConstraint ||
		aliases.get(name)?.typeParameters
	) {
		continue;
	}
	const declaration = `export type ${name} = NativeAST.${name};`;
	lines.push(
		declaration.length > 80
			? `export type ${name} =\n\tNativeAST.${name};`
			: declaration,
	);
}

lines.push(
	"export type Token<TKind extends NativeAST.TokenSyntaxKind = NativeAST.TokenSyntaxKind> = NativeAST.Token<TKind>;",
);

const generatedKindAliases = new Map<string, string>();
for (const members of genericMembers.values()) {
	for (const member of members) {
		const kindName = /SyntaxKind\.(\w+)/.exec(member)?.[1];
		if (kindName && !exportedNames.has(kindName)) {
			generatedKindAliases.set(kindName, member);
		}
	}
}
for (const [kindName, member] of [...generatedKindAliases].sort()) {
	lines.push(`export type ${kindName} = ${member};`);
}

lines.push("export type AnyNode = Node;", "");
lines.push("");
for (const categoryName of [...categoryNames].sort()) {
	const base = categoryName === "Node" ? "NodeBase" : `${categoryName}Base`;
	const members = genericMembers.get(categoryName) ?? membersFor(base);
	if (categoryName === "Node") {
		members.push("NativeAST.SourceFile");
	}
	lines.push(`export type ${categoryName} =`);
	const uniqueMembers = [...new Set(members)].sort();
	for (const [index, member] of uniqueMembers.entries()) {
		lines.push(`\t| ${member}${index === uniqueMembers.length - 1 ? ";" : ""}`);
	}
	lines.push("");
}

lines.push(
	"export type LeftHandSideExpressionParent = Expression | NativeAST.Decorator;",
	"",
);

fs.writeFileSync(
	outputPath,
	await format(`${lines.join("\n")}\n`, {
		...(await resolveConfig(outputPath)),
		filepath: outputPath,
	}),
);
