import rule from "./caughtVariableNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
try {
    doSomething();
} catch (badName) {
    console.log(badName);
}
`,
			snapshot: `
try {
    doSomething();
} catch (badName) {
         ~~~~~~~
         Use \`error\` as the name for the catch clause parameter instead of \`badName\`.
    console.log(badName);
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (e) {
    console.log(e);
}
`,
			snapshot: `
try {
    doSomething();
} catch (e) {
         ~
         Use \`error\` as the name for the catch clause parameter instead of \`e\`.
    console.log(e);
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (err) {
    console.log(err);
}
`,
			snapshot: `
try {
    doSomething();
} catch (err) {
         ~~~
         Use \`error\` as the name for the catch clause parameter instead of \`err\`.
    console.log(err);
}
`,
		},
		{
			code: `
try {
    doSomething();
} catch (ex) {
    console.log(ex);
}
`,
			snapshot: `
try {
    doSomething();
} catch (ex) {
         ~~
         Use \`error\` as the name for the catch clause parameter instead of \`ex\`.
    console.log(ex);
}
`,
		},
	],
	valid: [
		`
try {
    doSomething();
} catch (error) {
    console.log(error);
}
`,
		`
try {
    doSomething();
} catch (fsError) {
    console.log(fsError);
}
`,
		`
try {
    doSomething();
} catch (authError) {
    console.log(authError);
}
`,
		`
try {
    doSomething();
} catch (networkError) {
    console.log(networkError);
}
`,
		`
try {
    doSomething();
} catch {
    console.log("error occurred");
}
`,
	],
});
