import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryCatches.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    throw error;
}
`,
			output: `
declare function doSomething(): void;

try {
    doSomething();
}
`,
			snapshot: `
declare function doSomething(): void;

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
declare function fetch(input: string): Promise<unknown>;

async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
        throw error;
    }
}
fetchData();
`,
			output: `
declare function fetch(input: string): Promise<unknown>;

async function fetchData() {
    try {
        return await fetch("/api/data");
    }
}
fetchData();
`,
			snapshot: `
declare function fetch(input: string): Promise<unknown>;

async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
      ~~~~~
      This catch clause is unnecessary, as it only rethrows the exception without modification.
        throw error;
    }
}
fetchData();
`,
		},
		{
			code: `
declare function processData(): void;

try {
    processData();
} catch (exception) {
    throw exception;
}
`,
			output: `
declare function processData(): void;

try {
    processData();
}
`,
			snapshot: `
declare function processData(): void;

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
declare function performOperation(): string;

function handleRequest() {
    try {
        const result = performOperation();
        return result;
    } catch (err) {
        throw err;
    }
}
handleRequest();
`,
			output: `
declare function performOperation(): string;

function handleRequest() {
    try {
        const result = performOperation();
        return result;
    }
}
handleRequest();
`,
			snapshot: `
declare function performOperation(): string;

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
handleRequest();
`,
		},
		{
			code: `
declare function cleanup(): void;
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    throw error;
} finally {
    cleanup();
}
`,
			output: `
declare function cleanup(): void;
declare function doSomething(): void;

try {
    doSomething();
} finally {
    cleanup();
}
`,
			snapshot: `
declare function cleanup(): void;
declare function doSomething(): void;

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
		`declare function doSomething(): void; try { doSomething(); } catch (error) { void error; throw error; }`,
		`declare function doSomething(): void; try { doSomething(); } catch (error) { throw new Error("Failed"); }`,
		`
declare function doSomething(): void;
declare function logError(error: unknown): void;

try {
    doSomething();
} catch (error) {
    logError(error);
    throw error;
}
`,
		`declare function doSomething(): void; try { doSomething(); } catch { throw new Error("Something went wrong"); }`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    const message = "An error occurred:";
    void message;
    void error;
    throw error;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    if (error instanceof Error) {
        throw new Error("Operation failed: " + error.message);
    }

    throw error;
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    cleanup();
    throw error;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    if (typeof error === "object" && error !== null && "originalError" in error) {
        throw error.originalError;
    }

    throw error;
}
`,
		`
declare function fetch(input: string): Promise<unknown>;
declare function logError(error: unknown): Promise<void>;

async function fetchData() {
    try {
        return await fetch("/api/data");
    } catch (error) {
        await logError(error);
        throw error;
    }
}
fetchData();
`,
		`
declare function doSomething(): void;

try {
    doSomething();

} catch (error) {
    if (error instanceof Error) {
        const { message } = error;
        throw message;
    }

    throw error;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    const message = "error";
    void message;
    void error;
    cleanup();
    throw error;
}
`,
	],
});
