import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryReturns.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function complete() { return; }
`,
			output: `
function complete() {  }
`,
			snapshot: `
function complete() { return; }
                      ~~~~~~~
                      This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
const complete = () => { if (condition) { return; } };
`,
			output: `
const complete = () => { if (condition) {  } };
`,
			snapshot: `
const complete = () => { if (condition) { return; } };
                                          ~~~~~~~
                                          This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function consecutive() { return; return; }
`,
			output: `
function consecutive() {  return; }
`,
			snapshot: `
function consecutive() { return; return; }
                         ~~~~~~~
                         This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function nested() { label: { { return; } } }
`,
			output: `
function nested() { label: { {  } } }
`,
			snapshot: `
function nested() { label: { { return; } } }
                               ~~~~~~~
                               This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function conditional(value: boolean) { if (value) return; }
`,
			snapshot: `
function conditional(value: boolean) { if (value) return; }
                                                  ~~~~~~~
                                                  This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function alternative(value: boolean) { if (value) work(); else return; }
`,
			snapshot: `
function alternative(value: boolean) { if (value) work(); else return; }
                                                               ~~~~~~~
                                                               This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function switched(value: number) { switch (value) { case 1: if (condition) { return; } break; default: work(); } }
`,
			output: `
function switched(value: number) { switch (value) { case 1: if (condition) {  } break; default: work(); } }
`,
			snapshot: `
function switched(value: number) { switch (value) { case 1: if (condition) { return; } break; default: work(); } }
                                                                             ~~~~~~~
                                                                             This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function finalClause(value: number) { switch (value) { default: work(); return; } }
`,
			output: `
function finalClause(value: number) { switch (value) { default: work();  } }
`,
			snapshot: `
function finalClause(value: number) { switch (value) { default: work(); return; } }
                                                                        ~~~~~~~
                                                                        This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function transparent(value: number) { switch (value) { case 1: return; function declared() {} type Result = number; break; } }
`,
			output: `
function transparent(value: number) { switch (value) { case 1:  function declared() {} type Result = number; break; } }
`,
			snapshot: `
function transparent(value: number) { switch (value) { case 1: return; function declared() {} type Result = number; break; } }
                                                               ~~~~~~~
                                                               This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function finalized() { try { return; } finally { cleanup(); } }
`,
			output: `
function finalized() { try {  } finally { cleanup(); } }
`,
			snapshot: `
function finalized() { try { return; } finally { cleanup(); } }
                             ~~~~~~~
                             This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function overridden() { try { return; } finally { throw new Error(); } }
`,
			output: `
function overridden() { try {  } finally { throw new Error(); } }
`,
			snapshot: `
function overridden() { try { return; } finally { throw new Error(); } }
                              ~~~~~~~
                              This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function caught() { try { work(); } catch { return; } }
`,
			output: `
function caught() { try { work(); } catch {  } }
`,
			snapshot: `
function caught() { try { work(); } catch { return; } }
                                            ~~~~~~~
                                            This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
async function asynchronous(): Promise<void> { return; }
`,
			output: `
async function asynchronous(): Promise<void> {  }
`,
			snapshot: `
async function asynchronous(): Promise<void> { return; }
                                               ~~~~~~~
                                               This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function* generated(): Generator<number, void> { return; }
`,
			output: `
function* generated(): Generator<number, void> {  }
`,
			snapshot: `
function* generated(): Generator<number, void> { return; }
                                                 ~~~~~~~
                                                 This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
class Container { constructor() { return; } method(): void { return; } get value(): undefined { return; } set value(input: undefined) { return; } }
`,
			output: `
class Container { constructor() {  } method(): void {  } get value(): undefined {  } set value(input: undefined) {  } }
`,
			snapshot: `
class Container { constructor() { return; } method(): void { return; } get value(): undefined { return; } set value(input: undefined) { return; } }
                                  ~~~~~~~
                                  This bare return has the same effect as continuing control flow.
                                                             ~~~~~~~
                                                             This bare return has the same effect as continuing control flow.
                                                                                                ~~~~~~~
                                                                                                This bare return has the same effect as continuing control flow.
                                                                                                                                        ~~~~~~~
                                                                                                                                        This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function commented() { return/**/; }
`,
			snapshot: `
function commented() { return/**/; }
                       ~~~~~~~~~~~
                       This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function lineCommented() { return// retained
; }
`,
			snapshot: `
function lineCommented() { return// retained
                           ~~~~~~~~~~~~~~~~~
                           This bare return has the same effect as continuing control flow.
; }
~
`,
		},
		{
			code: `
function nestedLoop() { while (condition) { const callback = () => { return; }; } }
`,
			output: `
function nestedLoop() { while (condition) { const callback = () => {  }; } }
`,
			snapshot: `
function nestedLoop() { while (condition) { const callback = () => { return; }; } }
                                                                     ~~~~~~~
                                                                     This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function nestedFinalizer() { try {} finally { const callback = () => { return; }; } }
`,
			output: `
function nestedFinalizer() { try {} finally { const callback = () => {  }; } }
`,
			snapshot: `
function nestedFinalizer() { try {} finally { const callback = () => { return; }; } }
                                                                       ~~~~~~~
                                                                       This bare return has the same effect as continuing control flow.
`,
		},
		{
			code: `
function asi() { return
; }
`,
			output: `
function asi() {  }
`,
			snapshot: `
function asi() { return
                 ~~~~~~
                 This bare return has the same effect as continuing control flow.
; }
~
`,
		},
	],
	valid: [
		"function valued() { return 1; }",
		"function undefinedValue() { return undefined; }",
		"function work() { if (condition) return; execute(); }",
		"function valueAfter() { if (condition) return; return 1; }",
		"function throwAfter() { if (condition) return; throw new Error(); }",
		"function branches(condition: boolean) { if (condition) { return; } else { return; } work(); }",
		"function forLoop() { for (;;) { return; } }",
		"function forInLoop(values: object) { for (const key in values) { return; } }",
		"function forOfLoop(values: number[]) { for (const value of values) { return; } }",
		"function whileLoop() { while (condition) { return; } }",
		"function doLoop() { do { return; } while (condition); }",
		"function nestedCallback(values: number[]) { for (const value of values) { const callback = () => 1; } }",
		"function unreachable() { throw new Error(); return; }",
		"function unreachableValue() { return 1; return; }",
		"function unreachableBranches(condition: boolean) { if (condition) return 1; else throw new Error(); return; }",
		"function unreachableSwitch(value: number) { switch (value) { case 1: return 1; default: throw new Error(); } return; }",
		"function unreachableLoop() { while (true) {} return; }",
		"function reachableAfterLoop() { while (true) { break; } if (condition) return; work(); }",
		"function switchWork(value: number) { switch (value) { case 1: return; default: execute(); } }",
		"function switchSameClause(value: number) { switch (value) { case 1: return; execute(); } }",
		"function switchValue(value: number) { switch (value) { case 1: return; default: return 1; } }",
		"function switchThrow(value: number) { switch (value) { case 1: return; default: throw new Error(); } }",
		"function oxlintRegression() { switch (direction) { case BACKWARD: if (step === FIRST) { hide(); return; } setStep(1); break; } }",
		"function laterWork() { try { return; } finally { cleanup(); } work(); }",
		"function catchLaterWork() { try { work(); } catch { return; } work(); }",
		"function finalizerReturn() { try {} finally { return; } }",
		"function finalizerThrow() { try {} finally { throw new Error(); return; } }",
		"function conditionalFinalizer(condition: boolean) { try { return; } finally { if (condition) throw new Error(); } work(); }",
		"function labeledWork(condition: boolean) { label: { if (condition) return; break label; } work(); }",
		"function variableAfter() { if (condition) return; const value = 1; }",
		"function classAfter() { if (condition) return; class Value {} }",
		"function tryAfter() { if (condition) return; try {} finally {} }",
		"function blockAfter() { if (condition) return; { work(); } }",
		"function labelAfter() { if (condition) return; label: work(); }",
		"function withAfter(scope: object) { with (scope) { if (condition) return; } work(); }",
		"function finiteFor() { for (; condition; ) {} if (condition) return; work(); }",
		"function infiniteFor() { for (;;) {} return; }",
		"function infiniteForBreak() { for (;;) { break; } if (condition) return; work(); }",
		"function trueDo() { do {} while (true); return; }",
		"function trueWhileBreak() { while (true) { break; } if (condition) return; work(); }",
		"function labeledBreak() { outer: { break outer; } if (condition) return; work(); }",
		"function labeledDoBreak() { outer: { do { break outer; } while (condition); } if (condition) return; work(); }",
		"function labeledForInBreak(values: object) { outer: { for (const key in values) { break outer; } } if (condition) return; work(); }",
		"function labeledForOfBreak(values: number[]) { outer: { for (const value of values) { break outer; } } if (condition) return; work(); }",
		"function labeledForBreak() { outer: { for (;;) { break outer; } } if (condition) return; work(); }",
		"function labeledWhileBreak() { outer: { while (condition) { break outer; } } if (condition) return; work(); }",
		"function labeledIfBreak() { outer: { if (condition) break outer; else work(); } if (condition) return; work(); }",
		"function labeledSwitchBreak(value: number) { outer: { switch (value) { case 1: break outer; } } if (condition) return; work(); }",
		"function labeledTryBreak() { outer: { try { break outer; } catch { work(); } finally { cleanup(); } } if (condition) return; work(); }",
		"function nonMatchingLabel() { first: { second: { break first; } } if (condition) return; work(); }",
		"function switchWithoutDefault(value: number) { switch (value) { case 1: return 1; } if (condition) return; work(); }",
		"function switchWithBreak(value: number) { switch (value) { case 1: break; default: return 1; } if (condition) return; work(); }",
		"function switchFallsThrough(value: number) { switch (value) { case 1: work(); default: cleanup(); } if (condition) return; work(); }",
		"function tryReturns() { try { return 1; } return; }",
		"function catchCompletes() { try { return 1; } catch { work(); } if (condition) return; work(); }",
		"function finallyOverrides() { try { work(); } finally { return 1; } return; }",
		"function labeledAbruptIf(condition: boolean) { outer: if (condition) break outer; else return 1; if (condition) return; work(); }",
		"function labeledAbruptDo() { outer: { do { break outer; } while (true); } if (condition) return; work(); }",
		"function labeledAbruptForIn(values: object) { outer: { for (const key in values) { break outer; } return 1; } if (condition) return; work(); }",
		"function labeledAbruptForOf(values: number[]) { outer: { for (const value of values) { break outer; } return 1; } if (condition) return; work(); }",
		"function labeledAbruptSwitch(value: number) { outer: switch (value) { case 1: break outer; default: return 1; } if (condition) return; work(); }",
		"function labeledAbruptTry() { outer: try { break outer; } finally { return 1; } if (condition) return; work(); }",
		"function emptySwitchClause(value: number) { switch (value) { case 1: return; case 2: case 3: default: work(); } }",
		"function transparentContinuation() { if (condition) return; ; interface Result {} type Value = number; label: ; work(); }",
		"function labeledIfWithoutElse(condition: boolean) { outer: { if (condition) return 1; return 1; } return; }",
		"function labeledIfElseBreak(condition: boolean) { outer: { if (condition) return 1; else break outer; } if (condition) return; work(); }",
		"function labeledIfElseReturns(condition: boolean) { outer: { if (condition) return 1; else return 2; } return; }",
		"function labeledTryWithoutHandlers() { outer: { try { return 1; } return 1; } return; }",
		"function labeledTryCatchBreak() { outer: try { return 1; } catch { break outer; } if (condition) return; work(); }",
		"function labeledTryFinallyBreak() { outer: try { return 1; } catch { return 2; } finally { break outer; } if (condition) return; work(); }",
		"function labeledTryNoBreak() { outer: { try { return 1; } catch { return 2; } finally { cleanup(); } return 1; } return; }",
	],
});
