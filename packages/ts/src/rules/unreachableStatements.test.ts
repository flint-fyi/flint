import { ruleTester } from "./ruleTester.ts";
import rule from "./unreachableStatements.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function calculate() {
    return 1;
    calculateAgain();
    calculateThird();
}
`,
			snapshot: `
function calculate() {
    return 1;
    calculateAgain();
    ~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
    calculateThird();
}
`,
		},
		{
			code: `
function choose(value: boolean) {
    if (value) {
        return 1;
    } else {
        throw new Error();
    }
    chooseAgain();
}
`,
			snapshot: `
function choose(value: boolean) {
    if (value) {
        return 1;
    } else {
        throw new Error();
    }
    chooseAgain();
    ~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
while ((true as boolean)!) {
    continue;
    continueWork();
}
finishWork();
`,
			snapshot: `
while ((true as boolean)!) {
    continue;
    continueWork();
    ~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
finishWork();
~~~~~~~~~~~~~
No control flow path can reach this statement.
`,
		},
		{
			code: `
function declarations() {
    throw new Error();
    ;
    function nested() {}
    interface Shape {}
    type Name = string;
    namespace Values {}
    declare class Ambient {}
    var pending;
    var initialized = 1;
}
`,
			snapshot: `
function declarations() {
    throw new Error();
    ;
    function nested() {}
    interface Shape {}
    type Name = string;
    namespace Values {}
    declare class Ambient {}
    var pending;
    var initialized = 1;
    ~~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
function imports() {
    return;
    import type Types = require("types");
    import type { Shape } from "shapes";
    export type { Shape };
    let value;
}
`,
			snapshot: `
function imports() {
    return;
    import type Types = require("types");
    import type { Shape } from "shapes";
    export type { Shape };
    let value;
    ~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
for (;;) {
    try {
        break;
    } finally {
        continue;
    }
}
afterLoop();
`,
			snapshot: `
for (;;) {
    try {
        break;
    } finally {
        continue;
    }
}
afterLoop();
~~~~~~~~~~~~
No control flow path can reach this statement.
`,
		},
		{
			code: `
switch (value) {
    case 1:
        returnValue();
        break;
        unreachableCase();
    default:
        throw new Error();
}
`,
			snapshot: `
switch (value) {
    case 1:
        returnValue();
        break;
        unreachableCase();
        ~~~~~~~~~~~~~~~~~~
        No control flow path can reach this statement.
    default:
        throw new Error();
}
`,
		},
		{
			code: `
function load() {
    return;
    import "setup";
}
`,
			snapshot: `
function load() {
    return;
    import "setup";
    ~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
label: {
    break label;
    unreachableInside();
}
reachableAfter();
`,
			snapshot: `
label: {
    break label;
    unreachableInside();
    ~~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
reachableAfter();
`,
		},
		{
			code: `
function choose(value: number) {
    switch (value) {
        case 1:
            prepare();
        default:
            return;
        case 2:
            throw new Error();
    }
    unreachableAfter();
}
`,
			snapshot: `
function choose(value: number) {
    switch (value) {
        case 1:
            prepare();
        default:
            return;
        case 2:
            throw new Error();
    }
    unreachableAfter();
    ~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
function finish() {
    try {
        return;
    } finally {
        cleanup();
    }
    unreachableAfter();
}
`,
			snapshot: `
function finish() {
    try {
        return;
    } finally {
        cleanup();
    }
    unreachableAfter();
    ~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
function inspect(scope: object) {
    with (scope) {
        return;
        unreachableInside();
    }
    unreachableAfter();
}
`,
			snapshot: `
function inspect(scope: object) {
    with (scope) {
        return;
        unreachableInside();
        ~~~~~~~~~~~~~~~~~~~~
        No control flow path can reach this statement.
    }
    unreachableAfter();
    ~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
throw new Error();
import {} from "setup";
`,
			snapshot: `
throw new Error();
import {} from "setup";
~~~~~~~~~~~~~~~~~~~~~~~
No control flow path can reach this statement.
`,
		},
		{
			code: `
throw new Error();
export {} from "setup";
`,
			snapshot: `
throw new Error();
export {} from "setup";
~~~~~~~~~~~~~~~~~~~~~~~
No control flow path can reach this statement.
`,
		},
		{
			code: `
function outer() {
    return;
    function callback() {
        return;
        unreachableArrow();
    }
}
class Example {
    method() {
        throw new Error();
        unreachableMethod();
    }
    static {
        returnValue();
        throw new Error();
        unreachableStaticBlock();
    }
}
namespace Values {
    throw new Error();
    unreachableModuleBlock();
}
`,
			snapshot: `
function outer() {
    return;
    function callback() {
        return;
        unreachableArrow();
        ~~~~~~~~~~~~~~~~~~~
        No control flow path can reach this statement.
    }
}
class Example {
    method() {
        throw new Error();
        unreachableMethod();
        ~~~~~~~~~~~~~~~~~~~~
        No control flow path can reach this statement.
    }
    static {
        returnValue();
        throw new Error();
        unreachableStaticBlock();
        ~~~~~~~~~~~~~~~~~~~~~~~~~
        No control flow path can reach this statement.
    }
}
namespace Values {
    throw new Error();
    unreachableModuleBlock();
    ~~~~~~~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
}
`,
		},
		{
			code: `
const callback = () => {
    return;
    unreachableArrow();
};
`,
			snapshot: `
const callback = () => {
    return;
    unreachableArrow();
    ~~~~~~~~~~~~~~~~~~~
    No control flow path can reach this statement.
};
`,
		},
	],
	valid: [
		"return; import type Default from 'types'; import { type Shape, type Name } from 'types'; export { type Shape, type Name };",
		"return; var first, second; declare function ambient(): void; export as namespace Library;",
		"function choose(value: boolean) { if (value) return; continueWork(); }",
		"while (condition) { continue; } finishWork();",
		"for (;;) { if (condition) break; } finishWork();",
		"for (const key in object) { if (key) break; } finishWork();",
		"for (const value of values) { continue; } finishWork();",
		"do { if (condition) break; } while (true); finishWork();",
		"do { continue; } while (condition); finishWork();",
		"outer: for (;;) { for (;;) { break outer; } } finishWork();",
		"label: { break label; } finishWork();",
		"outer: while (condition) { continue outer; } finishWork();",
		"outer: for (const value of values) { continue outer; } finishWork();",
		"outer: inner: do { continue outer; } while (condition); finishWork();",
		"switch (value) { case 1: returnValue(); } finishWork();",
		"switch (value) { case 1: continue; default: break; } finishWork();",
		"try { throw new Error(); } catch { recover(); } finishWork();",
		"function finish() { try { return; } catch { recover(); } finishWork(); }",
		"try { returnValue(); } finally { cleanup(); }",
		"try { returnValue(); } catch { throw new Error(); } finally { cleanup(); }",
		"switch (value) { case 1: break; case 2: returnValue(); default: finishValue(); } finishWork();",
		"switch (value) {} finishWork();",
		"break;",
		"continue;",
		"const expression = () => value;",
		"function declared() {} const expression = function () { return; };",
		"class Values { constructor() { return; } method() { return; } get value() { return 1; } set value(next) { return; } static { returnValue(); } }",
		"namespace Values { returnValue(); }",
		"outer: for (;;) { try { continue; } finally { break outer; } } finishWork();",
		"for (;;) { try { break; } finally { if (condition) continue; } } finishWork();",
		{ code: "return; execute();", fileName: "types.d.ts" },
	],
});
