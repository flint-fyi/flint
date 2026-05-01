import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryRenames.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let {foo: foo} = obj;
`,
			output: `
let {foo} = obj;
`,
			snapshot: `
let {foo: foo} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo)} = obj);
`,
			output: `
({foo} = obj);
`,
			snapshot: `
({foo: (foo)} = obj);
  ~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {\\u0061: a} = obj;
`,
			output: `
let {a} = obj;
`,
			snapshot: `
let {\\u0061: a} = obj;
     ~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {a: \\u0061} = obj;
`,
			output: `
let {\\u0061} = obj;
`,
			snapshot: `
let {a: \\u0061} = obj;
     ~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {\\u0061: \\u0061} = obj;
`,
			output: `
let {\\u0061} = obj;
`,
			snapshot: `
let {\\u0061: \\u0061} = obj;
     ~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {a, foo: foo} = obj;
`,
			output: `
let {a, foo} = obj;
`,
			snapshot: `
let {a, foo: foo} = obj;
        ~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: foo, bar: baz} = obj;
`,
			output: `
let {foo, bar: baz} = obj;
`,
			snapshot: `
let {foo: foo, bar: baz} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: bar, baz: baz} = obj;
`,
			output: `
let {foo: bar, baz} = obj;
`,
			snapshot: `
let {foo: bar, baz: baz} = obj;
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: foo, bar: bar} = obj;
`,
			output: `
let {foo, bar} = obj;
`,
			snapshot: `
let {foo: foo, bar: bar} = obj;
     ~~~~~~~~
     Renaming to the same identifier name is unnecessary.
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: {bar: bar}} = obj;
`,
			output: `
let {foo: {bar}} = obj;
`,
			snapshot: `
let {foo: {bar: bar}} = obj;
           ~~~~~~~~
           Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: {bar: bar}, baz: baz} = obj;
`,
			output: `
let {foo: {bar}, baz} = obj;
`,
			snapshot: `
let {foo: {bar: bar}, baz: baz} = obj;
           ~~~~~~~~
           Renaming to the same identifier name is unnecessary.
                      ~~~~~~~~
                      Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': foo} = obj;
`,
			output: `
let {foo} = obj;
`,
			snapshot: `
let {'foo': foo} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': foo, 'bar': baz} = obj;
`,
			output: `
let {foo, 'bar': baz} = obj;
`,
			snapshot: `
let {'foo': foo, 'bar': baz} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': bar, 'baz': baz} = obj;
`,
			output: `
let {'foo': bar, baz} = obj;
`,
			snapshot: `
let {'foo': bar, 'baz': baz} = obj;
                 ~~~~~~~~~~
                 Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': foo, 'bar': bar} = obj;
`,
			output: `
let {foo, bar} = obj;
`,
			snapshot: `
let {'foo': foo, 'bar': bar} = obj;
     ~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
                 ~~~~~~~~~~
                 Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': {'bar': bar}} = obj;
`,
			output: `
let {'foo': {bar}} = obj;
`,
			snapshot: `
let {'foo': {'bar': bar}} = obj;
             ~~~~~~~~~~
             Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {'foo': {'bar': bar}, 'baz': baz} = obj;
`,
			output: `
let {'foo': {bar}, baz} = obj;
`,
			snapshot: `
let {'foo': {'bar': bar}, 'baz': baz} = obj;
             ~~~~~~~~~~
             Renaming to the same identifier name is unnecessary.
                          ~~~~~~~~~~
                          Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: foo = 1, 'bar': bar = 1, baz: baz} = obj;
`,
			output: `
let {foo = 1, bar = 1, baz} = obj;
`,
			snapshot: `
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
let {foo: {bar: bar = 1, 'baz': baz = 1}} = obj;
`,
			output: `
let {foo: {bar = 1, baz = 1}} = obj;
`,
			snapshot: `
let {foo: {bar: bar = 1, 'baz': baz = 1}} = obj;
           ~~~~~~~~~~~~
           Renaming to the same identifier name is unnecessary.
                         ~~~~~~~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: {bar: bar = {}} = {}} = obj;
`,
			output: `
let {foo: {bar = {}} = {}} = obj;
`,
			snapshot: `
let {foo: {bar: bar = {}} = {}} = obj;
           ~~~~~~~~~~~~~
           Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo) = a} = obj);
`,
			snapshot: `
({foo: (foo) = a} = obj);
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: foo = (a)} = obj;
`,
			output: `
let {foo = (a)} = obj;
`,
			snapshot: `
let {foo: foo = (a)} = obj;
     ~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
let {foo: foo = (a, b)} = obj;
`,
			output: `
let {foo = (a, b)} = obj;
`,
			snapshot: `
let {foo: foo = (a, b)} = obj;
     ~~~~~~~~~~~~~~~~~
     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo}) {}
`,
			output: `
function func({foo}) {}
`,
			snapshot: `
function func({foo: foo}) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo, bar: baz}) {}
`,
			output: `
function func({foo, bar: baz}) {}
`,
			snapshot: `
function func({foo: foo, bar: baz}) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: bar, baz: baz}) {}
`,
			output: `
function func({foo: bar, baz}) {}
`,
			snapshot: `
function func({foo: bar, baz: baz}) {}
                         ~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo, bar: bar}) {}
`,
			output: `
function func({foo, bar}) {}
`,
			snapshot: `
function func({foo: foo, bar: bar}) {}
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
                         ~~~~~~~~
                         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: foo = 1, 'bar': bar = 1, baz: baz}) {}
`,
			output: `
function func({foo = 1, bar = 1, baz}) {}
`,
			snapshot: `
function func({foo: foo = 1, 'bar': bar = 1, baz: baz}) {}
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
function func({foo: {bar: bar = 1, 'baz': baz = 1}}) {}
`,
			output: `
function func({foo: {bar = 1, baz = 1}}) {}
`,
			snapshot: `
function func({foo: {bar: bar = 1, 'baz': baz = 1}}) {}
                     ~~~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
                                   ~~~~~~~~~~~~~~
                                   Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function func({foo: {bar: bar = {}} = {}}) {}
`,
			output: `
function func({foo: {bar = {}} = {}}) {}
`,
			snapshot: `
function func({foo: {bar: bar = {}} = {}}) {}
                     ~~~~~~~~~~~~~
                     Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo}) => {}
`,
			output: `
({foo}) => {}
`,
			snapshot: `
({foo: foo}) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo, bar: baz}) => {}
`,
			output: `
({foo, bar: baz}) => {}
`,
			snapshot: `
({foo: foo, bar: baz}) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: bar, baz: baz}) => {}
`,
			output: `
({foo: bar, baz}) => {}
`,
			snapshot: `
({foo: bar, baz: baz}) => {}
            ~~~~~~~~
            Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo, bar: bar}) => {}
`,
			output: `
({foo, bar}) => {}
`,
			snapshot: `
({foo: foo, bar: bar}) => {}
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
            ~~~~~~~~
            Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo = 1, 'bar': bar = 1, baz: baz}) => {}
`,
			output: `
({foo = 1, bar = 1, baz}) => {}
`,
			snapshot: `
({foo: foo = 1, 'bar': bar = 1, baz: baz}) => {}
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
({foo: {bar: bar = 1, 'baz': baz = 1}}) => {}
`,
			output: `
({foo: {bar = 1, baz = 1}}) => {}
`,
			snapshot: `
({foo: {bar: bar = 1, 'baz': baz = 1}}) => {}
        ~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
                      ~~~~~~~~~~~~~~
                      Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: {bar: bar = {}} = {}}) => {}
`,
			output: `
({foo: {bar = {}} = {}}) => {}
`,
			snapshot: `
({foo: {bar: bar = {}} = {}}) => {}
        ~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
const {foo: foo, ...other} = value;
`,
			output: `
const {foo, ...other} = value;
`,
			snapshot: `
const {foo: foo, ...other} = value;
       ~~~~~~~~
       Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
const {foo: foo, bar: baz, ...other} = value;
`,
			output: `
const {foo, bar: baz, ...other} = value;
`,
			snapshot: `
const {foo: foo, bar: baz, ...other} = value;
       ~~~~~~~~
       Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
const {foo: foo, bar: bar, ...other} = value;
`,
			output: `
const {foo, bar, ...other} = value;
`,
			snapshot: `
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
({/* comment */foo: foo} = {});
`,
			output: `
({/* comment */foo} = {});
`,
			snapshot: `
({/* comment */foo: foo} = {});
               ~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({/* comment */foo: foo = 1} = {});
`,
			output: `
({/* comment */foo = 1} = {});
`,
			snapshot: `
({/* comment */foo: foo = 1} = {});
               ~~~~~~~~~~~~
               Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo, /* comment */bar: bar} = {});
`,
			output: `
({foo, /* comment */bar} = {});
`,
			snapshot: `
({foo, /* comment */bar: bar} = {});
                    ~~~~~~~~
                    Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo/**/ : foo} = {});
`,
			snapshot: `
({foo/**/ : foo} = {});
  ~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo/**/ : foo = 1} = {});
`,
			snapshot: `
({foo/**/ : foo = 1} = {});
  ~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo /**/: foo} = {});
`,
			snapshot: `
({foo /**/: foo} = {});
  ~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo /**/: foo = 1} = {});
`,
			snapshot: `
({foo /**/: foo = 1} = {});
  ~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo://
foo} = {});
`,
			snapshot: `
({foo://
  ~~~~~~
  Renaming to the same identifier name is unnecessary.
foo} = {});
~~~
`,
		},
		{
			code: `
({foo: /**/foo} = {});
`,
			snapshot: `
({foo: /**/foo} = {});
  ~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (/**/foo)} = {});
`,
			snapshot: `
({foo: (/**/foo)} = {});
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo/**/)} = {});
`,
			snapshot: `
({foo: (foo/**/)} = {});
  ~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo //
)} = {});
`,
			snapshot: `
({foo: (foo //
  ~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
)} = {});
~
`,
		},
		{
			code: `
({foo: /**/foo = 1} = {});
`,
			snapshot: `
({foo: /**/foo = 1} = {});
  ~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (/**/foo) = 1} = {});
`,
			snapshot: `
({foo: (/**/foo) = 1} = {});
  ~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: (foo/**/) = 1} = {});
`,
			snapshot: `
({foo: (foo/**/) = 1} = {});
  ~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo/* comment */} = {});
`,
			output: `
({foo/* comment */} = {});
`,
			snapshot: `
({foo: foo/* comment */} = {});
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo//comment
,bar} = {});
`,
			output: `
({foo//comment
,bar} = {});
`,
			snapshot: `
({foo: foo//comment
  ~~~~~~~~
  Renaming to the same identifier name is unnecessary.
,bar} = {});
`,
		},
		{
			code: `
({foo: foo/* comment */ = 1} = {});
`,
			output: `
({foo/* comment */ = 1} = {});
`,
			snapshot: `
({foo: foo/* comment */ = 1} = {});
  ~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo // comment
 = 1} = {});
`,
			output: `
({foo // comment
 = 1} = {});
`,
			snapshot: `
({foo: foo // comment
  ~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
 = 1} = {});
 ~~~
`,
		},
		{
			code: `
({foo: foo = /* comment */ 1} = {});
`,
			output: `
({foo = /* comment */ 1} = {});
`,
			snapshot: `
({foo: foo = /* comment */ 1} = {});
  ~~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
({foo: foo = // comment
 1} = {});
`,
			output: `
({foo = // comment
 1} = {});
`,
			snapshot: `
({foo: foo = // comment
  ~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
 1} = {});
 ~
`,
		},
		{
			code: `
({foo: foo = (1/* comment */)} = {});
`,
			output: `
({foo = (1/* comment */)} = {});
`,
			snapshot: `
({foo: foo = (1/* comment */)} = {});
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import {/* comment */foo as foo} from 'foo';
`,
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
export { default as default };
`,
			output: `
export { default };
`,
			snapshot: `
export { default as default };
         ~~~~~~~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function example({ param: param }: { param: number }) {
    return param;
}
`,
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
export { type as type };
`,
			output: `
export { type };
`,
			snapshot: `
export { type as type };
         ~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
	],
	valid: [
		`let {foo} = obj;`,
		`let {foo: bar} = obj;`,
		`let {foo: bar, baz: qux} = obj;`,
		`let {foo: {bar: baz}} = obj;`,
		`let {foo, bar: {baz: qux}} = obj;`,
		`let {'foo': bar} = obj;`,
		`let {'foo': bar, 'baz': qux} = obj;`,
		`let {'foo': {'bar': baz}} = obj;`,
		`let {foo, 'bar': {'baz': qux}} = obj;`,
		`let {['foo']: bar} = obj;`,
		`let {['foo']: bar, ['baz']: qux} = obj;`,
		`let {['foo']: {['bar']: baz}} = obj;`,
		`let {foo, ['bar']: {['baz']: qux}} = obj;`,
		`let {[foo]: foo} = obj;`,
		`let {['foo']: foo} = obj;`,
		`let {[foo]: bar} = obj;`,
		`function func({foo}) {}
`,
		`function func({foo: bar}) {}
`,
		`function func({foo: bar, baz: qux}) {}
`,
		`
({foo}) => {}
`,
		`
({foo: bar}) => {}
`,
		`
({foo: bar, baz: qui}) => {}
`,
		`import * as foo from 'foo';`,
		`import foo from 'foo';`,
		`import {foo} from 'foo';`,
		`import {foo as bar} from 'foo';`,
		`import {foo as bar, baz as qux} from 'foo';`,
		`import {'foo' as bar} from 'baz';`,
		`export {foo} from 'foo';`,
		`var foo = 0;export {foo as bar};`,
		`var foo = 0; var baz = 0;
	export {foo as bar, baz as qux};`,
		`export {foo as bar} from 'foo';`,
		`export {foo as bar, baz as qux} from 'foo';`,
		`var foo = 0;
	export {foo as 'bar'};`,
		`export {foo as 'bar'} from 'baz';`,
		`export {'foo' as bar} from 'baz';`,
		`export {'foo' as 'bar'} from 'baz';`,
		`export {'' as ' '} from 'baz';`,
		`export {' ' as ''} from 'baz';`,
		`export {'foo'} from 'bar';`,
		`const {...other} = value;`,
		`const {foo, ...other} = value;`,
		`const {foo: bar, ...other} = value;`,
		`export { default };`,
		`export { value as default };`,
		`function example({ param }: { param: number }) { return param; }`,
		`export * from "module";
`,
	],
});
