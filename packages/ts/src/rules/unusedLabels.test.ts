import { ruleTester } from "./ruleTester.ts";
import rule from "./unusedLabels.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
unused: for (let i = 0; i < 10; i++) {
    console.log(i);
}
`,
			snapshot: `
unused: for (let i = 0; i < 10; i++) {
~~~~~~
Remove the unused label 'unused'.
    console.log(i);
}
`,
		},
		{
			code: `
unused: {
    console.log("block");
}
`,
			snapshot: `
unused: {
~~~~~~
Remove the unused label 'unused'.
    console.log("block");
}
`,
		},
		{
			code: `
outer: for (let i = 0; i < 10; i++) {
    inner: for (let j = 0; j < 10; j++) {
        console.log(i, j);
    }
}
`,
			snapshot: `
outer: for (let i = 0; i < 10; i++) {
~~~~~
Remove the unused label 'outer'.
    inner: for (let j = 0; j < 10; j++) {
    ~~~~~
    Remove the unused label 'inner'.
        console.log(i, j);
    }
}
`,
		},
		{
			code: `
unused: while (true) {
    break;
}
`,
			snapshot: `
unused: while (true) {
~~~~~~
Remove the unused label 'unused'.
    break;
}
`,
		},
		{
			code: `
unused: do {
    console.log("test");
} while (false);
`,
			snapshot: `
unused: do {
~~~~~~
Remove the unused label 'unused'.
    console.log("test");
} while (false);
`,
		},
		{
			code: `
outer: {
    const run = () => {
        outer: while (true) {
            break outer;
        }
    };
    run();
}
`,
			snapshot: `
outer: {
~~~~~
Remove the unused label 'outer'.
    const run = () => {
        outer: while (true) {
            break outer;
        }
    };
    run();
}
`,
		},
	],
	valid: [
		`for (let i = 0; i < 10; i++) { console.log(i); }`,
		`
used: for (let i = 0; i < 10; i++) {
    if (i === 5) break used;
    console.log(i);
}
`,
		`
loopLabel: for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        if (j === 5) continue loopLabel;
    }
}
`,
		`
outer: for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        if (i === 5 && j === 5) break outer;
    }
}
`,
		`
used: {
    if (true) break used;
    console.log("block");
}
`,
	],
});
