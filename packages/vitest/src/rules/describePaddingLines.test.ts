import { ruleTester } from "../ruleTester.ts";
import rule from "./describePaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
functionOne();
functionTwo();

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
xdescribe('...', () => {
  // Another comment
  describe('some condition', () => {
    const anotherThing = 500;
    describe('yet another condition', () => { // A comment over here!
    });
  });
});fdescribe('...', () => {});
describe.skip('skip me', () => {});
const value = 'value';
describe
  .skip('skip me too', () => {
    // stuff
  });
`,
			output: `
functionOne();
functionTwo();

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

xdescribe('...', () => {
  // Another comment
  describe('some condition', () => {
    const anotherThing = 500;

    describe('yet another condition', () => { // A comment over here!
    });
  });
});

fdescribe('...', () => {});

describe.skip('skip me', () => {});

const value = 'value';

describe
  .skip('skip me too', () => {
    // stuff
  });
`,
			snapshot: `
functionOne();
functionTwo();

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
xdescribe('...', () => {
~~~~~~~~~
This statement should be separated from a neighboring \`describe\` block by a blank line.
  // Another comment
  describe('some condition', () => {
    const anotherThing = 500;
    describe('yet another condition', () => { // A comment over here!
    ~~~~~~~~
    This statement should be separated from a neighboring \`describe\` block by a blank line.
    });
  });
});fdescribe('...', () => {});
   ~~~~~~~~~
   This statement should be separated from a neighboring \`describe\` block by a blank line.
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
functionOne();
functionTwo();

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

xdescribe('...', () => {
  // Another comment
  describe('some condition', () => {
    const anotherThing = 500;

    describe('yet another condition', () => { // A comment over here!
    });
  });
});

fdescribe('weird', () => {});

describe.skip('skip me', () => {});

const value = 'value';

describe
  .skip('skip me too', () => {
    // stuff
  });
`,
	],
});
