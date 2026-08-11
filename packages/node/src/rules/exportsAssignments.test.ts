import rule from "./exportsAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
exports = {};
`,
			snapshot: `
exports = {};
~~~~~~~
Assigning to \`exports\` rather than \`module.exports\` may break references to \`module.exports\`.
`,
		},
		{
			code: `
exports = { value: 1 };
`,
			snapshot: `
exports = { value: 1 };
~~~~~~~
Assigning to \`exports\` rather than \`module.exports\` may break references to \`module.exports\`.
`,
		},
		{
			code: `
declare const somethingElse: unknown;
exports = somethingElse;
`,
			snapshot: `
declare const somethingElse: unknown;
exports = somethingElse;
~~~~~~~
Assigning to \`exports\` rather than \`module.exports\` may break references to \`module.exports\`.
`,
		},
	],
	valid: [
		`module.exports.value = 1;`,
		`exports.bar = 2;`,
		`module.exports = {};`,
		`module.exports = exports = {};`,
		`exports = module.exports = {};`,
		`function f(exports: unknown) { exports = {}; }`,
		`let exports; exports = {}; export {};`,
	],
});
