import { ruleTester } from "../ruleTester.ts";
import rule from "./allPaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const someText = 'abc';
xyz:
afterEach(() => {});
`,
			output: `
const someText = 'abc';

xyz:
afterEach(() => {});
`,
			snapshot: `
const someText = 'abc';
xyz:
~~~
This statement should be separated from a neighboring \`afterEach\` block by a blank line.
afterEach(() => {});
`,
		},
		{
			code: `
const value: string = 'cherry';
beforeEach(() => {});
it('does something?', () => {
  switch (value) {
    case 'apple':
      expect(value).toBe('apple');
      break;
    case 'banana':
    case 'cherry':
      const count = 1;
      expect(count).toBe(1);
      console.log('...');
      // Expected output: "..."
      break;
    default:
      console.log(\`$\{value}.\`);
  }
});
`,
			output: `
const value: string = 'cherry';

beforeEach(() => {});

it('does something?', () => {
  switch (value) {
    case 'apple':
      expect(value).toBe('apple');

      break;
    case 'banana':
    case 'cherry':
      const count = 1;

      expect(count).toBe(1);

      console.log('...');
      // Expected output: "..."
      break;
    default:
      console.log(\`$\{value}.\`);
  }
});
`,
			snapshot: `
const value: string = 'cherry';
beforeEach(() => {});
~~~~~~~~~~
This statement should be separated from a neighboring \`beforeEach\` block by a blank line.
it('does something?', () => {
~~
This statement should be separated from a neighboring \`test\` block by a blank line.
  switch (value) {
    case 'apple':
      expect(value).toBe('apple');
      break;
      ~~~~~
      This statement should be separated from a neighboring \`expect\` block by a blank line.
    case 'banana':
    case 'cherry':
      const count = 1;
      expect(count).toBe(1);
      ~~~~~~
      This statement should be separated from a neighboring \`expect\` block by a blank line.
      console.log('...');
      ~~~~~~~
      This statement should be separated from a neighboring \`expect\` block by a blank line.
      // Expected output: "..."
      break;
    default:
      console.log(\`$\{value}.\`);
  }
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
		`
xyz:
afterEach(() => {});
`,
	],
});
