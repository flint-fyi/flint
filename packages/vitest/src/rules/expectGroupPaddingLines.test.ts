import { ruleTester } from "../ruleTester.ts";
import rule from "./expectGroupPaddingLines.ts";

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

test('thing one', () => {
  let abc = 123;
  expect(abc).toEqual(123);
  expect(123).toEqual(abc); // Line comment
  abc = 456;
  expect(abc).toEqual(456);
});

test('thing one', () => {
  const abc = 123;
  expect(abc).toEqual(123);

  const xyz = 987;
  expect(123).toEqual(abc); // Line comment
});

describe('someText', () => {
  describe('some condition', () => {
    test('value', () => {
      const xyz = 987;
      // Comment
      expect(xyz).toEqual(987);
      expect(1)
        .toEqual(1);
      expect(true).toEqual(true);
    });
  });
});

test('awaited expect', async () => {
  const abc = 123;
  const hasAPromise = () => Promise.resolve('foo');
  await expect(hasAPromise()).resolves.toEqual('foo');
  expect(abc).toEqual(123);

  const def = 456;
  expect(123).toEqual(abc);
  await expect(hasAPromise()).resolves.toEqual('foo');

  const ghi = 789;
  await expect(hasAPromise()).resolves.toEqual('foo');
  await expect(hasAPromise()).resolves.toEqual('foo');

  const somethingElseAsync = () => Promise.resolve('bar');
  await somethingElseAsync();
  await expect(hasAPromise()).resolves.toEqual('foo');
});

test('expectTypeOf test', () => {
  const value = 123;
  expectTypeOf(value).toBeNumber();
  expectTypeOf(value).toBeNumber();
  const text = 'abc';
  // Comment
  expectTypeOf(text).toBeString();
  expectTypeOf(text).toBeString();
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

test('thing one', () => {
  let abc = 123;

  expect(abc).toEqual(123);
  expect(123).toEqual(abc); // Line comment

  abc = 456;

  expect(abc).toEqual(456);
});

test('thing one', () => {
  const abc = 123;

  expect(abc).toEqual(123);

  const xyz = 987;

  expect(123).toEqual(abc); // Line comment
});

describe('someText', () => {
  describe('some condition', () => {
    test('value', () => {
      const xyz = 987;

      // Comment
      expect(xyz).toEqual(987);
      expect(1)
        .toEqual(1);
      expect(true).toEqual(true);
    });
  });
});

test('awaited expect', async () => {
  const abc = 123;
  const hasAPromise = () => Promise.resolve('foo');

  await expect(hasAPromise()).resolves.toEqual('foo');
  expect(abc).toEqual(123);

  const def = 456;

  expect(123).toEqual(abc);
  await expect(hasAPromise()).resolves.toEqual('foo');

  const ghi = 789;

  await expect(hasAPromise()).resolves.toEqual('foo');
  await expect(hasAPromise()).resolves.toEqual('foo');

  const somethingElseAsync = () => Promise.resolve('bar');
  await somethingElseAsync();

  await expect(hasAPromise()).resolves.toEqual('foo');
});

test('expectTypeOf test', () => {
  const value = 123;

  expectTypeOf(value).toBeNumber();
  expectTypeOf(value).toBeNumber();

  const text = 'abc';

  // Comment
  expectTypeOf(text).toBeString();
  expectTypeOf(text).toBeString();
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

test('thing one', () => {
  let abc = 123;
  expect(abc).toEqual(123);
  ~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  expect(123).toEqual(abc); // Line comment
  abc = 456;
  ~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  expect(abc).toEqual(456);
  ~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
});

test('thing one', () => {
  const abc = 123;
  expect(abc).toEqual(123);
  ~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.

  const xyz = 987;
  expect(123).toEqual(abc); // Line comment
  ~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
});

describe('someText', () => {
  describe('some condition', () => {
    test('value', () => {
      const xyz = 987;
      // Comment
      expect(xyz).toEqual(987);
      ~~~~~~
      This statement should be separated from a neighboring \`expect\` block by a blank line.
      expect(1)
        .toEqual(1);
      expect(true).toEqual(true);
    });
  });
});

test('awaited expect', async () => {
  const abc = 123;
  const hasAPromise = () => Promise.resolve('foo');
  await expect(hasAPromise()).resolves.toEqual('foo');
  ~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  expect(abc).toEqual(123);

  const def = 456;
  expect(123).toEqual(abc);
  ~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  await expect(hasAPromise()).resolves.toEqual('foo');

  const ghi = 789;
  await expect(hasAPromise()).resolves.toEqual('foo');
  ~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  await expect(hasAPromise()).resolves.toEqual('foo');

  const somethingElseAsync = () => Promise.resolve('bar');
  await somethingElseAsync();
  await expect(hasAPromise()).resolves.toEqual('foo');
  ~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
});

test('expectTypeOf test', () => {
  const value = 123;
  expectTypeOf(value).toBeNumber();
  ~~~~~~~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  expectTypeOf(value).toBeNumber();
  const text = 'abc';
  ~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  // Comment
  expectTypeOf(text).toBeString();
  ~~~~~~~~~~~~
  This statement should be separated from a neighboring \`expect\` block by a blank line.
  expectTypeOf(text).toBeString();
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
`,

		`
test('thing one', () => {
  let abc = 123;

  expect(abc).toEqual(123);
  expect(123).toEqual(abc); // Line comment

  abc = 456;

  expect(abc).toEqual(456);
});
`,

		`
test('thing one', () => {
  const abc = 123;

  expect(abc).toEqual(123);

  const xyz = 987;

  expect(123).toEqual(abc); // Line comment
});
`,

		`
describe('someText', () => {
  describe('some condition', () => {
    test('value', () => {
      const xyz = 987;

      // Comment
      expect(xyz).toEqual(987);
      expect(1)
        .toEqual(1);
      expect(true).toEqual(true);
    });
  });
});
`,

		`
test('awaited expect', async () => {
  const abc = 123;
  const hasAPromise = () => Promise.resolve('foo');

  await expect(hasAPromise()).resolves.toEqual('foo');
  expect(abc).toEqual(123);

  const def = 456;

  expect(123).toEqual(abc);
  await expect(hasAPromise()).resolves.toEqual('foo');

  const ghi = 789;

  await expect(hasAPromise()).resolves.toEqual('foo');
  await expect(hasAPromise()).resolves.toEqual('foo');

  const somethingElseAsync = () => Promise.resolve('bar');
  await somethingElseAsync();

  await expect(hasAPromise()).resolves.toEqual('foo');
});
`,

		`
test('expectTypeOf test', () => {
  const value = 123;

  expectTypeOf(value).toBeNumber();
  expectTypeOf(value).toBeNumber();

  const text = 'abc';

  // Comment
  expectTypeOf(text).toBeString();
  expectTypeOf(text).toBeString();
});
`,
	],
});
