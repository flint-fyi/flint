import rule from "./caughtErrorCauses.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
try {
    doSomething();
} catch (error) {
    throw new Error("Something went wrong");
}
`,
			snapshot: `
try {
    doSomething();
} catch (error) {
    throw new Error("Something went wrong");
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Preserve the original error by passing it as the \`cause\` option when throwing a new error.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (err) {
    throw new TypeError("Invalid type");
}
`,
			snapshot: `
try {
    doSomething();
} catch (err) {
    throw new TypeError("Invalid type");
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Preserve the original error by passing it as the \`cause\` option when throwing a new error.
}
`,
		},
		{
			code: `
try {
    parse(data);
} catch (error) {
    throw new SyntaxError("Failed to parse");
}
`,
			snapshot: `
try {
    parse(data);
} catch (error) {
    throw new SyntaxError("Failed to parse");
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Preserve the original error by passing it as the \`cause\` option when throwing a new error.
}
`,
		},
		{
			code: `
try {
    getValue();
} catch (error) {
    throw new RangeError("Value out of range", {});
}
`,
			snapshot: `
try {
    getValue();
} catch (error) {
    throw new RangeError("Value out of range", {});
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Preserve the original error by passing it as the \`cause\` option when throwing a new error.
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (errors) {
    throw new AggregateError([errors], "All attempts failed");
}
`,
			snapshot: `
try {
    doSomething();
} catch (errors) {
    throw new AggregateError([errors], "All attempts failed");
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          Preserve the original error by passing it as the \`cause\` option when throwing a new error.
}
`,
		},
	],
	valid: [
		`
try {
    doSomething();
} catch (error) {
    throw new Error("Something went wrong", { cause: error });
}
`,
		`
try {
    doSomething();
} catch (err) {
    throw new TypeError("Invalid type", { cause: err });
}
`,
		`
try {
    doSomething();
} catch (error) {
    throw error;
}
`,
		`
try {
    doSomething();
} catch {
    throw new Error("Something went wrong");
}
`,
		`
try {
    doSomething();
} catch (error) {
    console.error(error);
}
`,
		`
throw new Error("Not in a catch block");
`,
		`
try {
    doSomething();
} catch (error) {
    throw new Error("Message", { cause: wrapError(error) });
}
`,
		`
try {
    doSomething();
} catch (errors) {
    throw new AggregateError([errors], "All attempts failed", { cause: errors });
}
`,
		`
try {
    doSomething();
} catch (cause) {
    throw new Error("Something went wrong", { cause });
}
`,
		`
try {
    doSomething();
} catch (error) {
    throw new Error("Something went wrong", { "cause": error });
}
`,
		`
try {
    doSomething();
} catch (error) {
    const options = { cause: error };
    throw new Error("Something went wrong", options);
}
`,
		`
try {
    doSomething();
} catch (error) {
    throw new Error("Something went wrong", { ...getOptions(error) });
}
`,
	],
});
