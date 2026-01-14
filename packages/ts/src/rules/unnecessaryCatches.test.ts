import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryCatches.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
try {
    doSomething();
} catch (error) {
    throw error;
}
`,
			output: `
try {
    doSomething();
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
  ~~~~~
  This catch clause is unnecessary, as it only rethrows the exception without modification.
    throw error;
}
`,
		},
		{
			code: `
async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
        throw error;
    }
}
`,
			output: `
async function fetchData() {
    try {
        return await fetch("/api/data");
    }
}
`,
			snapshot: `
async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
      ~~~~~
      This catch clause is unnecessary, as it only rethrows the exception without modification.
        throw error;
    }
}
`,
		},
		{
			code: `
try {
    processData();
} catch (exception) {
    throw exception;
}
`,
			output: `
try {
    processData();
}
`,
			snapshot: `
try {
    processData();
} catch (exception) {
  ~~~~~
  This catch clause is unnecessary, as it only rethrows the exception without modification.
    throw exception;
}
`,
		},
		{
			code: `
function handleRequest() {
    try {
        const result = performOperation();
        return result;
    } catch (err) {
        throw err;
    }
}
`,
			output: `
function handleRequest() {
    try {
        const result = performOperation();
        return result;
    }
}
`,
			snapshot: `
function handleRequest() {
    try {
        const result = performOperation();
        return result;
    } catch (err) {
      ~~~~~
      This catch clause is unnecessary, as it only rethrows the exception without modification.
        throw err;
    }
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (error) {
    throw error;
} finally {
    cleanup();
}
`,
			output: `
try {
    doSomething();
} finally {
    cleanup();
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
  ~~~~~
  This catch clause is unnecessary, as it only rethrows the exception without modification.
    throw error;
} finally {
    cleanup();
}
`,
		},
	],
	valid: [
		`try { doSomething(); } catch (error) { console.error(error); throw error; }`,
		`try { doSomething(); } catch (error) { throw new Error("Failed"); }`,
		`try { doSomething(); } catch (error) { logError(error); throw error; }`,
		`try { doSomething(); } catch { throw new Error("Something went wrong"); }`,
		`
try {
    doSomething();
} catch (error) {
    console.error("An error occurred:", error);
    throw error;
}
`,
		`
try {
    doSomething();
} catch (error) {
    throw new Error("Operation failed: " + error.message);
}
`,
		`
try {
    doSomething();
} catch (error) {
    cleanup();
    throw error;
}
`,
		`
try {
    doSomething();
} catch (error) {
    throw error.originalError;
}
`,
		`
async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
        await logError(error);
        throw error;
    }
}
`,
		`
try {
    doSomething();
} catch ({ message }) {
    throw message;
}
`,
		`
try {
    doSomething();
} catch (error) {
}
`,
		`
try {
    doSomething();
} catch (error) {
    console.log("error");
    cleanup();
    throw error;
}
`,
	],
});
