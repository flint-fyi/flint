import { ruleTester } from "../ruleTester.ts";
import rule from "./afterAllPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const someText = 'abc';
afterAll(() => {
});
describe('someText', () => {
  const something = 'abc';
  // A comment
  afterAll(() => {
    // stuff
  });
  afterAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';
  afterAll(() => {
    // stuff
  });
});
`,
			output: `
const someText = 'abc';

afterAll(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  afterAll(() => {
    // stuff
  });

  afterAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  afterAll(() => {
    // stuff
  });
});
`,
			snapshot: `
const someText = 'abc';
afterAll(() => {
~~~~~~~~
This statement should be separated from a neighboring \`afterAll\` block by a blank line.
});
describe('someText', () => {
~~~~~~~~
This statement should be separated from a neighboring \`afterAll\` block by a blank line.
  const something = 'abc';
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

describe('someText', () => {
  const something = 'abc';
  afterAll(() => {
  ~~~~~~~~
  This statement should be separated from a neighboring \`afterAll\` block by a blank line.
    // stuff
  });
});
`,
		},
	],
	valid: [
		`
const someText = 'abc';

afterAll(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  afterAll(() => {
    // stuff
  });

  afterAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  afterAll(() => {
    // stuff
  });
});
`,
	],
});
