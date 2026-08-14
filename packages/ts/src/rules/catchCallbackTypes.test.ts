import rule from "./catchCallbackTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
Promise.resolve().catch((error) => {
    void error;
});
`,
			snapshot: `
Promise.resolve().catch((error) => {
                         ~~~~~
                         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    void error;
});
`,
		},
		{
			code: `
Promise.resolve().catch((error: any) => {
    void error;
});
`,
			snapshot: `
Promise.resolve().catch((error: any) => {
                         ~~~~~~~~~~
                         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    void error;
});
`,
		},
		{
			code: `
Promise.resolve().then(
    () => {},
    (error) => {
        void error;
    }
);
`,
			snapshot: `
Promise.resolve().then(
    () => {},
    (error) => {
     ~~~~~
     The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
        void error;
    }
);
`,
		},
		{
			code: `
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err) => {
    void err;
});
`,
			snapshot: `
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err) => {
               ~~~
               The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    void err;
});
`,
		},
		{
			code: `
fetch("/api").catch(function(error) {
    void error;
});
`,
			files: {
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"lib": ["esnext", "DOM"]
	}
}`,
			},
			snapshot: `
fetch("/api").catch(function(error) {
                             ~~~~~
                             The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
    void error;
});
`,
		},
		{
			code: `
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error) => {
        void error;
    });
}
handlePromise(Promise.resolve());
`,
			snapshot: `
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error) => {
             ~~~~~
             The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
        void error;
    });
}
handlePromise(Promise.resolve());
`,
		},
		{
			code: `
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error) => {
            void error;
        }
    );
}
handlePromise(Promise.resolve("value"));
`,
			snapshot: `
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error) => {
         ~~~~~
         The catch callback parameter should be typed as the safer \`unknown\` instead of \`any\`.
            void error;
        }
    );
}
handlePromise(Promise.resolve("value"));
`,
		},
	],
	valid: [
		`
Promise.resolve().catch((error: unknown) => {
    void error;
});
`,
		`
Promise.resolve().then(
    () => {},
    (error: unknown) => {
        void error;
    }
);
`,
		`
Promise.resolve().catch(() => {
    const message = "error occurred";
    void message;
});
`,
		`
Promise.resolve().then(() => {});
`,
		`
const arr = [1, 2, 3] as number[] & {
    catch?: (callback: (error: unknown) => void) => void;
};
arr.catch?.((error: unknown) => {
    void error;
});
`,
		`
const promise: Promise<string> = Promise.resolve("test");
promise.catch((err: unknown) => {
    if (err instanceof Error) {
        void err.message;
    }
});
`,
		`
function handlePromise<T extends Promise<unknown>>(p: T) {
    p.catch((error: unknown) => {
        void error;
    });
}
handlePromise(Promise.resolve());
`,
		`
function handlePromise<T extends Promise<string>>(p: T) {
    p.then(
        () => {},
        (error: unknown) => {
            void error;
        }
    );
}
handlePromise(Promise.resolve("value"));
`,
	],
});
