import { ruleTester } from "../ruleTester.ts";
import rule from "./beforeAllPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const someText = 'abc';
beforeAll(() => {
});
describe('someText', () => {
  const something = 'abc';
  // A comment
  beforeAll(() => {
    // stuff
  });
  beforeAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';
  beforeAll(() => {
    // stuff
  });
});
`,
			output: `
const someText = 'abc';

beforeAll(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  beforeAll(() => {
    // stuff
  });

  beforeAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  beforeAll(() => {
    // stuff
  });
});
`,
			snapshot: `
const someText = 'abc';
beforeAll(() => {
~~~~~~~~~
This statement should be separated from a neighboring \`beforeAll\` block by a blank line.
});
describe('someText', () => {
~~~~~~~~
This statement should be separated from a neighboring \`beforeAll\` block by a blank line.
  const something = 'abc';
  // A comment
  beforeAll(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`beforeAll\` block by a blank line.
    // stuff
  });
  beforeAll(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`beforeAll\` block by a blank line.
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';
  beforeAll(() => {
  ~~~~~~~~~
  This statement should be separated from a neighboring \`beforeAll\` block by a blank line.
    // stuff
  });
});
`,
		},
	],
	valid: [
		`
const someText = 'abc';

beforeAll(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  beforeAll(() => {
    // stuff
  });

  beforeAll(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  beforeAll(() => {
    // stuff
  });
});
`,
	],
});
