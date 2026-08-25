import rule from "./elseIfDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: string;
declare function isSomething(value: string): boolean;
declare function doFirst(): void;
declare function doSecond(): void;

if (isSomething(value)) {
    doFirst();
} else if (isSomething(value)) {
    doSecond();
}
`,
			snapshot: `
declare const value: string;
declare function isSomething(value: string): boolean;
declare function doFirst(): void;
declare function doSecond(): void;

if (isSomething(value)) {
    doFirst();
} else if (isSomething(value)) {
           ~~~~~~~~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    doSecond();
}
`,
		},
		{
			code: `
declare const value: string;
declare function isSomething(value: string): boolean;
declare function doFirst(): void;
declare function doSecond(): void;

if (isSomething /* ... */ (value)) {
    doFirst();
} else if (isSomething(value /* ... */)) {
    doSecond();
}
`,
			snapshot: `
declare const value: string;
declare function isSomething(value: string): boolean;
declare function doFirst(): void;
declare function doSecond(): void;

if (isSomething /* ... */ (value)) {
    doFirst();
} else if (isSomething(value /* ... */)) {
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    doSecond();
}
`,
		},
		{
			code: `
declare const first: boolean;
declare const fourth: boolean;
declare const second: boolean;
declare const third: boolean;
declare function handleFirst(): void;
declare function handleFourth(): void;
declare function handleSecond(): void;
declare function handleThird(): void;

if (first) {
    handleFirst();
} else if (second) {
    handleSecond();
} else if (third && fourth) {
    handleThird();
} else if (third && fourth) {
    handleFourth();
}
`,
			snapshot: `
declare const first: boolean;
declare const fourth: boolean;
declare const second: boolean;
declare const third: boolean;
declare function handleFirst(): void;
declare function handleFourth(): void;
declare function handleSecond(): void;
declare function handleThird(): void;

if (first) {
    handleFirst();
} else if (second) {
    handleSecond();
} else if (third && fourth) {
    handleThird();
} else if (third && fourth) {
           ~~~~~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    handleFourth();
}
`,
		},
		{
			code: `
declare const count: number;
declare function handleFive(): void;
declare function handleFour(): void;
declare function handleOne(): void;
declare function handleThree(): void;
declare function handleTwo(): void;

if (count === 1) {
    handleOne();
} else if (count === 2) {
    handleTwo();
} else if (count === 3) {
    handleThree();
} else if (count === 2) {
    handleFour();
} else if (count === 5) {
    handleFive();
}
`,
			snapshot: `
declare const count: number;
declare function handleFive(): void;
declare function handleFour(): void;
declare function handleOne(): void;
declare function handleThree(): void;
declare function handleTwo(): void;

if (count === 1) {
    handleOne();
} else if (count === 2) {
    handleTwo();
} else if (count === 3) {
    handleThree();
} else if (count === 2) {
           ~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    handleFour();
} else if (count === 5) {
    handleFive();
}
`,
		},
		{
			code: `
declare const value: string;
declare function process(): void;

if (value === "first") {
    process();
} else if (value === "second") {
    process();
} else if (value === "first") {
    process();
}
`,
			snapshot: `
declare const value: string;
declare function process(): void;

if (value === "first") {
    process();
} else if (value === "second") {
    process();
} else if (value === "first") {
           ~~~~~~~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    process();
}
`,
		},
		{
			code: `
declare const isActive: boolean;
declare const isPending: boolean;
declare const isValid: boolean;
declare function execute(): void;
declare function wait(): void;

if (isValid && isActive) {
    execute();
} else if (isPending) {
    wait();
} else if (isValid && isActive) {
    execute();
}
`,
			snapshot: `
declare const isActive: boolean;
declare const isPending: boolean;
declare const isValid: boolean;
declare function execute(): void;
declare function wait(): void;

if (isValid && isActive) {
    execute();
} else if (isPending) {
    wait();
} else if (isValid && isActive) {
           ~~~~~~~~~~~~~~~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    execute();
}
`,
		},
		{
			code: `
declare const value: boolean;
declare function first(): void;
declare function second(): void;
declare function third(): void;

if (value) {
    first();
} else if (value) {
    second();
} else if (value) {
    third();
}
`,
			snapshot: `
declare const value: boolean;
declare function first(): void;
declare function second(): void;
declare function third(): void;

if (value) {
    first();
} else if (value) {
           ~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    second();
} else if (value) {
           ~~~~~
           This condition is identical to a previous condition in the if-else-if chain.
    third();
}
`,
		},
	],
	valid: [
		`
declare const value: string;
declare function doFirst(): void;
declare function doSecond(): void;
declare function isSomething(value: string): boolean;
declare function isSomethingElse(value: string): boolean;

if (isSomething(value)) {
    doFirst();
} else if (isSomethingElse(value)) {
    doSecond();
}`,
		`
declare const fifth: boolean;
declare const first: boolean;
declare const fourth: boolean;
declare const second: boolean;
declare const third: boolean;
declare function handleFirst(): void;
declare function handleFourth(): void;
declare function handleSecond(): void;
declare function handleThird(): void;

if (first) {
    handleFirst();
} else if (second) {
    handleSecond();
} else if (third && fourth) {
    handleThird();
} else if (third && fifth) {
    handleFourth();
}`,
		`
declare const count: number;
declare function handleFour(): void;
declare function handleOne(): void;
declare function handleThree(): void;
declare function handleTwo(): void;

if (count === 1) {
    handleOne();
} else if (count === 2) {
    handleTwo();
} else if (count === 3) {
    handleThree();
} else if (count === 4) {
    handleFour();
}`,
		`
declare const value: string;
declare function process(): void;

if (value === "first") {
    process();
} else if (value === "second") {
    process();
} else if (value === "third") {
    process();
}`,
		`
declare const isInvalid: boolean;
declare const isPending: boolean;
declare const isValid: boolean;
declare function execute(): void;
declare function reject(): void;
declare function wait(): void;

if (isValid) {
    execute();
} else if (isPending) {
    wait();
} else if (isInvalid) {
    reject();
}`,
		`
declare const value: boolean;
declare function process(): void;

if (value) {
    process();
}`,
		`
declare const first: boolean;
declare function doFirst(): void;
declare function doSecond(): void;

if (first) {
    doFirst();
} else {
    doSecond();
}`,
		`
declare const first: boolean;
declare const second: boolean;
declare function doDefault(): void;
declare function doFirst(): void;
declare function doSecond(): void;

if (first) {
    doFirst();
} else if (second) {
    doSecond();
} else {
    doDefault();
}`,
	],
});
