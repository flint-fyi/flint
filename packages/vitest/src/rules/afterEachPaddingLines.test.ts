import { ruleTester } from "../ruleTester.ts";
import rule from "./afterEachPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const someText = 'abc';
afterEach(() => {
});
describe('someText', () => {
  const something = 'abc';
  // A comment
  afterEach(() => {
    // stuff
  });
  afterEach(() => {
    // other stuff
  });
});
describe('someText', () => {
  const something = 'abc';
  afterEach(() => {
    // stuff
  });
});
`,
			output: `
const someText = 'abc';

afterEach(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  afterEach(() => {
    // stuff
  });

  afterEach(() => {
    // other stuff
  });
});
describe('someText', () => {
  const something = 'abc';

  afterEach(() => {
    // stuff
  });
});
`,
			snapshot: `
const someText = 'abc';
afterEach(() => {
~~~~~~~~~
This statement should be separated from a neighboring \`afterEach\` block by a blank line.
});
describe('someText', () => {
~~~~~~~~
This statement should be separated from a neighboring \`afterEach\` block by a blank line.
  const something = 'abc';
  // A comment
  afterEach(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`afterEach\` block by a blank line.
    // stuff
  });
  afterEach(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`afterEach\` block by a blank line.
    // other stuff
  });
});
describe('someText', () => {
  const something = 'abc';
  afterEach(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`afterEach\` block by a blank line.
    // stuff
  });
});
`,
		},
	],
	valid: [
		`
const someText = 'abc';

afterEach(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  afterEach(() => {
    // stuff
  });

  afterEach(() => {
    // other stuff
  });
});
describe('someText', () => {
  const something = 'abc';

  afterEach(() => {
    // stuff
  });
});
`,
	],
});
