import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTemplateExpressions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const message = \`before \${"text"} after\`;
`,
			output: `
const message = \`before text after\`;
`,
			snapshot: `
const message = \`before \${"text"} after\`;
                        ~~~~~~~~~
                        This template expression can be written directly in the template.
`,
		},
		{
			code: `
declare const value: string;
const message = \`\${value}\`;
`,
			output: `
declare const value: string;
const message = value;
`,
			snapshot: `
declare const value: string;
const message = \`\${value}\`;
                ~~~~~~~~~~
                This template expression wraps an already string-valued expression.
`,
		},
		{
			code: `
const values = \`\${1}\${2n}\${true}\${false}\${null}\${undefined}\${NaN}\${Infinity}\${/a+/gi}\`;
`,
			output: `
const values = \`12truefalsenullundefinedNaNInfinity/a+/gi\`;
`,
			snapshot: `
const values = \`\${1}\${2n}\${true}\${false}\${null}\${undefined}\${NaN}\${Infinity}\${/a+/gi}\`;
                ~~~~
                This template expression can be written directly in the template.
                    ~~~~~
                    This template expression can be written directly in the template.
                         ~~~~~~~
                         This template expression can be written directly in the template.
                                ~~~~~~~~
                                This template expression can be written directly in the template.
                                        ~~~~~~~
                                        This template expression can be written directly in the template.
                                               ~~~~~~~~~~~~
                                               This template expression can be written directly in the template.
                                                           ~~~~~~
                                                           This template expression can be written directly in the template.
                                                                 ~~~~~~~~~~~
                                                                 This template expression can be written directly in the template.
                                                                            ~~~~~~~~~
                                                                            This template expression can be written directly in the template.
`,
		},
		{
			code: `
type Path = \`before \${"item"} after\`;
`,
			output: `
type Path = \`before item after\`;
`,
			snapshot: `
type Path = \`before \${"item"} after\`;
                    ~~~~~~~~~
                    This template expression can be written directly in the template.
`,
		},
		{
			code: `
declare const union: "left" | "right";
declare const branded: string & { readonly brand: unique symbol };
declare const left: string;
declare const right: string;
declare const condition: boolean;
const unionResult = \`\${union}\`;
const brandedResult = \`\${branded}\`;
const conditionalResult = \`\${condition ? left : right}\`;
function generic<T extends string>(value: T) {
    return \`\${value}\`;
}
function directive() {
    \`\${"use strict"}\`;
}
`,
			output: `
declare const union: "left" | "right";
declare const branded: string & { readonly brand: unique symbol };
declare const left: string;
declare const right: string;
declare const condition: boolean;
const unionResult = union;
const brandedResult = branded;
const conditionalResult = (condition ? left : right);
function generic<T extends string>(value: T) {
    return value;
}
function directive() {
    ("use strict");
}
`,
			snapshot: `
declare const union: "left" | "right";
declare const branded: string & { readonly brand: unique symbol };
declare const left: string;
declare const right: string;
declare const condition: boolean;
const unionResult = \`\${union}\`;
                    ~~~~~~~~~~
                    This template expression wraps an already string-valued expression.
const brandedResult = \`\${branded}\`;
                      ~~~~~~~~~~~~
                      This template expression wraps an already string-valued expression.
const conditionalResult = \`\${condition ? left : right}\`;
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                          This template expression wraps an already string-valued expression.
function generic<T extends string>(value: T) {
    return \`\${value}\`;
           ~~~~~~~~~~
           This template expression wraps an already string-valued expression.
}
function directive() {
    \`\${"use strict"}\`;
    ~~~~~~~~~~~~~~~~~
    This template expression wraps an already string-valued expression.
}
`,
		},
		{
			code: `
const encoded = \`before \${"\\\\\`\${value}\\n\\r\\t\\v\\f\\b\\0\\x01\\u2028\\u2029\\uD800"} after\`;
const numbers = \`\${0b101}\${0o10}\${0xff}\${1_000}\${0.0000001}\${0x20000000000001}\`;
const bigints = \`\${0xffn}\${1_000n}\`;
const pattern = \`before \${/\\b\\/\\$\\{/mi} after\`;
`,
			output: `
const encoded = \`before \\\\\\\`\\\${value}\\n\\r\\t\\v\\f\\b\\x00\\u0001\\u2028\\u2029\\uD800 after\`;
const numbers = \`5825510001e-79007199254740992\`;
const bigints = \`2551000\`;
const pattern = \`before /\\\\b\\\\/\\\\$\\\\{/im after\`;
`,
			snapshot: `
const encoded = \`before \${"\\\\\`\${value}\\n\\r\\t\\v\\f\\b\\0\\x01\\u2028\\u2029\\uD800"} after\`;
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        This template expression can be written directly in the template.
const numbers = \`\${0b101}\${0o10}\${0xff}\${1_000}\${0.0000001}\${0x20000000000001}\`;
                 ~~~~~~~~
                 This template expression can be written directly in the template.
                         ~~~~~~~
                         This template expression can be written directly in the template.
                                ~~~~~~~
                                This template expression can be written directly in the template.
                                       ~~~~~~~~
                                       This template expression can be written directly in the template.
                                               ~~~~~~~~~~~~
                                               This template expression can be written directly in the template.
                                                           ~~~~~~~~~~~~~~~~~~~
                                                           This template expression can be written directly in the template.
const bigints = \`\${0xffn}\${1_000n}\`;
                 ~~~~~~~~
                 This template expression can be written directly in the template.
                         ~~~~~~~~~
                         This template expression can be written directly in the template.
const pattern = \`before \${/\\b\\/\\$\\{/mi} after\`;
                        ~~~~~~~~~~~~~~~
                        This template expression can be written directly in the template.
`,
		},
		{
			code: `
declare const dynamic: string;
const nested = \`before \${\`middle \${dynamic}\`} after\`;
const plain = \`before \${\`middle\`} after\`;
`,
			output: `
declare const dynamic: string;
const nested = \`before middle \${dynamic} after\`;
const plain = \`before middle after\`;
`,
			snapshot: `
declare const dynamic: string;
const nested = \`before \${\`middle \${dynamic}\`} after\`;
                       ~~~~~~~~~~~~~~~~~~~~~~
                       This template expression can be written directly in the template.
const plain = \`before \${\`middle\`} after\`;
                      ~~~~~~~~~~~
                      This template expression can be written directly in the template.
`,
		},
		{
			code: `
const before = \`$\${"{"}\`;
const after = \`\${"$"}{\`;
const adjacent = \`\${"$"}\${"{"}\`;
const empty = \`$\${""}{\`;
const escaped = \`\\$\${"{"}\`;
declare const dynamic: string;
const unsupported = \`\${"$"}\${dynamic}\`;
const emptyAdjacent = \`\${"$"}\${""}\${"{"}\`;
`,
			output: `
const before = \`\\\${\`;
const after = \`\\\${\`;
const adjacent = \`\\\${\`;
const empty = \`\\\${\`;
const escaped = \`\\\${\`;
declare const dynamic: string;
const unsupported = \`$\${dynamic}\`;
const emptyAdjacent = \`\\\${\`;
`,
			snapshot: `
const before = \`$\${"{"}\`;
                 ~~~~~~
                 This template expression can be written directly in the template.
const after = \`\${"$"}{\`;
               ~~~~~~
               This template expression can be written directly in the template.
const adjacent = \`\${"$"}\${"{"}\`;
                  ~~~~~~
                  This template expression can be written directly in the template.
                        ~~~~~~
                        This template expression can be written directly in the template.
const empty = \`$\${""}{\`;
                ~~~~~
                This template expression can be written directly in the template.
const escaped = \`\\$\${"{"}\`;
                   ~~~~~~
                   This template expression can be written directly in the template.
declare const dynamic: string;
const unsupported = \`\${"$"}\${dynamic}\`;
                     ~~~~~~
                     This template expression can be written directly in the template.
const emptyAdjacent = \`\${"$"}\${""}\${"{"}\`;
                       ~~~~~~
                       This template expression can be written directly in the template.
                             ~~~~~
                             This template expression can be written directly in the template.
                                  ~~~~~~
                                  This template expression can be written directly in the template.
`,
		},
		{
			code: `
type Values = \`\${1}\${2n}\${true}\${false}\${null}\${undefined}\${\`inner \${"value"}\`}\`;
type Union = \`\${"left" | "right"}\`;
type Intersection = \`\${string & { readonly brand: unique symbol }}\`;
type Conditional = \`\${string extends string ? "yes" : "no"}\`;
type Text = "text";
type Alias = \`\${Text}\`;
type ObjectType = { item: 1 };
type Keys = \`\${keyof ObjectType}\`[];
`,
			output: `
type Values = \`12truefalsenullundefinedinner \${"value"}\`;
type Union = ("left" | "right");
type Intersection = (string & { readonly brand: unique symbol });
type Conditional = (string extends string ? "yes" : "no");
type Text = "text";
type Alias = Text;
type ObjectType = { item: 1 };
type Keys = (keyof ObjectType)[];
`,
			snapshot: `
type Values = \`\${1}\${2n}\${true}\${false}\${null}\${undefined}\${\`inner \${"value"}\`}\`;
               ~~~~
               This template expression can be written directly in the template.
                   ~~~~~
                   This template expression can be written directly in the template.
                        ~~~~~~~
                        This template expression can be written directly in the template.
                               ~~~~~~~~
                               This template expression can be written directly in the template.
                                       ~~~~~~~
                                       This template expression can be written directly in the template.
                                              ~~~~~~~~~~~~
                                              This template expression can be written directly in the template.
                                                          ~~~~~~~~~~~~~~~~~~~~~
                                                          This template expression can be written directly in the template.
                                                                   ~~~~~~~~~~
                                                                   This template expression can be written directly in the template.
type Union = \`\${"left" | "right"}\`;
             ~~~~~~~~~~~~~~~~~~~~~
             This template expression wraps an already string-valued expression.
type Intersection = \`\${string & { readonly brand: unique symbol }}\`;
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    This template expression wraps an already string-valued expression.
type Conditional = \`\${string extends string ? "yes" : "no"}\`;
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   This template expression wraps an already string-valued expression.
type Text = "text";
type Alias = \`\${Text}\`;
             ~~~~~~~~~
             This template expression wraps an already string-valued expression.
type ObjectType = { item: 1 };
type Keys = \`\${keyof ObjectType}\`[];
            ~~~~~~~~~~~~~~~~~~~~~
            This template expression wraps an already string-valued expression.
`,
		},
	],
	valid: [
		"const message = `hello`;",
		"const message = tag`${1}`;",
		"declare const value: number; const message = `${value}`;",
		"const message = `${/* retained */ 1}`;",
		"const message = `${1 /* retained */}`;",
		"const message = `${-0}`;",
		"const message = `${({ value: 1 })}`;",
		"const undefined = 1; const message = `${undefined}`;",
		"export {}; const NaN = { toString: () => 'changed' }; const message = `${NaN}`;",
		"export {}; const Infinity = 1; const message = `${Infinity}`;",
		"declare const value: any; const message = `${value}`;",
		"declare const value: unknown; const message = `${value}`;",
		"declare const value: never; const message = `${value}`;",
		"declare const value: string | number; const message = `${value}`;",
		"declare const value: symbol; const message = `${value}`;",
		"declare function use<T>(value: T): `${T}`;",
		"function use<T>(value: T) { return `${value}`; }",
		"enum Kind { Item = 'item' } type Name = `${Kind}`;",
		"enum Kind { Item = 'item' } type Name = `${Kind.Item}`;",
		"enum Kind { Item = 'item' } type KindAlias = Kind; type Name = `${KindAlias}`;",
		"type Value<T> = `${T & string}`;",
		"type Value = `before ${'item' | 1} after`;",
		'const value = `${"    "}\nnext`;',
		'const value = `${"    "}\rnext`;',
		'const value = `${"    "}\r\nnext`;',
		'const value = `${"    "}\u2028next`;',
		'const value = `${"    "}\u2029next`;',
		"const value = `before ${Number.NaN} after`;",
		"const value = `before ${void 0} after`;",
		'const value = `before ${"text" as const} after`;',
		"declare const ambient: string; const kind = typeof `${ambient}`;",
		"declare const object: { value: string }; delete `${object.value}`;",
		"const value = `${/(/}`;",
		"const value = `${/value/gg}`;",
		"const value = `${`abc}`;",
		"type Value = `${`abc}`;",
	],
});
