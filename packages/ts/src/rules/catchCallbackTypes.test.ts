import rule from "./catchCallbackTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Promise.resolve().catch((error) => {
    console.log(error);
});
`,
			snapshot: `
Promise.resolve().catch((error) => {
                         ~~~~~
                         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    console.log(error);
});
`,
		},
		{
			code: `
Promise.resolve().catch((error: any) => {
    console.log(error);
});
`,
			snapshot: `
Promise.resolve().catch((error: any) => {
                         ~~~~~~~~~~
                         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    console.log(error);
});
`,
		},
		{
			code: `
Promise.resolve().then(
    () => {},
    (error) => {
        console.log(error);
    }
);
`,
			snapshot: `
Promise.resolve().then(
    () => {},
    (error) => {
     ~~~~~
     The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
        console.log(error);
    }
);
`,
		},
		{
			code: `
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err) => {
    console.log(err);
});
`,
			snapshot: `
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err) => {
               ~~~
               The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    console.log(err);
});
`,
		},
		{
			code: `
fetch("/api").catch(function(error) {
    console.log(error);
});
`,
			snapshot: `
fetch("/api").catch(function(error) {
                             ~~~~~
                             The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    console.log(error);
});
`,
		},
		{
			code: `
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error) => {
        console.log(error);
    });
}
`,
			snapshot: `
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error) => {
             ~~~~~
             The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
        console.log(error);
    });
}
`,
		},
		{
			code: `
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error) => {
            console.log(error);
        }
    );
}
`,
			snapshot: `
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error) => {
         ~~~~~
         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
            console.log(error);
        }
    );
}
`,
		},
	],
	valid: [
		`
Promise.resolve().catch((error: unknown) => {
    console.log(error);
});
`,
		`
Promise.resolve().then(
    () => {},
    (error: unknown) => {
        console.log(error);
    }
);
`,
		`
Promise.resolve().catch(() => {
    console.log("error occurred");
});
`,
		`
Promise.resolve().then(() => {});
`,
		`
const arr = [1, 2, 3];
arr.catch?.((error: unknown) => {});
`,
		`
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err: unknown) => {
    if (err instanceof Error) {
        console.log(err.message);
    }
});
`,
		`
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error: unknown) => {
        console.log(error);
    });
}
`,
		`
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error: unknown) => {
            console.log(error);
        }
    );
}
`,
	],
});
