import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";
import { SyntaxKind } from "typescript-native/unstable/ast";
import { createScanner } from "typescript-native/unstable/ast/scanner";

interface AliasData {
	declaration: string;
	type: string;
	typeParameters: boolean;
}

interface InterfaceData {
	bases: string[];
	declaration: string;
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
const compatibilityAliases = new Map([
	[
		"ExpressionParent",
		[
			"ArrayLiteralExpression",
			"ArrowFunction",
			"AsExpression",
			"BinaryExpression",
			"BindingElement",
			"CallExpression",
			"CaseClause",
			"ComputedPropertyName",
			"ConditionalExpression",
			"ElementAccessExpression",
			"EnumMember",
			"ExportAssignment",
			"ExportDeclaration",
			"ExpressionStatement",
			"ExternalModuleReference",
			"IfStatement",
			"ImportAttribute",
			"ImportDeclaration",
			"IterationStatement",
			"JsxExpression",
			"JsxSpreadAttribute",
			"NewExpression",
			"NonNullExpression",
			"ParameterDeclaration",
			"ParenthesizedExpression",
			"PartiallyEmittedExpression",
			"PropertyAssignment",
			"PropertyDeclaration",
			"ReturnStatement",
			"SatisfiesExpression",
			"ShorthandPropertyAssignment",
			"SpreadAssignment",
			"SpreadElement",
			"SwitchStatement",
			"TemplateSpan",
			"ThrowStatement",
			"TypeParameterDeclaration",
			"VariableDeclaration",
			"WithStatement",
			"YieldExpression",
		],
	],
	["MethodSignature", ["MethodSignatureDeclaration"]],
]);
const canonicalSyntaxKindNames = new Map<number, string>();
for (const [name, value] of Object.entries(SyntaxKind)) {
	if (typeof value === "number" && !canonicalSyntaxKindNames.has(value)) {
		canonicalSyntaxKindNames.set(value, name);
	}
}

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
		const text = tokenAt(tokens, index).text;
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
		if (tokenAt(tokens, index).text !== "export") {
			continue;
		}
		const declarationKind = tokenAt(tokens, index + 1).text;
		const name = tokenAt(tokens, index + 2).text;
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
				declaration: text.slice(
					tokenAt(tokens, index).start,
					tokenAt(tokens, end).end,
				),
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
				bases.push(tokenAt(tokens, baseStart).text);
				if (tokenAt(tokens, cursor).text === ",") {
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
			if (
				tokenAt(tokens, member).text !== "kind" ||
				tokens[member + 1]?.text !== ":"
			) {
				continue;
			}
			const kindEnd = findEnd(tokens, member + 2, ";");
			kindType = textBetween(text, tokens, member + 2, kindEnd - 1);
			break;
		}
		interfaces.set(name, {
			bases,
			declaration: text.slice(
				tokenAt(tokens, index).start,
				tokenAt(tokens, bodyEnd).end,
			),
			hasKind: kindType !== undefined,
			...(kindType === undefined ? {} : { kindType }),
			...(typeParameterConstraint === undefined
				? {}
				: { typeParameterConstraint }),
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
	return text.slice(tokenAt(tokens, start).start, tokenAt(tokens, end).end);
}

function tokenAt(tokens: TokenData[], index: number): TokenData {
	const token = tokens[index];
	if (!token) {
		throw new Error("Unexpected end of native AST declarations.");
	}
	return token;
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
	const reference = /^(\w+)<\s*(SyntaxKind\.\w+)\s*>$/.exec(alias.type);
	if (reference?.[1] !== "Token" && reference?.[2]) {
		coveredSyntaxKinds.add(reference[2]);
	}
}
for (const [name, data] of interfaces) {
	if (data.hasKind && data.typeParameterConstraint) {
		genericMembers.set(
			name,
			syntaxKindsFor(data.typeParameterConstraint)
				.filter((kind) => name !== "Token" || !coveredSyntaxKinds.has(kind))
				.map((kind) => `${name}Node<NativeAST.${kind}>`),
		);
	}
}

const specializedGenericKinds = new Set(
	[...genericMembers]
		.filter(([name]) => name !== "Token")
		.flatMap(([, members]) =>
			members.flatMap(
				(member) => /NativeAST\.(SyntaxKind\.\w+)/.exec(member)?.[1] ?? [],
			),
		),
);
const tokenMembers = genericMembers.get("Token");
if (!tokenMembers) {
	throw new Error("Missing native Token declaration.");
}
genericMembers.set(
	"Token",
	tokenMembers.filter((member) => {
		const kind = /NativeAST\.(SyntaxKind\.\w+)/.exec(member)?.[1];
		return !kind || !specializedGenericKinds.has(kind);
	}),
);

const preferredGenericByKind = new Map<string, string>();
for (const [name, members] of genericMembers) {
	if (name === "Token") {
		continue;
	}
	for (const member of members) {
		const kind = /NativeAST\.(SyntaxKind\.\w+)/.exec(member)?.[1];
		if (kind) {
			preferredGenericByKind.set(kind, member);
		}
	}
}

for (const [name, declaration] of aliases) {
	if (declaration.typeParameters) {
		continue;
	}
	const reference = /^(\w+)<\s*(SyntaxKind\.\w+)\s*>$/.exec(declaration.type);
	const target = reference?.[1];
	const typeArgument = reference?.[2];
	if (
		target &&
		genericMembers.has(target) &&
		typeArgument?.startsWith("SyntaxKind.")
	) {
		if (target === "Token" && coveredSyntaxKinds.has(typeArgument)) {
			continue;
		}
		concreteNames.add(name);
	}
}

const categoryNames = new Set(
	[...aliases]
		.filter(([name, declaration]) => declaration.type.trim() === `${name}Base`)
		.map(([name]) => name),
);
categoryNames.add("IterationStatement");
categoryNames.add("Node");
categoryNames.add("UnaryExpression");

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
				? kinds.map((kind) => `${name} & { readonly kind: NativeAST.${kind} }`)
				: [name];
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
	"/* eslint-disable @typescript-eslint/no-duplicate-type-constituents, @typescript-eslint/no-explicit-any, @typescript-eslint/no-invalid-void-type, perfectionist/sort-heritage-clauses, perfectionist/sort-interfaces, perfectionist/sort-modules, perfectionist/sort-union-types */",
	'import type * as NativeAST from "typescript-native/unstable/ast";',
	"",
];

const externalTypeNames = new Set<string>();
for (const fileName of ["ast.d.ts", "ast.generated.d.ts"]) {
	const text = fs.readFileSync(path.join(astDirectory, fileName), "utf8");
	for (const match of text.matchAll(
		/import(?: type)? \{([^}]+)\} from "(?:#[^"]+|\.\/spanMap\.ts)";/g,
	)) {
		const importedNames = match[1];
		if (!importedNames) {
			continue;
		}
		for (const importedName of importedNames.split(",")) {
			externalTypeNames.add(importedName.trim());
		}
	}
}

function localDeclaration(name: string, declaration: string): string {
	const alias = aliases.get(name);
	const tokenReference =
		alias && /^Token<\s*(SyntaxKind\.\w+)\s*>$/.exec(alias.type)?.[1];
	const preferredGeneric =
		tokenReference && preferredGenericByKind.get(tokenReference);
	if (preferredGeneric) {
		return `export type ${name} = ${preferredGeneric};`;
	}

	let output = declaration;
	for (const genericName of genericMembers.keys()) {
		if (genericName === "Token") {
			if (name === "Token") {
				output = output.replace("interface Token<", "interface TokenNode<");
			}
			continue;
		}
		output = output.replaceAll(
			new RegExp(`\\b${genericName}(?=<)`, "g"),
			`${genericName}Node`,
		);
	}
	for (const externalTypeName of externalTypeNames) {
		output = output.replaceAll(
			new RegExp(`\\b${externalTypeName}\\b`, "g"),
			`NativeAST.${externalTypeName}`,
		);
	}
	output = output.replace(
		/^(export interface \w+(?:<[^{}]+>)?) extends Node\b/,
		"$1 extends NodeBase",
	);
	const bodyStart = output.indexOf("{");
	if (bodyStart !== -1 && name !== "Node") {
		let body = output.slice(bodyStart);
		for (const categoryName of categoryNames) {
			const categoryBase = `${categoryName}Base`;
			body = body.replaceAll(
				new RegExp(`\\b${categoryBase}\\b`, "g"),
				categoryName,
			);
		}
		output = output.slice(0, bodyStart) + body;
	}
	if (name === "NodeArray") {
		output = output.replace(
			"NodeArray<T extends Node>",
			"NodeArray<T extends NodeBase>",
		);
	}
	return output;
}

for (const name of [...exportedNames].sort()) {
	if (
		(categoryNames.has(name) &&
			!interfaces.get(name)?.typeParameterConstraint) ||
		name === "NodeBase"
	) {
		continue;
	}
	const declaration =
		interfaces.get(name)?.declaration ?? aliases.get(name)?.declaration;
	if (declaration) {
		lines.push(localDeclaration(name, declaration));
	}
}

const nativeNodeDeclaration = interfaces.get("Node")?.declaration;
if (!nativeNodeDeclaration) {
	throw new Error("Missing native Node declaration.");
}
lines.push(
	localDeclaration(
		"NodeBase",
		nativeNodeDeclaration.replace("interface Node ", "interface NodeBase "),
	),
	"export type Token<TKind extends TokenSyntaxKind = TokenSyntaxKind> = TKind extends TokenSyntaxKind ? TokenNode<TKind> : never;",
);

lines.push("", "export interface SyntaxKindNamesByKind {");
for (const name of canonicalSyntaxKindNames.values()) {
	lines.push(`\t[NativeAST.SyntaxKind.${name}]: "${name}";`);
}
lines.push("}");

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
		members.push("SourceFile");
	}
	lines.push(`export type ${categoryName} =`);
	const uniqueMembers = [...new Set(members)].sort();
	for (const [index, member] of uniqueMembers.entries()) {
		lines.push(`\t| ${member}${index === uniqueMembers.length - 1 ? ";" : ""}`);
	}
	lines.push("");
}

for (const [name, members] of compatibilityAliases) {
	lines.push(
		`export type ${name} =`,
		...members
			.sort()
			.map(
				(member, index) =>
					`\t| ${member}${index === members.length - 1 ? ";" : ""}`,
			),
	);
}

lines.push(
	"export type LeftHandSideExpressionParent = Expression | Decorator;",
	"",
);

fs.writeFileSync(
	outputPath,
	await format(`${lines.join("\n")}\n`, {
		...(await resolveConfig(outputPath)),
		filepath: outputPath,
	}),
);
