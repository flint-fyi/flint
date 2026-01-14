import rule from "./elseIfDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (isSomething(value)) {
    doFirst();
} else if (isSomething(value)) {
    doSecond();
}
`,
			snapshot: `
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
if (isSomething /* ... */ (value)) {
    doFirst();
} else if (isSomething(value /* ... */)) {
    doSecond();
}
`,
			snapshot: `
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
if (value === "first") {
    process();
} else if (value === "second") {
    process();
} else if (value === "first") {
    process();
}
`,
			snapshot: `
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
if (isValid && isActive) {
    execute();
} else if (isPending) {
    wait();
} else if (isValid && isActive) {
    execute();
}
`,
			snapshot: `
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
if (value) {
    first();
} else if (value) {
    second();
} else if (value) {
    third();
}
`,
			snapshot: `
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
		`if (isSomething(value)) { doFirst(); } else if (isSomethingElse(value)) { doSecond(); }`,
		`if (first) { handleFirst(); } else if (second) { handleSecond(); } else if (third && fourth) { handleThird(); } else if (third && fifth) { handleFourth(); }`,
		`if (count === 1) { handleOne(); } else if (count === 2) { handleTwo(); } else if (count === 3) { handleThree(); } else if (count === 4) { handleFour(); }`,
		`if (value === "first") { process(); } else if (value === "second") { process(); } else if (value === "third") { process(); }`,
		`if (isValid) { execute(); } else if (isPending) { wait(); } else if (isInvalid) { reject(); }`,
		`if (value) { process(); }`,
		`if (first) { doFirst(); } else { doSecond(); }`,
		`if (first) { doFirst(); } else if (second) { doSecond(); } else { doDefault(); }`,
	],
});
