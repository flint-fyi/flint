import rule from "./finallyStatementSafety.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        return 1;
    }
}
test();
`,
			snapshot: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        return 1;
        ~~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
test();
`,
		},
		{
			code: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } catch (error) {
        void error;
    } finally {
        return;
    }
}
test();
`,
			snapshot: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } catch (error) {
        void error;
    } finally {
        return;
        ~~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
test();
`,
		},
		{
			code: `
declare function doSomething(): void;
try {
    doSomething();
} finally {
    throw new Error("Error");
}
`,
			snapshot: `
declare function doSomething(): void;
try {
    doSomething();
} finally {
    throw new Error("Error");
    ~~~~~
    Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
}
`,
		},
		{
			code: `
declare const condition: boolean;
declare function doSomething(): void;
while (condition) {
    try {
        doSomething();
    } finally {
        break;
    }
}
`,
			snapshot: `
declare const condition: boolean;
declare function doSomething(): void;
while (condition) {
    try {
        doSomething();
    } finally {
        break;
        ~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
`,
		},
		{
			code: `
declare function doSomething(): void;
for (let i = 0; i < 10; i++) {
    try {
        doSomething();
    } finally {
        continue;
    }
}
`,
			snapshot: `
declare function doSomething(): void;
for (let i = 0; i < 10; i++) {
    try {
        doSomething();
    } finally {
        continue;
        ~~~~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
`,
		},
		{
			code: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
        return "success";
    } finally {
        return "override";
    }
}
test();
`,
			snapshot: `
declare function doSomething(): void;
function test() {
    try {
        doSomething();
        return "success";
    } finally {
        return "override";
        ~~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
test();
`,
		},
		{
			code: `
declare const condition: boolean;
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        if (condition) {
            return;
        }
    }
}
test();
`,
			snapshot: `
declare const condition: boolean;
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        if (condition) {
            return;
            ~~~~~~
            Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
        }
    }
}
test();
`,
		},
		{
			code: `
declare const value: number;
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        switch (value) {
            case 1:
                return;
        }
    }
}
test();
`,
			snapshot: `
declare const value: number;
declare function doSomething(): void;
function test() {
    try {
        doSomething();
    } finally {
        switch (value) {
            case 1:
                return;
                ~~~~~~
                Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
        }
    }
}
test();
`,
		},
		{
			code: `
declare function doSomething(): void;
try {
    doSomething();
} finally {
    label: {
        break label;
    }
}
`,
			snapshot: `
declare function doSomething(): void;
try {
    doSomething();
} finally {
    label: {
        break label;
        ~~~~~
        Control flow statements in \`finally\` blocks misleadingly override control flow from \`try\`/\`catch\` blocks.
    }
}
`,
		},
	],
	valid: [
		`
declare function cleanup(): void;
declare function doSomething(): void;
try {
    doSomething();
} finally {
    cleanup();
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): void;
try {
    doSomething();
} catch (error) {
    void error;
} finally {
    cleanup();
}
`,
		`
declare function cleanup(): void;
function test() {
    try {
        return 1;
    } finally {
        cleanup();
    }
}
test();
`,
		`
declare function cleanup(): void;
try {
    throw new Error("Error");
} finally {
    cleanup();
}
`,
		`
declare const console: {
    log(value: string): void;
};
declare function doSomething(): void;
try {
    doSomething();
} finally {
    console.log("cleanup");
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): string;
function test() {
    try {
        return doSomething();
    } finally {
        cleanup();
    }
}
test();
`,
		`
declare const condition: boolean;
declare function cleanup(): void;
while (condition) {
    try {
        break;
    } finally {
        cleanup();
    }
}
`,
		`
declare function cleanup(): void;
for (let i = 0; i < 10; i++) {
    try {
        continue;
    } finally {
        cleanup();
    }
}
`,
		`
declare const condition: boolean;
declare function cleanup(): void;
declare function doSomething(): void;
try {
    doSomething();
} finally {
    if (condition) {
        cleanup();
    }
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): void;
try {
    doSomething();
} finally {
    for (let i = 0; i < 10; i++) {
        cleanup();
    }
}
`,
		`
declare const condition: boolean;
declare function cleanup(): void;
declare function doSomething(): void;
try {
    doSomething();
} finally {
    while (condition) {
        cleanup();
    }
}
`,
		`
declare function doSomething(): void;
try {
    doSomething();
} finally {
    for (let i = 0; i < 10; i++) {
        if (i === 5) break;
    }
}
`,
		`
declare const condition: boolean;
declare const shouldExit: boolean;
declare function doSomething(): void;
try {
    doSomething();
} finally {
    while (condition) {
        if (shouldExit) break;
    }
}
`,
		`
declare function doSomething(): void;
declare function process(value: number): void;
try {
    doSomething();
} finally {
    for (let i = 0; i < 10; i++) {
        if (i === 0) continue;
        process(i);
    }
}
`,
		`
declare function cleanup(): void;
declare function doSomething(): void;
declare function log(): void;
try {
    doSomething();
} finally {
    try {
        cleanup();
    } finally {
        log();
    }
}
`,
	],
});
