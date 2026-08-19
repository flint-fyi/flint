import { ruleTester } from "../ruleTester.ts";
import rule from "./describePaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const functionOne = () => {};
const functionTwo = () => {};

const someText = 'abc';
const someObject = {
  one: 1,
  two: 2,
};
// A comment before describe
describe('someText', () => {
  describe('some condition', () => {
  });
  describe('some other condition', () => {
  });
});
describe.skip('skip me', () => {});
const value = 'value';
describe
  .skip('skip me too', () => {
    // stuff
  });
`,
			output: `
const functionOne = () => {};
const functionTwo = () => {};

const someText = 'abc';
const someObject = {
  one: 1,
  two: 2,
};

// A comment before describe
describe('someText', () => {
  describe('some condition', () => {
  });

  describe('some other condition', () => {
  });
});

describe.skip('skip me', () => {});

const value = 'value';

describe
  .skip('skip me too', () => {
    // stuff
  });
`,
			snapshot: `
const functionOne = () => {};
const functionTwo = () => {};

const someText = 'abc';
const someObject = {
  one: 1,
  two: 2,
};
// A comment before describe
describe('someText', () => {
~~~~~~~~
This statement should be separated from a neighboring \`describe\` block by a blank line.
  describe('some condition', () => {
  });
  describe('some other condition', () => {
  ~~~~~~~~
  This statement should be separated from a neighboring \`describe\` block by a blank line.
  });
});
describe.skip('skip me', () => {});
~~~~~~~~
This statement should be separated from a neighboring \`describe\` block by a blank line.
const value = 'value';
~~~~~
This statement should be separated from a neighboring \`describe\` block by a blank line.
describe
~~~~~~~~
This statement should be separated from a neighboring \`describe\` block by a blank line.
  .skip('skip me too', () => {
    // stuff
  });
`,
		},
	],
	valid: [
		`
const functionOne = () => {};
const functionTwo = () => {};

const someText = 'abc';
const someObject = {
  one: 1,
  two: 2,
};

// A comment before describe
describe('someText', () => {
  describe('some condition', () => {
  });

  describe('some other condition', () => {
  });
});

describe.skip('skip me', () => {});

const value = 'value';

describe
  .skip('skip me too', () => {
    // stuff
  });
`,
	],
});
