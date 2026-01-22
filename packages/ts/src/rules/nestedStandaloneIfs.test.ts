import rule from "./nestedStandaloneIfs.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
			output: `
if (condition) {
    doSomething();
} else if (otherCondition) {
        doSomethingElse();
    }
`,
			snapshot: `
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
    ~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
        doSomethingElse();
        ~~~~~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    } else {
        doDefault();
    }
}
`,
			output: `
if (condition) {
    doSomething();
} else if (otherCondition) {
        doSomethingElse();
    } else {
        doDefault();
    }
`,
			snapshot: `
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
    ~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
        doSomethingElse();
        ~~~~~~~~~~~~~~~~~~
    } else {
    ~~~~~~~~
        doDefault();
        ~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a) {
    if (b) {
        doSomething();
    }
}
`,
			output: `
if (a && b) {
        doSomething();
    }
`,
			snapshot: `
if (a) {
    if (b) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a)
    if (b)
        doSomething();
`,
			output: `
if (a && b) doSomething();
`,
			snapshot: `
if (a)
    if (b)
    ~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
`,
		},
		{
			code: `
if (a || b) {
    if (c) {
        doSomething();
    }
}
`,
			output: `
if ((a || b) && c) {
        doSomething();
    }
`,
			snapshot: `
if (a || b) {
    if (c) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a) {
    if (b || c) {
        doSomething();
    }
}
`,
			output: `
if (a && (b || c)) {
        doSomething();
    }
`,
			snapshot: `
if (a) {
    if (b || c) {
    ~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a ?? b) {
    if (c) {
        doSomething();
    }
}
`,
			output: `
if ((a ?? b) && c) {
        doSomething();
    }
`,
			snapshot: `
if (a ?? b) {
    if (c) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a) {
    if (condition ? b : c) {
        doSomething();
    }
}
`,
			output: `
if (a && (condition ? b : c)) {
        doSomething();
    }
`,
			snapshot: `
if (a) {
    if (condition ? b : c) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (a && b) {
    if (c && d) {
        doSomething();
    }
}
`,
			output: `
if (a && b && c && d) {
        doSomething();
    }
`,
			snapshot: `
if (a && b) {
    if (c && d) {
    ~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
if (value) {
    doSomething();
} else {
    if (otherValue) doSomethingElse();
}
`,
			output: `
if (value) {
    doSomething();
} else if (otherValue) doSomethingElse();
`,
			snapshot: `
if (value) {
    doSomething();
} else {
    if (otherValue) doSomethingElse();
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
}
`,
		},
		{
			code: `
if (a) {
    if (assigned = getValue()) {
        doSomething();
    }
}
`,
			output: `
if (a && (assigned = getValue())) {
        doSomething();
    }
`,
			snapshot: `
if (a) {
    if (assigned = getValue()) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
	],
	valid: [
		`if (condition) { doSomething(); }`,
		`if (condition) { doSomething(); } else { doSomethingElse(); }`,
		`if (condition) { doSomething(); } else if (otherCondition) { doSomethingElse(); }`,
		`
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
    doAnotherThing();
}
`,
		`
if (condition) {
    doSomething();
} else {
    doAnotherThing();
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
		`
if (a) {
    if (b) {
        doSomething();
    }
} else {
    doSomethingElse();
}
`,
		`
if (a) {
    if (b) {
        doSomething();
    } else {
        doSomethingElse();
    }
}
`,
		`
if (a) {
    doSomething();
    if (b) {
        doSomethingElse();
    }
}
`,
		`
if (a) {
    if (b) {
        doSomething();
    }
    doSomethingElse();
}
`,
		`
if (condition) {
    doSomething();
} else {
    // Comment explaining why
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
		`
if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
    // trailing comment
}
`,
		`
if (a) {
    // comment
    if (b) {
        doSomething();
    }
}
`,
		`
if (a) {
    if (b) {
        doSomething();
    }
    // trailing comment
}
`,
	],
});
