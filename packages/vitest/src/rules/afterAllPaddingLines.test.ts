import { ruleTester } from "../ruleTester.ts";
import rule from "./afterAllPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
afterAll(() => {}); describe("someText", () => {});
`,
			output: `
afterAll(() => {});

 describe("someText", () => {});
`,
			snapshot: `
afterAll(() => {}); describe("someText", () => {});
                    ~~~~~~~~
                    This statement should be separated from a neighboring \`afterAll\` block by a blank line.
`,
		},
		{
			code: `
const someText = "abc";
afterAll(() => {
});
describe("someText", () => {
    const something = "abc";
    // A comment
    afterAll(() => {
        // stuff
    });
    afterAll(() => {
        // other stuff
    });
});

describe("someText", () => {
    const something = "abc";
    afterAll(() => {
        // stuff
    });
});
`,
			output: `
const someText = "abc";

afterAll(() => {
});

describe("someText", () => {
    const something = "abc";

    // A comment
    afterAll(() => {
        // stuff
    });

    afterAll(() => {
        // other stuff
    });
});

describe("someText", () => {
    const something = "abc";

    afterAll(() => {
        // stuff
    });
});
`,
			snapshot: `
const someText = "abc";
afterAll(() => {
~~~~~~~~
~~~~~~~~
This statement should be separated from a neighboring \`afterAll\` block by a blank line.
});
describe("someText", () => {
    const something = "abc";
    // A comment
    afterAll(() => {
    ~~~~~~~~
    This statement should be separated from a neighboring \`afterAll\` block by a blank line.
        // stuff
    });
    afterAll(() => {
    ~~~~~~~~
    This statement should be separated from a neighboring \`afterAll\` block by a blank line.
        // other stuff
    });
});

describe("someText", () => {
    const something = "abc";
    afterAll(() => {
    ~~~~~~~~
    This statement should be separated from a neighboring \`afterAll\` block by a blank line.
        // stuff
    });
});
`,
		},
		{
			code: `
const someText = "abc"; // keep this note
afterAll(() => {}); // cleanup
describe("someText", () => {});
`,
			output: `
const someText = "abc"; // keep this note

afterAll(() => {}); // cleanup

describe("someText", () => {});
`,
			snapshot: `
const someText = "abc"; // keep this note
afterAll(() => {}); // cleanup
~~~~~~~~
~~~~~~~~
This statement should be separated from a neighboring \`afterAll\` block by a blank line.
This statement should be separated from a neighboring \`afterAll\` block by a blank line.
describe("someText", () => {});
`,
		},
	],
	valid: [
		`
afterAll(() => {});

describe("someText", () => {});
`,
		`
const someText = "abc";

afterAll(() => {
});

describe("someText", () => {
    const something = "abc";

    // A comment
    afterAll(() => {
        // stuff
    });

    afterAll(() => {
        // other stuff
    });
});

describe("someText", () => {
    const something = "abc";

    afterAll(() => {
        // stuff
    });
});
`,
		`
const someText = "abc";

afterAll(() => {
});
`,
		`
beforeAll(() => {
});
describe("someText", () => {});
`,
	],
});
