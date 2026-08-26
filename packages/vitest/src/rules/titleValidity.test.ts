import { ruleTester } from "../ruleTester.ts";
import rule from "./titleValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
test("the correct way to properly handle all things", () => {});
`,
			options: { disallowedWords: ["correct", "properly", "all"] },
			snapshot: `
test("the correct way to properly handle all things", () => {});
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     \`correct\` is not allowed in test title.
`,
		},
		{
			code: `
describe("the correct way to do things", function () {})
`,
			options: { disallowedWords: ["correct"] },
			snapshot: `
describe("the correct way to do things", function () {})
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         \`correct\` is not allowed in test title.
`,
		},
		{
			code: `
it("has ALL the things", () => {})
`,
			options: { disallowedWords: ["all"] },
			snapshot: `
it("has ALL the things", () => {})
   ~~~~~~~~~~~~~~~~~~~~
   \`ALL\` is not allowed in test title.
`,
		},
		{
			code: `
xdescribe("every single one of them", function () {})
`,
			options: { disallowedWords: ["every"] },
			snapshot: `
xdescribe("every single one of them", function () {})
          ~~~~~~~~~~~~~~~~~~~~~~~~~~
          \`every\` is not allowed in test title.
`,
		},
		{
			code: `
describe('Very Descriptive Title Goes Here', function () {})
`,
			options: { disallowedWords: ["descriptive"] },
			snapshot: `
describe('Very Descriptive Title Goes Here', function () {})
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         \`Descriptive\` is not allowed in test title.
`,
		},
		{
			code: `
test(\`that the value is set properly\`, function () {})
`,
			options: { disallowedWords: ["properly"] },
			snapshot: `
test(\`that the value is set properly\`, function () {})
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     \`properly\` is not allowed in test title.
`,
		},
		{
			code: `
import { test } from './test-extend'
test('the correct way to properly handle all things', () => {})
`,
			options: { disallowedWords: ["correct"] },
			snapshot: `
import { test } from './test-extend'
test('the correct way to properly handle all things', () => {})
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     \`correct\` is not allowed in test title.
`,
		},
		{
			code: `
import { test } from '@/tests/fixtures'
test('the correct way to properly handle all things', () => {})
`,
			options: { disallowedWords: ["correct"] },
			snapshot: `
import { test } from '@/tests/fixtures'
test('the correct way to properly handle all things', () => {})
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     \`correct\` is not allowed in test title.
`,
		},
	],
	valid: [
		`describe("the correct way to properly handle all the things", () => {});`,
		`test("that all is as it should be", () => {});`,
		{
			code: `it("correctly sets the value", () => {});`,
			options: {
				disallowedWords: ["incorrectly"],
				ignoreTypeOfDescribeName: false,
			},
		},
		{
			code: `it("correctly sets the value", () => {});`,
			options: { disallowedWords: undefined },
		},
		`
      function foo(){}
      describe(foo, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      })
     `,
		`
      declare const outerName: string;
      describe(outerName, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      })
     `,
		`
      declare const outerName: 'a';
      describe(outerName, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      })
     `,
		`
      declare const outerName: \`\${'a'}\`;
      describe(outerName, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      })
     `,
		`
      class foo{}
      describe(foo, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      })
      `,
		`
      type Func = (params: object) => void
      const func: Func = (params) => console.log(params)
      describe(func, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      });`,
		`
      interface Func {
        (params: object): void
      }
      const func: Func = (params) => console.log(params)
      describe(func, () => {
        test('item', () => {
          expect(0).toBe(0)
        })
      });`,
		{
			code: `
        import { validatorFunction } from "./myFunction"
        describe(validatorFunction, () => {
          test('item', () => {
            expect(0).toBe(0)
          })
        })
      `,
			fileName: "myFunction.test.ts",
			files: { "myFunction.ts": `export function validatorFunction() {}` },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
test(bar, () => {});
`,
			options: { allowArguments: false },
			snapshot: `
test(bar, () => {});
     ~~~
     Test title must be a string, a function or class name.
`,
		},
	],
	valid: [
		{
			code: `it(foo, () => {});`,
			options: { allowArguments: true },
		},
		{
			code: `describe(bar, () => {});`,
			options: { allowArguments: true },
		},
		{
			code: `test(baz, () => {});`,
			options: { allowArguments: true },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
     describe('things to test', () => {
      describe('unit tests #unit', () => {
        it('is true', () => {
       expect(true).toBe(true);
        });
      });

      describe('e2e tests #e4e', () => {
        it('is another test #e2e #vitest4life', () => {});
      });
       });
`,
			options: {
				mustMatch: "^[^#]+$|(?:#(?:unit|e2e))",
				mustNotMatch: "(?:#(?!unit|e2e))\\w+",
			},
			snapshot: `
     describe('things to test', () => {
      describe('unit tests #unit', () => {
        it('is true', () => {
       expect(true).toBe(true);
        });
      });

      describe('e2e tests #e4e', () => {
               ~~~~~~~~~~~~~~~~
               \`describe\` should not match /(?:#(?!unit|e2e))\\w+/u.
        it('is another test #e2e #vitest4life', () => {});
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           \`it\` should not match /(?:#(?!unit|e2e))\\w+/u.
      });
       });
`,
		},
		{
			code: `
 describe('things to test', () => {
      describe('unit tests #unit', () => {
        it('is true', () => {
       expect(true).toBe(true);
        });
      });

      describe('e2e tests #e4e', () => {
        it('is another test #e2e #vitest4life', () => {});
      });
       });
`,
			options: {
				mustMatch: [
					"^[^#]+$|(?:#(?:unit|e2e))",
					'Please include "#unit" or "#e2e" in titles',
				],
				mustNotMatch: [
					"(?:#(?!unit|e2e))\\w+",
					'Please include "#unit" or "#e2e" in titles',
				],
			},
			snapshot: `
 describe('things to test', () => {
      describe('unit tests #unit', () => {
        it('is true', () => {
       expect(true).toBe(true);
        });
      });

      describe('e2e tests #e4e', () => {
               ~~~~~~~~~~~~~~~~
               \`describe\` should not match /(?:#(?!unit|e2e))\\w+/u. Please include "#unit" or "#e2e" in titles
        it('is another test #e2e #vitest4life', () => {});
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           \`it\` should not match /(?:#(?!unit|e2e))\\w+/u. Please include "#unit" or "#e2e" in titles
      });
       });
`,
		},
		{
			code: `
test("the correct way to properly handle all things", () => {});
`,
			options: { mustMatch: "#(?:unit|integration|e2e)" },
			snapshot: `
test("the correct way to properly handle all things", () => {});
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     \`test\` should match /#(?:unit|integration|e2e)/u.
`,
		},
		{
			code: `
describe.skip("the test", () => {});
`,
			options: { mustMatch: { describe: "#(?:unit|integration|e2e)" } },
			snapshot: `
describe.skip("the test", () => {});
              ~~~~~~~~~~
              \`describe\` should match /#(?:unit|integration|e2e)/u.
`,
		},
	],
	valid: [
		`describe("the correct way to properly handle all the things", () => {});`,
		`test("that all is as it should be", () => {});`,
		{
			code: `it("correctly sets the value", () => {});`,
			options: { mustMatch: {} },
		},
		{
			code: `it("correctly sets the value", () => {});`,
			options: { mustMatch: " " },
		},
		{
			code: `it("correctly sets the value", () => {});`,
			options: { mustMatch: [" "] },
		},
		{
			code: `it("correctly sets the value #unit", () => {});`,
			options: { mustMatch: "#(?:unit|integration|e2e)" },
		},
		{
			code: `it("correctly sets the value", () => {});`,
			options: { mustMatch: "^[^#]+$|(?:#(?:unit|e2e))" },
		},
		{
			code: `it("correctly sets the value", () => {});`,
			options: { mustMatch: { test: "#(?:unit|integration|e2e)" } },
		},
		{
			code: `describe('things to test', () => {
      describe('unit tests #unit', () => {
        it('is true', () => {
       expect(true).toBe(true);
        });
      });

      describe('e2e tests #e2e', () => {
        it('is another test #jest4life', () => {});
      });
       });`,
			options: { mustMatch: { test: "^[^#]+$|(?:#(?:unit|e2e))" } },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
it.each([])(1, () => {});
`,
			snapshot: `
it.each([])(1, () => {});
            ~
            Test title must be a string, a function or class name.
`,
		},
		{
			code: `
it.skip.each([])(1, () => {});
`,
			snapshot: `
it.skip.each([])(1, () => {});
                 ~
                 Test title must be a string, a function or class name.
`,
		},
		{
			code: `
it.skip.each\`\`(1, () => {});
`,
			snapshot: `
it.skip.each\`\`(1, () => {});
               ~
               Test title must be a string, a function or class name.
`,
		},
		{
			code: `
it(123, () => {});
`,
			snapshot: `
it(123, () => {});
   ~~~
   Test title must be a string, a function or class name.
`,
		},
		{
			code: `
it.concurrent(123, () => {});
`,
			snapshot: `
it.concurrent(123, () => {});
              ~~~
              Test title must be a string, a function or class name.
`,
		},
		{
			code: `
it(1 + 2 + 3, () => {});
`,
			snapshot: `
it(1 + 2 + 3, () => {});
   ~~~~~~~~~
   Test title must be a string, a function or class name.
`,
		},
	],
	valid: [
		`it("is a string", () => {});`,
		`it("is" + " a " + " string", () => {});`,
		`it(1 + " + " + 1, () => {});`,
		`test("is a string", () => {});`,
		`xtest("is a string", () => {});`,
		`xtest(\`\${myFunc} is a string\`, () => {});`,
		`describe("is a string", () => {});`,
		`describe.skip("is a string", () => {});`,
		`describe.skip(\`\${myFunc} is a string\`, () => {});`,
		`fdescribe("is a string", () => {});`,
		{
			code: `describe(String(/.+/), () => {});`,
			options: { ignoreTypeOfDescribeName: true },
		},
		{
			code: `describe(myFunction, () => {});`,
			options: { ignoreTypeOfDescribeName: true },
		},
		{
			code: `xdescribe(skipFunction, () => {});`,
			options: { disallowedWords: [], ignoreTypeOfDescribeName: true },
		},
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
describe("", function () {})
`,
			snapshot: `
describe("", function () {})
         ~~
         \`describe\` should not have an empty title.
`,
		},
		{
			code: `
       describe('foo', () => {
      it('', () => {});
       });
`,
			snapshot: `
       describe('foo', () => {
      it('', () => {});
         ~~
         \`it\` should not have an empty title.
       });
`,
		},
		{
			code: `
       describe('foo', () => {
      test('', () => {});
       });
`,
			snapshot: `
       describe('foo', () => {
      test('', () => {});
           ~~
           \`test\` should not have an empty title.
       });
`,
		},
		{
			code: `
it("", function () {})
`,
			snapshot: `
it("", function () {})
   ~~
   \`it\` should not have an empty title.
`,
		},
		{
			code: `
it.concurrent("", function () {})
`,
			snapshot: `
it.concurrent("", function () {})
              ~~
              \`it\` should not have an empty title.
`,
		},
		{
			code: `
test("", function () {})
`,
			snapshot: `
test("", function () {})
     ~~
     \`test\` should not have an empty title.
`,
		},
		{
			code: `
test.concurrent("", function () {})
`,
			snapshot: `
test.concurrent("", function () {})
                ~~
                \`test\` should not have an empty title.
`,
		},
		{
			code: `
test.concurrent(\`\`, function () {})
`,
			snapshot: `
test.concurrent(\`\`, function () {})
                ~~
                \`test\` should not have an empty title.
`,
		},
		{
			code: `
xdescribe('', () => {})
`,
			snapshot: `
xdescribe('', () => {})
          ~~
          \`describe\` should not have an empty title.
`,
		},
	],
	valid: [
		`describe()`,
		`someFn("", function () {})`,
		`describe("foo", function () {})`,
		`describe("foo", function () { it("bar", function () {}) })`,
		`test("foo", function () {})`,
		`test.concurrent("foo", function () {})`,
		`test(\`foo\`, function () {})`,
		`test.concurrent(\`foo\`, function () {})`,
		`test(\`\${foo}\`, function () {})`,
		`test.concurrent(\`\${foo}\`, function () {})`,
		`test.scoped({})`,
		`it.scoped({})`,
		`it('foo', function () {})`,
		`it.each([])()`,
		`it.concurrent('foo', function () {})`,
		`xdescribe('foo', function () {})`,
		`xit('foo', function () {})`,
		`xtest('foo', function () {})`,
	],
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
describe(" foo", function () {})
`,
			output: `
describe("foo", function () {})
`,
			snapshot: `
describe(" foo", function () {})
         ~~~~~~
         Should not have leading or trailing spaces
`,
		},
		{
			code: `
describe.each()(" foo", function () {})
`,
			output: `
describe.each()("foo", function () {})
`,
			snapshot: `
describe.each()(" foo", function () {})
                ~~~~~~
                Should not have leading or trailing spaces
`,
		},
		{
			code: `
describe.only.each()(" foo", function () {})
`,
			output: `
describe.only.each()("foo", function () {})
`,
			snapshot: `
describe.only.each()(" foo", function () {})
                     ~~~~~~
                     Should not have leading or trailing spaces
`,
		},
		{
			code: `
describe(" foo foe fum", function () {})
`,
			output: `
describe("foo foe fum", function () {})
`,
			snapshot: `
describe(" foo foe fum", function () {})
         ~~~~~~~~~~~~~~
         Should not have leading or trailing spaces
`,
		},
		{
			code: `
describe("foo foe fum ", function () {})
`,
			output: `
describe("foo foe fum", function () {})
`,
			snapshot: `
describe("foo foe fum ", function () {})
         ~~~~~~~~~~~~~~
         Should not have leading or trailing spaces
`,
		},
		{
			code: `
it.skip(" foo", function () {})
`,
			output: `
it.skip("foo", function () {})
`,
			snapshot: `
it.skip(" foo", function () {})
        ~~~~~~
        Should not have leading or trailing spaces
`,
		},
		{
			code: `
fit("foo ", function () {})
`,
			output: `
fit("foo", function () {})
`,
			snapshot: `
fit("foo ", function () {})
    ~~~~~~
    Should not have leading or trailing spaces
`,
		},
		{
			code: `
it.skip("foo ", function () {})
`,
			output: `
it.skip("foo", function () {})
`,
			snapshot: `
it.skip("foo ", function () {})
        ~~~~~~
        Should not have leading or trailing spaces
`,
		},
	],
	valid: [
		`it()`,
		`it.concurrent()`,
		`describe()`,
		`it.each()()`,
		`describe("foo", function () {})`,
		`fdescribe("foo", function () {})`,
		`xdescribe("foo", function () {})`,
		`it("foo", function () {})`,
		`it.concurrent("foo", function () {})`,
		`fit("foo", function () {})`,
		`fit.concurrent("foo", function () {})`,
		`xit("foo", function () {})`,
		`test("foo", function () {})`,
		`test.concurrent("foo", function () {})`,
		`xtest("foo", function () {})`,
		`xtest(\`foo\`, function () {})`,
		`someFn("foo", function () {})`,
		`
    import { test } from 'vitest';

    export const myTest = test.extend({
      archive: []
    })`,
		{
			code: `
        import { test } from 'vitest';

        const it = test.extend({})
        it('passes', () => {})
      `,
			name: "does not error when using test.extend",
		},
		{
			code: `import { it } from 'vitest'

        const test = it.extend({
          fixture: [
            async ({}, use) => {
              setup()
              await use()
              teardown()
            },
            { auto: true }
          ],
        })

        test('passes', () => {})
      `,
			name: "does not error when using it.extend",
		},
	],
});
