import {
	getStaticStringValue,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function escapeForRegexLiteral(pattern: string) {
	if (pattern === "") {
		return "(?:)";
	}

	let result = "";
	let escaped = false;

	for (const char of pattern) {
		if (escaped) {
			result += char;
			escaped = false;
			continue;
		}

		switch (char) {
			case "\n": {
				result += "\\n";
				break;
			}

			case "\r": {
				result += "\\r";
				break;
			}

			case "\u2028": {
				result += "\\u2028";
				break;
			}

			case "\u2029": {
				result += "\\u2029";
				break;
			}

			case "/": {
				result += "\\/";
				break;
			}

			case "\\": {
				result += char;
				escaped = true;
				break;
			}

			default:
				result += char;
				break;
		}
	}

	return result;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Use a regular expression literal when the pattern is static.",
		id: "regexLiterals",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferLiteral: {
			primary:
				"This `RegExp` construction with a static value can be simplified to a regular expression literal.",
			secondary: [
				"Regex literals are more concise and avoid unnecessary constructor calls.",
			],
			suggestions: ["Replace with regex literal `{{ literal }}`."],
		},
	},
	setup(context) {
		function checkRegExpCall(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			if (construction.args.length === 2) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (getStaticStringValue(construction.args[1]!) === undefined) {
					return;
				}
			}

			if (!parseRegexpAst(construction.pattern, construction.flags)) {
				return;
			}

			const patternEscaped = escapeForRegexLiteral(construction.raw);
			const literal = `/${patternEscaped}/${construction.flags}`;
			const begin = node.getStart(services.sourceFile);

			context.report({
				data: { literal },
				fix: {
					range: {
						begin,
						end: node.getEnd(),
					},
					text: literal,
				},
				message: "preferLiteral",
				range: {
					begin,
					end: node.expression.getEnd(),
				},
			});
		}

		return {
			visitors: {
				CallExpression: checkRegExpCall,
				NewExpression: checkRegExpCall,
			},
		};
	},
});
