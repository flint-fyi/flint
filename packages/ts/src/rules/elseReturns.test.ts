import rule from "./elseReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function getValue() {
    if (true) {
        return 1;
    } else {
        return 2;
    }
}
`,
			snapshot: `
function getValue() {
    if (true) {
        return 1;
    } else {
      ~~~~
      This \`else\` clause is unnecessary after a \`return\` statement.
        return 2;
    }
}
`,
		},
		{
			code: `
function getValue() {
    if (true) return 1;
    else return 2;
}
`,
			snapshot: `
function getValue() {
    if (true) return 1;
    else return 2;
    ~~~~
    This \`else\` clause is unnecessary after a \`return\` statement.
}
`,
		},
		{
			code: `
function getValue(condition: boolean) {
    if (condition) {
        const value = compute();
        return value;
    } else {
        const other = fallback();
        return other;
    }
}
`,
			snapshot: `
function getValue(condition: boolean) {
    if (condition) {
        const value = compute();
        return value;
    } else {
      ~~~~
      This \`else\` clause is unnecessary after a \`return\` statement.
        const other = fallback();
        return other;
    }
}
`,
		},
		{
			code: `
function getValue(a: boolean, b: boolean) {
    if (a) {
        return 1;
    } else if (b) {
        return 2;
    } else {
        return 3;
    }
}
`,
			snapshot: `
function getValue(a: boolean, b: boolean) {
    if (a) {
        return 1;
    } else if (b) {
        return 2;
    } else {
      ~~~~
      This \`else\` clause is unnecessary after a \`return\` statement.
        return 3;
    }
}
`,
		},
		{
			code: `
function nested() {
    if (true) {
        if (false) {
            return 1;
        } else {
            return 2;
        }
    }
}
`,
			snapshot: `
function nested() {
    if (true) {
        if (false) {
            return 1;
        } else {
          ~~~~
          This \`else\` clause is unnecessary after a \`return\` statement.
            return 2;
        }
    }
}
`,
		},
		{
			code: `
function getValue() {
    if (true) {
        return 1;
    } else if (false) {
        return 2;
    }
}
`,
			options: { allowElseIf: false },
			snapshot: `
function getValue() {
    if (true) {
        return 1;
    } else if (false) {
      ~~~~
      This \`else\` clause is unnecessary after a \`return\` statement.
        return 2;
    }
}
`,
		},
		{
			code: `
function getValue(a: boolean, b: boolean) {
    if (a) {
        return 1;
    } else if (b) {
        process();
    } else {
        fallback();
    }
}
`,
			options: { allowElseIf: false },
			snapshot: `
function getValue(a: boolean, b: boolean) {
    if (a) {
        return 1;
    } else if (b) {
      ~~~~
      This \`else\` clause is unnecessary after a \`return\` statement.
        process();
    } else {
        fallback();
    }
}
`,
		},
		{
			code: `
function getValue() {
    if (true) {
        if (false) return 1;
        else return 2;
    }
}
`,
			snapshot: `
function getValue() {
    if (true) {
        if (false) return 1;
        else return 2;
        ~~~~
        This \`else\` clause is unnecessary after a \`return\` statement.
    }
}
`,
		},
		{
			code: `
function getValue() {
    if (condition) return 1;
    else return 2;
}
`,
			snapshot: `
function getValue() {
    if (condition) return 1;
    else return 2;
    ~~~~
    This \`else\` clause is unnecessary after a \`return\` statement.
}
`,
		},
	],
	valid: [
		`function getValue() { if (true) { return 1; } return 2; }`,
		`function getValue() { if (true) { process(); } else { return 1; } }`,
		`function getValue() { if (true) { for (;;) { return 1; } } else { return 2; } }`,
		`function getValue(a: boolean, b: boolean) { if (a) { return 1; } else if (b) { return 2; } }`,
		`function getValue() { if (true) process(); else return 1; }`,
		`function getValue(a: boolean, b: boolean) { if (a) { process(); } else if (b) { return 1; } else { fallback(); } }`,
		`function getValue(a: boolean, b: boolean) { if (a) { return 1; } else if (b) { process(); } else { fallback(); } }`,
		`if (0) { if (0) {} else {} } else {}`,
		`
function getValue() {
    if (condition)
        if (other) return 1;
        else process();
    else fallback();
}
`,
		`
function getValue() {
    while (condition)
        if (other) return 1;
        else process();
}
`,
		{
			code: `function getValue() { if (true) { return 1; } else if (false) { return 2; } }`,
			options: { allowElseIf: true },
		},
		{
			code: `function getValue(a: boolean, b: boolean) { if (a) { return 1; } else if (b) { process(); } else { fallback(); } }`,
			options: { allowElseIf: true },
		},
		{
			code: `function getValue(a: boolean, b: boolean) { if (a) { return 1; } else if (b) { return 2; } }`,
			options: { allowElseIf: true },
		},
	],
});
