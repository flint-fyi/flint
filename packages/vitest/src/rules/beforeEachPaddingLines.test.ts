import { ruleTester } from "../ruleTester.ts";
import rule from "./beforeEachPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const someText = 'abc';
beforeEach(() => {
});
describe('someText', () => {
  const something = 'abc';
  // A comment
  beforeEach(() => {
    // stuff
  });
  beforeEach(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';
  beforeEach(() => {
    // stuff
  });
});
`,
			output: `
const someText = 'abc';

beforeEach(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  beforeEach(() => {
    // stuff
  });

  beforeEach(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  beforeEach(() => {
    // stuff
  });
});
`,
			snapshot: `
const someText = 'abc';
beforeEach(() => {
~~~~~~~~~~
This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
});
describe('someText', () => {
~~~~~~~~
This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
  const something = 'abc';
  // A comment
  beforeEach(() => {
  ~~~~~~~~~~
  This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
    // stuff
  });
  beforeEach(() => {
  ~~~~~~~~~~
  This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';
  beforeEach(() => {
  ~~~~~~~~~~
  This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
    // stuff
  });
});
`,
		},
	],
	valid: [
		`
const someText = 'abc';

beforeEach(() => {
});

describe('someText', () => {
  const something = 'abc';

  // A comment
  beforeEach(() => {
    // stuff
  });

  beforeEach(() => {
    // other stuff
  });
});

describe('someText', () => {
  const something = 'abc';

  beforeEach(() => {
    // stuff
  });
});
`,
	],
});
