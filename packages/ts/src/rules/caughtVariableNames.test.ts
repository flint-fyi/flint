import rule from "./caughtVariableNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} catch (badName) {
    void badName;
}
`,
			snapshot: `
declare function doSomething(): void;

try {
    doSomething();
} catch (badName) {
         ~~~~~~~
         Use \`error\` as the name for the catch clause parameter instead of \`badName\`.
    void badName;
}
`,
		},
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} catch (e) {
    void e;
}
`,
			snapshot: `
declare function doSomething(): void;

try {
    doSomething();
} catch (e) {
         ~
         Use \`error\` as the name for the catch clause parameter instead of \`e\`.
    void e;
}
`,
		},
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} catch (err) {
    void err;
}
`,
			snapshot: `
declare function doSomething(): void;

try {
    doSomething();
} catch (err) {
         ~~~
         Use \`error\` as the name for the catch clause parameter instead of \`err\`.
    void err;
}
`,
		},
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} catch (ex) {
    void ex;
}
`,
			snapshot: `
declare function doSomething(): void;

try {
    doSomething();
} catch (ex) {
         ~~
         Use \`error\` as the name for the catch clause parameter instead of \`ex\`.
    void ex;
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
    void error;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (fsError) {
    void fsError;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (authError) {
    void authError;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (networkError) {
    void networkError;
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch {
    const message = "error occurred";
    void message;
}
`,
	],
});
