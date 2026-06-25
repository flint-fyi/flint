import { ruleTester } from "../ruleTester.ts";
import rule from "./testCasePaddingLines.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const first = 'bar';
const second = 'baz';
it('first', () => {
  // stuff
});
fit('second', () => {
  // stuff
});
test('first first', () => {});
test('second second', () => {});

// Nesting
describe('other second', () => {
  const thing = 123;
  test('is another second w/ test', () => {
  });
  // With a comment
  it('is another second w/ it', () => {
  });
  test.skip('skipping', () => {}); // Another comment
  it.skip('skipping too', () => {});
});xtest('weird', () => {});
test
  .skip('skippy skip', () => {});
xit('second first', () => {});
`,
			output: `
const first = 'bar';
const second = 'baz';

it('first', () => {
  // stuff
});

fit('second', () => {
  // stuff
});

test('first first', () => {});

test('second second', () => {});

// Nesting
describe('other second', () => {
  const thing = 123;

  test('is another second w/ test', () => {
  });

  // With a comment
  it('is another second w/ it', () => {
  });

  test.skip('skipping', () => {}); // Another comment

  it.skip('skipping too', () => {});
});

xtest('weird', () => {});

test
  .skip('skippy skip', () => {});

xit('second first', () => {});
`,
			snapshot: `
const first = 'bar';
const second = 'baz';
it('first', () => {
~~
This statement should be separated from a neighboring \`test\` block by a blank line.
  // stuff
});
fit('second', () => {
~~~
This statement should be separated from a neighboring \`test\` block by a blank line.
  // stuff
});
test('first first', () => {});
~~~~
This statement should be separated from a neighboring \`test\` block by a blank line.
test('second second', () => {});
~~~~
This statement should be separated from a neighboring \`test\` block by a blank line.

// Nesting
describe('other second', () => {
  const thing = 123;
  test('is another second w/ test', () => {
  ~~~~
  This statement should be separated from a neighboring \`test\` block by a blank line.
  });
  // With a comment
  it('is another second w/ it', () => {
  ~~
  This statement should be separated from a neighboring \`test\` block by a blank line.
  });
  test.skip('skipping', () => {}); // Another comment
  ~~~~
  This statement should be separated from a neighboring \`test\` block by a blank line.
  it.skip('skipping too', () => {});
  ~~
  This statement should be separated from a neighboring \`test\` block by a blank line.
});xtest('weird', () => {});
   ~~~~~
   This statement should be separated from a neighboring \`test\` block by a blank line.
test
~~~~
This statement should be separated from a neighboring \`test\` block by a blank line.
  .skip('skippy skip', () => {});
xit('second first', () => {});
~~~
This statement should be separated from a neighboring \`test\` block by a blank line.
`,
		},
	],
	valid: [
		`
const first = 'bar';
const second = 'baz';

it('first', () => {
  // stuff
});

fit('second', () => {
  // stuff
});

test('first first', () => {});

test('second second', () => {});

// Nesting
describe('other second', () => {
  const thing = 123;

  test('is another second w/ test', () => {
  });

  // With a comment
  it('is another second w/ it', () => {
  });

  test.skip('skipping', () => {}); // Another comment

  it.skip('skipping too', () => {});
});

xtest('weird', () => {});

test
  .skip('skippy skip', () => {});

xit('second first', () => {});
`,
	],
});
