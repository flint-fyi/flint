import rule from "./exceptionAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
try {
    doSomething();
} catch (error) {
    error = new Error("Different error");
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error = new Error("Different error");
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (exception) {
    exception = null;
}
`,
			snapshot: `
try {
    doSomething();
} catch (exception) {
    exception = null;
    ~~~~~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    error++;
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error++;
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    ++error;
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    ++error;
      ~~~~~
      Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    error += "additional info";
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error += "additional info";
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    error ??= new Error("default error");
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error ??= new Error("default error");
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    error &&= false;
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error &&= false;
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    error ||= new Error("fallback");
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    error ||= new Error("fallback");
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    function inner() {
        error = "reassigned in nested function";
    }
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    function inner() {
        error = "reassigned in nested function";
        ~~~~~
        Exception parameters in catch clauses should not be reassigned.
    }
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch ({ message }) {
    message = "reassigned destructured parameter";
}
`,
			snapshot: `
try {
    doSomething();
} catch ({ message }) {
    message = "reassigned destructured parameter";
    ~~~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch ({ message, code }) {
    code = 500;
}
`,
			snapshot: `
try {
    doSomething();
} catch ({ message, code }) {
    code = 500;
    ~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch ([first, second]) {
    first = "reassigned array destructured parameter";
}
`,
			snapshot: `
try {
    doSomething();
} catch ([first, second]) {
    first = "reassigned array destructured parameter";
    ~~~~~
    Exception parameters in catch clauses should not be reassigned.
}
`,
		},
	],
	valid: [
		`try { doSomething(); } catch (error) { console.log(error); }`,
		`try { doSomething(); } catch (error) { throw error; }`,
		`try { doSomething(); } catch (error) { const message = error.message; }`,
		`try { doSomething(); } catch (error) { if (error instanceof TypeError) { handle(); } }`,
		`try { doSomething(); } catch { handleError(); }`,
		`const error = new Error("test");`,
		`
try {
    doSomething();
} catch (error) {
    const error = "shadowed variable";
    console.log(error);
}
`,
		`
try {
    doSomething();
} catch (error) {
    function inner() {
        const error = "shadowed in function";
        error = "reassigning shadowed variable is ok";
    }
}
`,
		`
let error = "outer";
try {
    doSomething();
} catch (error) {
    console.log(error);
}
error = "reassigning outer is ok";
`,
		`try { doSomething(); } catch ({ message }) { console.log(message); }`,
		`try { doSomething(); } catch ({ message, code }) { if (code === 404) { handle(); } }`,
		`try { doSomething(); } catch ([first]) { console.log(first); }`,
	],
});
