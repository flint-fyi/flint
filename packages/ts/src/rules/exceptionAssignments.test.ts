import rule from "./exceptionAssignments.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    error = new Error("Different error");
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (exception) {
    exception = null;
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    if (typeof error === "number") {
        error++;
    }
}
`,
			snapshot: `
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    if (typeof error === "number") {
        error++;
        ~~~~~
        Exception parameters in catch clauses should not be reassigned.
    }
}
`,
		},
		{
			code: `
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    if (typeof error === "number") {
        ++error;
    }
}
`,
			snapshot: `
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    if (typeof error === "number") {
        ++error;
          ~~~~~
          Exception parameters in catch clauses should not be reassigned.
    }
}
`,
		},
		{
			code: `
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    error += "additional info";
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    error ??= new Error("default error");
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    error &&= false;
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    error ||= new Error("fallback");
}
`,
			snapshot: `
declare function doSomething(): void;
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
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    function inner() {
        error = "reassigned in nested function";
    }
}
`,
			snapshot: `
declare function doSomething(): void;
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
	],
	valid: [
		`
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    console.log(error);
}
`,
		`
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    throw error;
}
`,
		`
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    if (error instanceof Error) {
        const message = error.message;
        console.log(message);
    }
}
`,
		`
declare function doSomething(): void;
declare function handle(): void;
try {
    doSomething();
} catch (error) {
    if (error instanceof TypeError) {
        handle();
    }
}
`,
		`
declare function doSomething(): void;
declare function handleError(): void;
try {
    doSomething();
} catch {
    handleError();
}
`,
		`const error = new Error("test");`,
		`
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    {
        const error = "shadowed variable";
        console.log(error);
    }
}
`,
		`
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    function inner() {
        let error = "shadowed in function";
        error = "reassigning shadowed variable is ok";
    }
}
`,
		`
declare function doSomething(): void;
let error = "outer";
try {
    doSomething();
} catch (error) {
    console.log(error);
}
error = "reassigning outer is ok";
`,
	],
});
