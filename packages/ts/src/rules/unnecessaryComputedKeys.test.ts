import rule from "./unnecessaryComputedKeys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
({ ['0']: 0 })
`,
			output: `
({ '0': 0 })
`,
			snapshot: `
({ ['0']: 0 })
   ~~~~~
   This computed key is the literal '0', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
const { ['0']: first } = source;
`,
			output: `
const { '0': first } = source;
`,
			snapshot: `
const { ['0']: first } = source;
        ~~~~~
        This computed key is the literal '0', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['0+1,234']: 0 })
`,
			output: `
({ '0+1,234': 0 })
`,
			snapshot: `
({ ['0+1,234']: 0 })
   ~~~~~~~~~~~
   This computed key is the literal '0+1,234', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ [0]: 0 })
`,
			output: `
({ 0: 0 })
`,
			snapshot: `
({ [0]: 0 })
   ~~~
   This computed key is the literal 0, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
const { [0]: first } = source;
`,
			output: `
const { 0: first } = source;
`,
			snapshot: `
const { [0]: first } = source;
        ~~~
        This computed key is the literal 0, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['x']: 0 })
`,
			output: `
({ 'x': 0 })
`,
			snapshot: `
({ ['x']: 0 })
   ~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
const { ['x']: renamed } = source;
`,
			output: `
const { 'x': renamed } = source;
`,
			snapshot: `
const { ['x']: renamed } = source;
        ~~~~~
        This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
const { ['__proto__']: proto } = source;
`,
			output: `
const { '__proto__': proto } = source;
`,
			snapshot: `
const { ['__proto__']: proto } = source;
        ~~~~~~~~~~~~~
        This computed key is the literal '__proto__', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['x']() {} })
`,
			output: `
({ 'x'() {} })
`,
			snapshot: `
({ ['x']() {} })
   ~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['x']() {} })
`,
			options: { enforceForClassMembers: false },
			output: `
({ 'x'() {} })
`,
			snapshot: `
({ ['x']() {} })
   ~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ [/* this comment prevents a fix */ 'x']: 0 })
`,
			snapshot: `
({ [/* this comment prevents a fix */ 'x']: 0 })
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['x' /* this comment also prevents a fix */]: 0 })
`,
			snapshot: `
({ ['x' /* this comment also prevents a fix */]: 0 })
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ [('x')]: 0 })
`,
			output: `
({ 'x': 0 })
`,
			snapshot: `
({ [('x')]: 0 })
   ~~~~~~~
   This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
const { [('x')]: renamed } = source;
`,
			output: `
const { 'x': renamed } = source;
`,
			snapshot: `
const { [('x')]: renamed } = source;
        ~~~~~~~
        This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ *['x']() {} })
`,
			output: `
({ *'x'() {} })
`,
			snapshot: `
({ *['x']() {} })
    ~~~~~
    This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ async ['x']() {} })
`,
			output: `
({ async 'x'() {} })
`,
			snapshot: `
({ async ['x']() {} })
         ~~~~~
         This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ get[.2]() {} })
`,
			output: `
({ get.2() {} })
`,
			snapshot: `
({ get[.2]() {} })
      ~~~~
      This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ set[.2](value) {} })
`,
			output: `
({ set.2(value) {} })
`,
			snapshot: `
({ set[.2](value) {} })
      ~~~~
      This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ async[.2]() {} })
`,
			output: `
({ async.2() {} })
`,
			snapshot: `
({ async[.2]() {} })
        ~~~~
        This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ [2]() {} })
`,
			output: `
({ 2() {} })
`,
			snapshot: `
({ [2]() {} })
   ~~~
   This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ get [2]() {} })
`,
			output: `
({ get 2() {} })
`,
			snapshot: `
({ get [2]() {} })
       ~~~
       This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ set [2](value) {} })
`,
			output: `
({ set 2(value) {} })
`,
			snapshot: `
({ set [2](value) {} })
       ~~~
       This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ async [2]() {} })
`,
			output: `
({ async 2() {} })
`,
			snapshot: `
({ async [2]() {} })
         ~~~
         This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ get[2]() {} })
`,
			output: `
({ get 2() {} })
`,
			snapshot: `
({ get[2]() {} })
      ~~~
      This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ set[2](value) {} })
`,
			output: `
({ set 2(value) {} })
`,
			snapshot: `
({ set[2](value) {} })
      ~~~
      This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ async[2]() {} })
`,
			output: `
({ async 2() {} })
`,
			snapshot: `
({ async[2]() {} })
        ~~~
        This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ get['name']() {} })
`,
			output: `
({ get'name'() {} })
`,
			snapshot: `
({ get['name']() {} })
      ~~~~~~~~
      This computed key is the literal 'name', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ *[2]() {} })
`,
			output: `
({ *2() {} })
`,
			snapshot: `
({ *[2]() {} })
    ~~~
    This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ async*[2]() {} })
`,
			output: `
({ async*2() {} })
`,
			snapshot: `
({ async*[2]() {} })
         ~~~
         This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['constructor']: 1 })
`,
			output: `
({ 'constructor': 1 })
`,
			snapshot: `
({ ['constructor']: 1 })
   ~~~~~~~~~~~~~~~
   This computed key is the literal 'constructor', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
({ ['prototype']: 1 })
`,
			output: `
({ 'prototype': 1 })
`,
			snapshot: `
({ ['prototype']: 1 })
   ~~~~~~~~~~~~~
   This computed key is the literal 'prototype', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['0']() {} }
`,
			options: { enforceForClassMembers: true },
			output: `
class Example { '0'() {} }
`,
			snapshot: `
class Example { ['0']() {} }
                ~~~~~
                This computed key is the literal '0', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['0+1,234']() {} }
`,
			options: {},
			output: `
class Example { '0+1,234'() {} }
`,
			snapshot: `
class Example { ['0+1,234']() {} }
                ~~~~~~~~~~~
                This computed key is the literal '0+1,234', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['x']() {} }
`,
			output: `
class Example { 'x'() {} }
`,
			snapshot: `
class Example { ['x']() {} }
                ~~~~~
                This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { [/* this comment prevents a fix */ 'x']() {} }
`,
			snapshot: `
class Example { [/* this comment prevents a fix */ 'x']() {} }
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['x' /* this comment also prevents a fix */]() {} }
`,
			snapshot: `
class Example { ['x' /* this comment also prevents a fix */]() {} }
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { [('x')]() {} }
`,
			output: `
class Example { 'x'() {} }
`,
			snapshot: `
class Example { [('x')]() {} }
                ~~~~~~~
                This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { *['x']() {} }
`,
			output: `
class Example { *'x'() {} }
`,
			snapshot: `
class Example { *['x']() {} }
                 ~~~~~
                 This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { async ['x']() {} }
`,
			output: `
class Example { async 'x'() {} }
`,
			snapshot: `
class Example { async ['x']() {} }
                      ~~~~~
                      This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { get[.2]() {} }
`,
			output: `
class Example { get.2() {} }
`,
			snapshot: `
class Example { get[.2]() {} }
                   ~~~~
                   This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { set[.2](value) {} }
`,
			output: `
class Example { set.2(value) {} }
`,
			snapshot: `
class Example { set[.2](value) {} }
                   ~~~~
                   This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { async[.2]() {} }
`,
			output: `
class Example { async.2() {} }
`,
			snapshot: `
class Example { async[.2]() {} }
                     ~~~~
                     This computed key is the literal .2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { [2]() {} }
`,
			output: `
class Example { 2() {} }
`,
			snapshot: `
class Example { [2]() {} }
                ~~~
                This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { get [2]() {} }
`,
			output: `
class Example { get 2() {} }
`,
			snapshot: `
class Example { get [2]() {} }
                    ~~~
                    This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { set [2](value) {} }
`,
			output: `
class Example { set 2(value) {} }
`,
			snapshot: `
class Example { set [2](value) {} }
                    ~~~
                    This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { async [2]() {} }
`,
			output: `
class Example { async 2() {} }
`,
			snapshot: `
class Example { async [2]() {} }
                      ~~~
                      This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { get[2]() {} }
`,
			output: `
class Example { get 2() {} }
`,
			snapshot: `
class Example { get[2]() {} }
                   ~~~
                   This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { set[2](value) {} }
`,
			output: `
class Example { set 2(value) {} }
`,
			snapshot: `
class Example { set[2](value) {} }
                   ~~~
                   This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { async[2]() {} }
`,
			output: `
class Example { async 2() {} }
`,
			snapshot: `
class Example { async[2]() {} }
                     ~~~
                     This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { get['name']() {} }
`,
			output: `
class Example { get'name'() {} }
`,
			snapshot: `
class Example { get['name']() {} }
                   ~~~~~~~~
                   This computed key is the literal 'name', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { *[2]() {} }
`,
			output: `
class Example { *2() {} }
`,
			snapshot: `
class Example { *[2]() {} }
                 ~~~
                 This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { async*[2]() {} }
`,
			output: `
class Example { async*2() {} }
`,
			snapshot: `
class Example { async*[2]() {} }
                      ~~~
                      This computed key is the literal 2, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { static ['constructor']() {} }
`,
			output: `
class Example { static 'constructor'() {} }
`,
			snapshot: `
class Example { static ['constructor']() {} }
                       ~~~~~~~~~~~~~~~
                       This computed key is the literal 'constructor', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['prototype']() {} }
`,
			output: `
class Example { 'prototype'() {} }
`,
			snapshot: `
class Example { ['prototype']() {} }
                ~~~~~~~~~~~~~
                This computed key is the literal 'prototype', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { ['x']() {} })
`,
			output: `
(class { 'x'() {} })
`,
			snapshot: `
(class { ['x']() {} })
         ~~~~~
         This computed key is the literal 'x', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { ['__proto__']() {} })
`,
			output: `
(class { '__proto__'() {} })
`,
			snapshot: `
(class { ['__proto__']() {} })
         ~~~~~~~~~~~~~
         This computed key is the literal '__proto__', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { static ['__proto__']() {} })
`,
			output: `
(class { static '__proto__'() {} })
`,
			snapshot: `
(class { static ['__proto__']() {} })
                ~~~~~~~~~~~~~
                This computed key is the literal '__proto__', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { static ['constructor']() {} })
`,
			output: `
(class { static 'constructor'() {} })
`,
			snapshot: `
(class { static ['constructor']() {} })
                ~~~~~~~~~~~~~~~
                This computed key is the literal 'constructor', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { ['prototype']() {} })
`,
			output: `
(class { 'prototype'() {} })
`,
			snapshot: `
(class { ['prototype']() {} })
         ~~~~~~~~~~~~~
         This computed key is the literal 'prototype', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['0'] }
`,
			output: `
class Example { '0' }
`,
			snapshot: `
class Example { ['0'] }
                ~~~~~
                This computed key is the literal '0', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['0'] = 0 }
`,
			output: `
class Example { '0' = 0 }
`,
			snapshot: `
class Example { ['0'] = 0 }
                ~~~~~
                This computed key is the literal '0', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { static[0] }
`,
			output: `
class Example { static 0 }
`,
			snapshot: `
class Example { static[0] }
                      ~~~
                      This computed key is the literal 0, so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { ['#hidden'] }
`,
			output: `
class Example { '#hidden' }
`,
			snapshot: `
class Example { ['#hidden'] }
                ~~~~~~~~~~~
                This computed key is the literal '#hidden', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
class Example { accessor ['count'] = 0 }
`,
			output: `
class Example { accessor 'count' = 0 }
`,
			snapshot: `
class Example { accessor ['count'] = 0 }
                         ~~~~~~~~~
                         This computed key is the literal 'count', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { ['__proto__'] })
`,
			output: `
(class { '__proto__' })
`,
			snapshot: `
(class { ['__proto__'] })
         ~~~~~~~~~~~~~
         This computed key is the literal '__proto__', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { static ['__proto__'] })
`,
			output: `
(class { static '__proto__' })
`,
			snapshot: `
(class { static ['__proto__'] })
                ~~~~~~~~~~~~~
                This computed key is the literal '__proto__', so its wrapping brackets serve no purpose.
`,
		},
		{
			code: `
(class { ['prototype'] })
`,
			output: `
(class { 'prototype' })
`,
			snapshot: `
(class { ['prototype'] })
         ~~~~~~~~~~~~~
         This computed key is the literal 'prototype', so its wrapping brackets serve no purpose.
`,
		},
	],
	valid: [
		`({ 'first': 0, second() {} })`,
		`({ [key]: 0 });`,
		`({ count: 0, [key]() {} })`,
		`({ ['__proto__']: [] })`,
		`({ ['__proto__']() {} })`,
		`({ get ['__proto__']() { return 0; } })`,
		"({ [`name`]: 0 })",
		`({ [-1]: 0 })`,
		`({ [99999999999999999n]: 0 })`,
		`const { 'first': value } = source;`,
		`const { [key]: value } = source;`,
		`const { value } = source;`,
		`const { count: count } = source;`,
		`const { count: renamed } = source;`,
		{
			code: `class Example { method() {} }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { 'method'() {} }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { [key]() {} }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { ['constructor']() {} }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { static ['prototype']() {} }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `(class { 'method'() {} })`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `(class { [key]() {} })`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `(class { ['constructor']() {} })`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `(class { static ['prototype']() {} })`,
			options: { enforceForClassMembers: true },
		},
		`class Example { 'method'() {} }`,
		`(class { [key]() {} })`,
		`class Example { static constructor() {} }`,
		`class Example { prototype() {} }`,
		`class Example { get ['constructor']() { return 0; } }`,
		`class Example { static get ['prototype']() { return 0; } }`,
		`interface Shape { get ['area'](): number; }`,
		{
			code: `class Example { ['method']() {} }`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `(class { ['method']() {} })`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `class Example { static ['constructor']() {} }`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `class Example { ['prototype']() {} }`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `class Example { ['count'] = 0 }`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `class Example { get ['value']() { return 0; } }`,
			options: { enforceForClassMembers: false },
		},
		{
			code: `class Example { count = 0 }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { ['constructor'] = 0 }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { static ['constructor'] = 0 }`,
			options: { enforceForClassMembers: true },
		},
		{
			code: `class Example { static ['prototype'] = 0 }`,
			options: { enforceForClassMembers: true },
		},
	],
});
