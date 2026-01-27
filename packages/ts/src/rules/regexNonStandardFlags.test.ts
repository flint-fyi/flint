// cSpell:ignore gixl
import rule from "./regexNonStandardFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/foo/l;
`,
			snapshot: `
/foo/l;
     ~
     Non-standard flag 'l' is not part of the ECMAScript standard.
`,
		},
		{
			code: `
/foo/gxl;
`,
			snapshot: `
/foo/gxl;
      ~
      Non-standard flag 'x' is not part of the ECMAScript standard.
       ~
       Non-standard flag 'l' is not part of the ECMAScript standard.
`,
		},
		{
			code: `
RegExp("foo", "l");
`,
			snapshot: `
RegExp("foo", "l");
               ~
               Non-standard flag 'l' is not part of the ECMAScript standard.
`,
		},
		{
			code: `
new RegExp("foo", "gxl");
`,
			snapshot: `
new RegExp("foo", "gxl");
                    ~
                    Non-standard flag 'x' is not part of the ECMAScript standard.
                     ~
                     Non-standard flag 'l' is not part of the ECMAScript standard.
`,
		},
		{
			code: `
/pattern/n;
`,
			snapshot: `
/pattern/n;
         ~
         Non-standard flag 'n' is not part of the ECMAScript standard.
`,
		},
		/* spellchecker:disable */
		{
			code: `
/test/gixl;
`,
			snapshot: `
/test/gixl;
        ~
        Non-standard flag 'x' is not part of the ECMAScript standard.
         ~
         Non-standard flag 'l' is not part of the ECMAScript standard.
`,
			/* spellchecker:enable */
		},
	],
	valid: [
		`/foo/gimsuy;`,
		`/foo/v;`,
		`/foo/d;`,
		`/foo/;`,
		`/pattern/gi;`,
		`/test/dgimsuy;`,
		`new RegExp("foo", "gi");`,
		`RegExp("foo", "gimsuy");`,
		`RegExp("foo");`,
		`RegExp(variable);`,
	],
});
