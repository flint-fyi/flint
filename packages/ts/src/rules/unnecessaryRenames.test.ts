import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryRenames.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const obj: {
    foo: unknown;
};
let {foo: foo} = obj;
`,
			output: `
declare const obj: {
    foo: unknown;
};
let {foo} = obj;
`,
			snapshot: `
declare const obj: {
    foo: unknown;
};
let {foo: foo} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo: unknown;
declare const obj: {
    foo: unknown;
};
({foo: (foo)} = obj);
`,
			output: `
let foo: unknown;
declare const obj: {
    foo: unknown;
};
({foo} = obj);
`,
			snapshot: `
let foo: unknown;
declare const obj: {
    foo: unknown;
};
({foo: (foo)} = obj);
  ~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    a: unknown;
};
let {\\u0061: a} = obj;
`,
			output: `
declare const obj: {
    a: unknown;
};
let {a} = obj;
`,
			snapshot: `
declare const obj: {
    a: unknown;
};
let {\\u0061: a} = obj;
     ~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    a: unknown;
};
let {a: \\u0061} = obj;
`,
			output: `
declare const obj: {
    a: unknown;
};
let {\\u0061} = obj;
`,
			snapshot: `
declare const obj: {
    a: unknown;
};
let {a: \\u0061} = obj;
     ~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    a: unknown;
};
let {\\u0061: \\u0061} = obj;
`,
			output: `
declare const obj: {
    a: unknown;
};
let {\\u0061} = obj;
`,
			snapshot: `
declare const obj: {
    a: unknown;
};
let {\\u0061: \\u0061} = obj;
     ~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    a: unknown;
    foo: unknown;
};
let {a, foo: foo} = obj;
`,
			output: `
declare const obj: {
    a: unknown;
    foo: unknown;
};
let {a, foo} = obj;
`,
			snapshot: `
declare const obj: {
    a: unknown;
    foo: unknown;
};
let {a, foo: foo} = obj;
        ~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo: foo, bar: baz} = obj;
`,
			output: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo, bar: baz} = obj;
`,
			snapshot: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo: foo, bar: baz} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {foo: bar, baz: baz} = obj;
`,
			output: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {foo: bar, baz} = obj;
`,
			snapshot: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {foo: bar, baz: baz} = obj;
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo: foo, bar: bar} = obj;
`,
			output: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo, bar} = obj;
`,
			snapshot: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo: foo, bar: bar} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar}} = obj;
`,
			output: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar}} = obj;
`,
			snapshot: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar}} = obj;
           ~~~~~~~~
           Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar}, baz: baz} = obj;
`,
			output: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {foo: {bar}, baz} = obj;
`,
			snapshot: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar}, baz: baz} = obj;
           ~~~~~~~~
           Renaming to the same identifier name is unnecessary.
                      ~~~~~~~~
                      Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: unknown;
};
let {'foo': foo} = obj;
`,
			output: `
declare const obj: {
    foo: unknown;
};
let {foo} = obj;
`,
			snapshot: `
declare const obj: {
    foo: unknown;
};
let {'foo': foo} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {'foo': foo, 'bar': baz} = obj;
`,
			output: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo, 'bar': baz} = obj;
`,
			snapshot: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {'foo': foo, 'bar': baz} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {'foo': bar, 'baz': baz} = obj;
`,
			output: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {'foo': bar, baz} = obj;
`,
			snapshot: `
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {'foo': bar, 'baz': baz} = obj;
                 ~~~~~~~~~~
                 Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {'foo': foo, 'bar': bar} = obj;
`,
			output: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {foo, bar} = obj;
`,
			snapshot: `
declare const obj: {
    bar: unknown;
    foo: unknown;
};
let {'foo': foo, 'bar': bar} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
                 ~~~~~~~~~~
                 Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {'foo': {'bar': bar}} = obj;
`,
			output: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {'foo': {bar}} = obj;
`,
			snapshot: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {'foo': {'bar': bar}} = obj;
             ~~~~~~~~~~
             Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {'foo': {'bar': bar}, 'baz': baz} = obj;
`,
			output: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {'foo': {bar}, baz} = obj;
`,
			snapshot: `
declare const obj: {
    baz: unknown;
    foo: {
        bar: unknown;
    };
};
let {'foo': {'bar': bar}, 'baz': baz} = obj;
             ~~~~~~~~~~
             Renaming to the same identifier name is unnecessary.
                          ~~~~~~~~~~
                          Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    bar: unknown;
    baz: unknown;
    foo: unknown;
};
let {foo: foo = 1, 'bar': bar = 1, baz: baz} = obj;
`,
			output: `
declare const obj: {
    bar: unknown;
    baz: unknown;
    foo: unknown;
};
let {foo = 1, bar = 1, baz} = obj;
`,
			snapshot: `
declare const obj: {
    bar: unknown;
    baz: unknown;
    foo: unknown;
};
let {foo: foo = 1, 'bar': bar = 1, baz: baz} = obj;
     ~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
                   ~~~~~~~~~~~~~~
                   Renaming to the same identifier name is unnecessary.
                                   ~~~~~~~~
                                   Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: {
        bar: unknown;
        baz: unknown;
    };
};
let {foo: {bar: bar = 1, 'baz': baz = 1}} = obj;
`,
			output: `
declare const obj: {
    foo: {
        bar: unknown;
        baz: unknown;
    };
};
let {foo: {bar = 1, baz = 1}} = obj;
`,
			snapshot: `
declare const obj: {
    foo: {
        bar: unknown;
        baz: unknown;
    };
};
let {foo: {bar: bar = 1, 'baz': baz = 1}} = obj;
           ~~~~~~~~~~~~
           Renaming to the same identifier name is unnecessary.
                         ~~~~~~~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar = {}} = {}} = obj;
`,
			output: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar = {}} = {}} = obj;
`,
			snapshot: `
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: bar = {}} = {}} = obj;
           ~~~~~~~~~~~~~
           Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo: unknown;
declare const a: number;
declare const obj: {
    foo: unknown;
};
({foo: (foo) = a} = obj);
`,
			snapshot: `
let foo: unknown;
declare const a: number;
declare const obj: {
    foo: unknown;
};
({foo: (foo) = a} = obj);
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: unknown;
};
declare const a: number;
let {foo: foo = (a)} = obj;
`,
			output: `
declare const obj: {
    foo: unknown;
};
declare const a: number;
let {foo = (a)} = obj;
`,
			snapshot: `
declare const obj: {
    foo: unknown;
};
declare const a: number;
let {foo: foo = (a)} = obj;
     ~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const obj: {
    foo: unknown;
};
declare const b: number;
declare function getA(): number;
let {foo: foo = (getA(), b)} = obj;
`,
			output: `
declare const obj: {
    foo: unknown;
};
declare const b: number;
declare function getA(): number;
let {foo = (getA(), b)} = obj;
`,
			snapshot: `
declare const obj: {
    foo: unknown;
};
declare const b: number;
declare function getA(): number;
let {foo: foo = (getA(), b)} = obj;
     ~~~~~~~~~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo}: { foo: number }) {}
`,
			output: `
function func({foo}: { foo: number }) {}
`,
			snapshot: `
function func({foo: foo}: { foo: number }) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo, bar: baz}: { foo: number; bar: number }) {}
`,
			output: `
function func({foo, bar: baz}: { foo: number; bar: number }) {}
`,
			snapshot: `
function func({foo: foo, bar: baz}: { foo: number; bar: number }) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: bar, baz: baz}: { foo: number; baz: number }) {}
`,
			output: `
function func({foo: bar, baz}: { foo: number; baz: number }) {}
`,
			snapshot: `
function func({foo: bar, baz: baz}: { foo: number; baz: number }) {}
                         ~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo, bar: bar}: { foo: number; bar: number }) {}
`,
			output: `
function func({foo, bar}: { foo: number; bar: number }) {}
`,
			snapshot: `
function func({foo: foo, bar: bar}: { foo: number; bar: number }) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
                         ~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo = 1, 'bar': bar = 1, baz: baz}: { foo?: number; bar?: number; baz: number }) {}
`,
			output: `
function func({foo = 1, bar = 1, baz}: { foo?: number; bar?: number; baz: number }) {}
`,
			snapshot: `
function func({foo: foo = 1, 'bar': bar = 1, baz: baz}: { foo?: number; bar?: number; baz: number }) {}
               ~~~~~~~~~~~~
               Renaming to the same identifier name is unnecessary.
                             ~~~~~~~~~~~~~~
                             Renaming to the same identifier name is unnecessary.
                                             ~~~~~~~~
                                             Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: {bar: bar = 1, 'baz': baz = 1}}: { foo: { bar?: number; baz?: number } }) {}
`,
			output: `
function func({foo: {bar = 1, baz = 1}}: { foo: { bar?: number; baz?: number } }) {}
`,
			snapshot: `
function func({foo: {bar: bar = 1, 'baz': baz = 1}}: { foo: { bar?: number; baz?: number } }) {}
                     ~~~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
                                   ~~~~~~~~~~~~~~
                                   Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: {bar: bar = {}} = {}}: { foo?: { bar?: object } }) {}
`,
			output: `
function func({foo: {bar = {}} = {}}: { foo?: { bar?: object } }) {}
`,
			snapshot: `
function func({foo: {bar: bar = {}} = {}}: { foo?: { bar?: object } }) {}
                     ~~~~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo}: { foo: number }) => {}
`,
			output: `
({foo}: { foo: number }) => {}
`,
			snapshot: `
({foo: foo}: { foo: number }) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo, bar: baz}: { foo: number; bar: number }) => {}
`,
			output: `
({foo, bar: baz}: { foo: number; bar: number }) => {}
`,
			snapshot: `
({foo: foo, bar: baz}: { foo: number; bar: number }) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: bar, baz: baz}: { foo: number; baz: number }) => {}
`,
			output: `
({foo: bar, baz}: { foo: number; baz: number }) => {}
`,
			snapshot: `
({foo: bar, baz: baz}: { foo: number; baz: number }) => {}
            ~~~~~~~~
            Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo, bar: bar}: { foo: number; bar: number }) => {}
`,
			output: `
({foo, bar}: { foo: number; bar: number }) => {}
`,
			snapshot: `
({foo: foo, bar: bar}: { foo: number; bar: number }) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
            ~~~~~~~~
            Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo = 1, 'bar': bar = 1, baz: baz}: { foo?: number; bar?: number; baz: number }) => {}
`,
			output: `
({foo = 1, bar = 1, baz}: { foo?: number; bar?: number; baz: number }) => {}
`,
			snapshot: `
({foo: foo = 1, 'bar': bar = 1, baz: baz}: { foo?: number; bar?: number; baz: number }) => {}
  ~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
                ~~~~~~~~~~~~~~
                Renaming to the same identifier name is unnecessary.
                                ~~~~~~~~
                                Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: {bar: bar = 1, 'baz': baz = 1}}: { foo: { bar?: number; baz?: number } }) => {}
`,
			output: `
({foo: {bar = 1, baz = 1}}: { foo: { bar?: number; baz?: number } }) => {}
`,
			snapshot: `
({foo: {bar: bar = 1, 'baz': baz = 1}}: { foo: { bar?: number; baz?: number } }) => {}
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
                      ~~~~~~~~~~~~~~
                      Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: {bar: bar = {}} = {}}: { foo?: { bar?: object } }) => {}
`,
			output: `
({foo: {bar = {}} = {}}: { foo?: { bar?: object } }) => {}
`,
			snapshot: `
({foo: {bar: bar = {}} = {}}: { foo?: { bar?: object } }) => {}
        ~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const value: {
    foo: unknown;
};
const {foo: foo, ...other} = value;
`,
			output: `
declare const value: {
    foo: unknown;
};
const {foo, ...other} = value;
`,
			snapshot: `
declare const value: {
    foo: unknown;
};
const {foo: foo, ...other} = value;
       ~~~~~~~~
       Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo: foo, bar: baz, ...other} = value;
`,
			output: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo, bar: baz, ...other} = value;
`,
			snapshot: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo: foo, bar: baz, ...other} = value;
       ~~~~~~~~
       Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo: foo, bar: bar, ...other} = value;
`,
			output: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo, bar, ...other} = value;
`,
			snapshot: `
declare const value: {
    bar: unknown;
    foo: unknown;
};
const {foo: foo, bar: bar, ...other} = value;
       ~~~~~~~~
       Renaming to the same identifier name is unnecessary.
                 ~~~~~~~~
                 Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo} from 'foo';
`,
			snapshot: `
import {foo as foo} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {'foo' as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo} from 'foo';
`,
			snapshot: `
import {'foo' as foo} from 'foo';
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {\\u0061 as a} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {a} from 'foo';
`,
			snapshot: `
import {\\u0061 as a} from 'foo';
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {a as \\u0061} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {\\u0061} from 'foo';
`,
			snapshot: `
import {a as \\u0061} from 'foo';
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {\\u0061 as \\u0061} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {\\u0061} from 'foo';
`,
			snapshot: `
import {\\u0061 as \\u0061} from 'foo';
        ~~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as foo, bar as baz} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo, bar as baz} from 'foo';
`,
			snapshot: `
import {foo as foo, bar as baz} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as bar, baz as baz} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo as bar, baz} from 'foo';
`,
			snapshot: `
import {foo as bar, baz as baz} from 'foo';
                    ~~~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as foo, bar as bar} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo, bar} from 'foo';
`,
			snapshot: `
import {foo as foo, bar as bar} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
                    ~~~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0;
export {foo as foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0;
export {foo};
`,
			snapshot: `
var foo = 0;
export {foo as foo};
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0;
export {foo as 'foo'};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0;
export {foo};
`,
			snapshot: `
var foo = 0;
export {foo as 'foo'};
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {foo as 'foo'} from 'bar';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {foo} from 'bar';
`,
			snapshot: `
export {foo as 'foo'} from 'bar';
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {'foo' as foo} from 'bar';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {'foo'} from 'bar';
`,
			snapshot: `
export {'foo' as foo} from 'bar';
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {'foo' as 'foo'} from 'bar';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {'foo'} from 'bar';
`,
			snapshot: `
export {'foo' as 'foo'} from 'bar';
        ~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {' 👍 ' as ' 👍 '} from 'bar';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {' 👍 '} from 'bar';
`,
			snapshot: `
export {' 👍 ' as ' 👍 '} from 'bar';
        ~~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {'' as ''} from 'bar';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {''} from 'bar';
`,
			snapshot: `
export {'' as ''} from 'bar';
        ~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var a = 0;
export {a as \\u0061};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var a = 0;
export {a};
`,
			snapshot: `
var a = 0;
export {a as \\u0061};
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var \\u0061 = 0;
export {\\u0061 as a};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var \\u0061 = 0;
export {\\u0061};
`,
			snapshot: `
var \\u0061 = 0;
export {\\u0061 as a};
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var \\u0061 = 0;
export {\\u0061 as \\u0061};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var \\u0061 = 0;
export {\\u0061};
`,
			snapshot: `
var \\u0061 = 0;
export {\\u0061 as \\u0061};
        ~~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0; var bar = 0;
export {foo as foo, bar as baz};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0; var bar = 0;
export {foo, bar as baz};
`,
			snapshot: `
var foo = 0; var bar = 0;
export {foo as foo, bar as baz};
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0; var baz = 0;
export {foo as bar, baz as baz};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0; var baz = 0;
export {foo as bar, baz};
`,
			snapshot: `
var foo = 0; var baz = 0;
export {foo as bar, baz as baz};
                    ~~~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0; var bar = 0;export {foo as foo, bar as bar};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0; var bar = 0;export {foo, bar};
`,
			snapshot: `
var foo = 0; var bar = 0;export {foo as foo, bar as bar};
                                 ~~~~~~~~~~
                                 Renaming to the same identifier name is unnecessary.
                                             ~~~~~~~~~~
                                             Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {foo as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {foo} from 'foo';
`,
			snapshot: `
export {foo as foo} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {a as \\u0061} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {a} from 'foo';
`,
			snapshot: `
export {a as \\u0061} from 'foo';
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {\\u0061 as a} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {\\u0061} from 'foo';
`,
			snapshot: `
export {\\u0061 as a} from 'foo';
        ~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {\\u0061 as \\u0061} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {\\u0061} from 'foo';
`,
			snapshot: `
export {\\u0061 as \\u0061} from 'foo';
        ~~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {foo as foo, bar as baz} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {foo, bar as baz} from 'foo';
`,
			snapshot: `
export {foo as foo, bar as baz} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
var foo = 0; var bar = 0;
export {foo as bar, baz as baz} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
var foo = 0; var bar = 0;
export {foo as bar, baz} from 'foo';
`,
			snapshot: `
var foo = 0; var bar = 0;
export {foo as bar, baz as baz} from 'foo';
                    ~~~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export {foo as foo, bar as bar} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
export {foo, bar} from 'foo';
`,
			snapshot: `
export {foo as foo, bar as bar} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
                    ~~~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({/* comment */foo: foo} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({/* comment */foo} = obj);
`,
			snapshot: `
({/* comment */foo: foo} = obj);
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({/* comment */foo: foo = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({/* comment */foo = 1} = obj);
`,
			snapshot: `
({/* comment */foo: foo = 1} = obj);
               ~~~~~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo, /* comment */bar: bar} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo, /* comment */bar} = obj);
`,
			snapshot: `
({foo, /* comment */bar: bar} = obj);
                    ~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo/**/ : foo} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo/**/ : foo} = obj);
  ~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo/**/ : foo = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo/**/ : foo = 1} = obj);
  ~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo /**/: foo} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo /**/: foo} = obj);
  ~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo /**/: foo = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo /**/: foo = 1} = obj);
  ~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo://
foo} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo://
  ~~~~~~
  Renaming to the same identifier name is unnecessary.
foo} = obj);
~~~
`,
		},
		{
			code: `
({foo: /**/foo} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: /**/foo} = obj);
  ~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (/**/foo)} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: (/**/foo)} = obj);
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo/**/)} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: (foo/**/)} = obj);
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo //
)} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: (foo //
  ~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
)} = obj);
~
`,
		},
		{
			code: `
({foo: /**/foo = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: /**/foo = 1} = obj);
  ~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (/**/foo) = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: (/**/foo) = 1} = obj);
  ~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo/**/) = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			snapshot: `
({foo: (foo/**/) = 1} = obj);
  ~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo/* comment */} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo/* comment */} = obj);
`,
			snapshot: `
({foo: foo/* comment */} = obj);
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo//comment
,bar} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo//comment
,bar} = obj);
`,
			snapshot: `
({foo: foo//comment
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
,bar} = obj);
`,
		},
		{
			code: `
({foo: foo/* comment */ = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo/* comment */ = 1} = obj);
`,
			snapshot: `
({foo: foo/* comment */ = 1} = obj);
  ~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo // comment
 = 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo // comment
 = 1} = obj);
`,
			snapshot: `
({foo: foo // comment
  ~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
 = 1} = obj);
 ~~~
`,
		},
		{
			code: `
({foo: foo = /* comment */ 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo = /* comment */ 1} = obj);
`,
			snapshot: `
({foo: foo = /* comment */ 1} = obj);
  ~~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo = // comment
 1} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo = // comment
 1} = obj);
`,
			snapshot: `
({foo: foo = // comment
  ~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
 1} = obj);
 ~
`,
		},
		{
			code: `
({foo: foo = (1/* comment */)} = obj);
`,
			files: {
				"global.d.ts": `
declare const obj: {
	bar: unknown;
	foo: unknown;
};
declare let bar: unknown;
declare let foo: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json"
}`,
			},
			output: `
({foo = (1/* comment */)} = obj);
`,
			snapshot: `
({foo: foo = (1/* comment */)} = obj);
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {/* comment */foo as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {/* comment */foo} from 'foo';
`,
			snapshot: `
import {/* comment */foo as foo} from 'foo';
                     ~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo,/* comment */bar as bar} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo,/* comment */bar} from 'foo';
`,
			snapshot: `
import {foo,/* comment */bar as bar} from 'foo';
                         ~~~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo/**/ as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
import {foo/**/ as foo} from 'foo';
        ~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo /**/as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
import {foo /**/as foo} from 'foo';
        ~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo //
as foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
import {foo //
        ~~~~~~
        Renaming to the same identifier name is unnecessary.
as foo} from 'foo';
~~~~~~
`,
		},
		{
			code: `
import {foo as/**/foo} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
import {foo as/**/foo} from 'foo';
        ~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as foo/* comment */} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo/* comment */} from 'foo';
`,
			snapshot: `
import {foo as foo/* comment */} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {foo as foo/* comment */,bar} from 'foo';
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
import {foo/* comment */,bar} from 'foo';
`,
			snapshot: `
import {foo as foo/* comment */,bar} from 'foo';
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo;
export {/* comment */foo as foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
let foo;
export {/* comment */foo};
`,
			snapshot: `
let foo;
export {/* comment */foo as foo};
                     ~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo, bar;
export {foo,/* comment */bar as bar};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
let foo, bar;
export {foo,/* comment */bar};
`,
			snapshot: `
let foo, bar;
export {foo,/* comment */bar as bar};
                         ~~~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo;
export {foo/**/as foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
let foo;
export {foo/**/as foo};
        ~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo;
export {foo as/**/ foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
let foo;
export {foo as/**/ foo};
        ~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo;
export {foo as /**/foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
let foo;
export {foo as /**/foo};
        ~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo;
export {foo as//comment
 foo};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			snapshot: `
let foo;
export {foo as//comment
        ~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
 foo};
 ~~~
`,
		},
		{
			code: `
let foo;
export {foo as foo/* comment*/};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
let foo;
export {foo/* comment*/};
`,
			snapshot: `
let foo;
export {foo as foo/* comment*/};
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo, bar;
export {foo as foo/* comment*/,bar};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
let foo, bar;
export {foo/* comment*/,bar};
`,
			snapshot: `
let foo, bar;
export {foo as foo/* comment*/,bar};
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let foo, bar;
export {foo as foo//comment
,bar};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
let foo, bar;
export {foo//comment
,bar};
`,
			snapshot: `
let foo, bar;
export {foo as foo//comment
        ~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
,bar};
`,
		},
		{
			code: `
function example({ param: param }: { param: number }) {
    return param;
}
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
function example({ param }: { param: number }) {
    return param;
}
`,
			snapshot: `
function example({ param: param }: { param: number }) {
                   ~~~~~~~~~~~~
                   Renaming to the same identifier name is unnecessary.
    return param;
}
`,
		},
		{
			code: `
const type = 0;
export { type as type };
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
			output: `
const type = 0;
export { type };
`,
			snapshot: `
const type = 0;
export { type as type };
         ~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
	],
	valid: [
		`
declare const obj: {
    foo: unknown;
};
let {foo} = obj;
void foo;
`,
		`
declare const obj: {
    foo: unknown;
};
let {foo: bar} = obj;
void bar;
`,
		`
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {foo: bar, baz: qux} = obj;
void bar;
void qux;
`,
		`
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {foo: {bar: baz}} = obj;
void baz;
`,
		`
declare const obj: {
    bar: {
        baz: unknown;
    };
    foo: unknown;
};
let {foo, bar: {baz: qux}} = obj;
void foo;
void qux;
`,
		`
declare const obj: {
    foo: unknown;
};
let {'foo': bar} = obj;
void bar;
`,
		`
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {'foo': bar, 'baz': qux} = obj;
void bar;
void qux;
`,
		`
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {'foo': {'bar': baz}} = obj;
void baz;
`,
		`
declare const obj: {
    bar: {
        baz: unknown;
    };
    foo: unknown;
};
let {foo, 'bar': {'baz': qux}} = obj;
void foo;
void qux;
`,
		`
declare const obj: {
    foo: unknown;
};
let {['foo']: bar} = obj;
void bar;
`,
		`
declare const obj: {
    baz: unknown;
    foo: unknown;
};
let {['foo']: bar, ['baz']: qux} = obj;
void bar;
void qux;
`,
		`
declare const obj: {
    foo: {
        bar: unknown;
    };
};
let {['foo']: {['bar']: baz}} = obj;
void baz;
`,
		`
declare const obj: {
    bar: {
        baz: unknown;
    };
    foo: unknown;
};
let {foo, ['bar']: {['baz']: qux}} = obj;
void foo;
void qux;
`,
		`
declare const obj: {
    foo: unknown;
};
let {['foo']: foo} = obj;
void foo;
`,
		`
declare const obj: {
    [key: string]: unknown;
};
declare const foo: string;
let {[foo]: bar} = obj;
void bar;
`,
		`function func({foo}: { foo: number }) { void foo; }
func({ foo: 1 });
`,
		`function func({foo: bar}: { foo: number }) { void bar; }
func({ foo: 1 });
`,
		`function func({foo: bar, baz: qux}: { foo: number; baz: number }) {
    void bar;
    void qux;
}
func({ baz: 2, foo: 1 });
`,
		`
const func = ({foo}: { foo: number }) => { void foo; };
func({ foo: 1 });
`,
		`
const func = ({foo: bar}: { foo: number }) => { void bar; };
func({ foo: 1 });
`,
		`
const func = ({foo: bar, baz: qui}: { foo: number; baz: number }) => {
    void bar;
    void qui;
};
func({ baz: 2, foo: 1 });
`,
		{
			code: `import * as foo from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `import foo from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `import {foo} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `import {foo as bar} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `import {foo as bar, baz as qux} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `import {'foo' as bar} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {foo} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `var foo = 0;export {foo as bar};`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `
var foo = 0; var baz = 0;
	export {foo as bar, baz as qux};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {foo as bar} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {foo as bar, baz as qux} from 'foo';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `
var foo = 0;
	export {foo as 'bar'};
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {foo as 'bar'} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {'foo' as bar} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {'foo' as 'bar'} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {'' as ' '} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {' ' as ''} from 'baz';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		{
			code: `export {'foo'} from 'bar';`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		`
declare const value: object;
const {...other} = value;
void other;
`,
		`
declare const value: {
    foo: unknown;
};
const {foo, ...other} = value;
void foo;
void other;
`,
		`
declare const value: {
    foo: unknown;
};
const {foo: bar, ...other} = value;
void bar;
void other;
`,
		{
			code: `
const value = 0;
export { value as default };
`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
		`function example({ param }: { param: number }) { return param; }
example({ param: 1 });`,
		{
			code: `export * from "module";`,
			files: {
				"node_modules/bar/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const thumbsUp: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { thumbsUp as " 👍 " };
`,
				"node_modules/baz/index.d.ts": `
declare const empty: unknown;
declare const foo: unknown;
declare const space: unknown;

export { empty as "" };
export { foo };
export { foo as "foo" };
export { space as " " };
`,
				"node_modules/foo/index.d.ts": `
declare const a: unknown;
declare const bar: unknown;
declare const baz: unknown;
declare const defaultExport: unknown;
declare const foo: unknown;

export { a, bar, baz, defaultExport as default, foo };
export { foo as "foo" };
`,
				"node_modules/module/index.d.ts": `
export declare const value: unknown;
`,
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"module": "esnext"
	}
}`,
			},
		},
	],
});
