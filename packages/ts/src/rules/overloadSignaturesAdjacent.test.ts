import rule from "./overloadSignaturesAdjacent.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function foo(s: string): void;
function foo(n: number): void;
function bar(): void {}
function baz(): void {}
function foo(sn: string | number): void {}
`,
			snapshot: `
function foo(s: string): void;
function foo(n: number): void;
function bar(): void {}
function baz(): void {}
function foo(sn: string | number): void {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All foo signatures should be adjacent.
`,
		},
		{
			code: `
function foo(s: string): void;
function foo(n: number): void;
type bar = number;
type baz = number | string;
function foo(sn: string | number): void {}
`,
			snapshot: `
function foo(s: string): void;
function foo(n: number): void;
type bar = number;
type baz = number | string;
function foo(sn: string | number): void {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All foo signatures should be adjacent.
`,
		},
		{
			code: `
declare function foo(s: string): void;
declare function foo(n: number): void;
declare function bar(): void;
declare function baz(): void;
declare function foo(sn: string | number): void;
`,
			snapshot: `
declare function foo(s: string): void;
declare function foo(n: number): void;
declare function bar(): void;
declare function baz(): void;
declare function foo(sn: string | number): void;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All foo signatures should be adjacent.
`,
		},
		{
			code: `
export function foo(s: string): void;
export function foo(n: number): void;
export function bar(): void {}
export function baz(): void {}
export function foo(sn: string | number): void {}
`,
			snapshot: `
export function foo(s: string): void;
export function foo(n: number): void;
export function bar(): void {}
export function baz(): void {}
export function foo(sn: string | number): void {}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All foo signatures should be adjacent.
`,
		},
		{
			code: `
interface Foo {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
}
`,
			snapshot: `
interface Foo {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
interface Foo {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	foo(sn: string | number): void;
	bar(): void;
	baz(): void;
}
`,
			snapshot: `
interface Foo {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
	foo(sn: string | number): void;
	bar(): void;
	baz(): void;
}
`,
		},
		{
			code: `
interface Foo {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
}
`,
			snapshot: `
interface Foo {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
interface Foo {
	foo(s: string): void;
	'foo'(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
}
`,
			snapshot: `
interface Foo {
	foo(s: string): void;
	'foo'(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
interface Foo {
	(s: string): void;
	foo(n: number): void;
	(n: number): void;
	(sn: string | number): void;
	bar(): void;
	baz(): void;
	other(): void;
}
`,
			snapshot: `
interface Foo {
	(s: string): void;
	foo(n: number): void;
	(n: number): void;
	~~~~~~~~~~~~~~~~~~
	All call signatures should be adjacent.
	(sn: string | number): void;
	bar(): void;
	baz(): void;
	other(): void;
}
`,
		},
		{
			code: `
interface Foo {
	new (s: string): Foo;
	new (n: number): Foo;
	foo(): void;
	bar(): void;
	new (sn: string | number): Foo;
}
`,
			snapshot: `
interface Foo {
	new (s: string): Foo;
	new (n: number): Foo;
	foo(): void;
	bar(): void;
	new (sn: string | number): Foo;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All new signatures should be adjacent.
}
`,
		},
		{
			code: `
interface Foo {
	new (s: string): Foo;
	foo(): void;
	new (n: number): Foo;
	bar(): void;
	new (sn: string | number): Foo;
}
`,
			snapshot: `
interface Foo {
	new (s: string): Foo;
	foo(): void;
	new (n: number): Foo;
	~~~~~~~~~~~~~~~~~~~~~
	All new signatures should be adjacent.
	bar(): void;
	new (sn: string | number): Foo;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All new signatures should be adjacent.
}
`,
		},
		{
			code: `
interface Foo {
	foo(): void;
	bar: {
		baz(s: string): void;
		baz(n: number): void;
		foo(): void;
		baz(sn: string | number): void;
	};
}
`,
			snapshot: `
interface Foo {
	foo(): void;
	bar: {
		baz(s: string): void;
		baz(n: number): void;
		foo(): void;
		baz(sn: string | number): void;
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		All baz signatures should be adjacent.
	};
}
`,
		},
		{
			code: `
type Foo = {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
};
`,
			snapshot: `
type Foo = {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
};
`,
		},
		{
			code: `
type Foo = {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
};
`,
			snapshot: `
type Foo = {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void;
	baz(): void;
	foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
};
`,
		},
		{
			code: `
type Foo = {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	foo(sn: string | number): void;
	bar(): void;
	baz(): void;
};
`,
			snapshot: `
type Foo = {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
	foo(sn: string | number): void;
	bar(): void;
	baz(): void;
};
`,
		},
		{
			code: `
class Foo {
	constructor(s: string);
	constructor(n: number);
	bar(): void {}
	baz(): void {}
	constructor(sn: string | number) {}
}
`,
			snapshot: `
class Foo {
	constructor(s: string);
	constructor(n: number);
	bar(): void {}
	baz(): void {}
	constructor(sn: string | number) {}
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All constructor signatures should be adjacent.
}
`,
		},
		{
			code: `
class Foo {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void {}
	baz(): void {}
	foo(sn: string | number): void {}
}
`,
			snapshot: `
class Foo {
	foo(s: string): void;
	foo(n: number): void;
	bar(): void {}
	baz(): void {}
	foo(sn: string | number): void {}
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
class Foo {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void {}
	baz(): void {}
	foo(sn: string | number): void {}
}
`,
			snapshot: `
class Foo {
	foo(s: string): void;
	['foo'](n: number): void;
	bar(): void {}
	baz(): void {}
	foo(sn: string | number): void {}
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
class Foo {
	constructor(s: string);
	name: string;
	constructor(n: number);
	constructor(sn: string | number) {}
	bar(): void {}
	baz(): void {}
}
`,
			snapshot: `
class Foo {
	constructor(s: string);
	name: string;
	constructor(n: number);
	~~~~~~~~~~~~~~~~~~~~~~~
	All constructor signatures should be adjacent.
	constructor(sn: string | number) {}
	bar(): void {}
	baz(): void {}
}
`,
		},
		{
			code: `
class Foo {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	foo(sn: string | number): void {}
	bar(): void {}
	baz(): void {}
}
`,
			snapshot: `
class Foo {
	foo(s: string): void;
	name: string;
	foo(n: number): void;
	~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
	foo(sn: string | number): void {}
	bar(): void {}
	baz(): void {}
}
`,
		},
		{
			code: `
class Foo {
	static foo(s: string): void;
	name: string;
	static foo(n: number): void;
	static foo(sn: string | number): void {}
	bar(): void {}
	baz(): void {}
}
`,
			snapshot: `
class Foo {
	static foo(s: string): void;
	name: string;
	static foo(n: number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All static foo signatures should be adjacent.
	static foo(sn: string | number): void {}
	bar(): void {}
	baz(): void {}
}
`,
		},
		{
			code: `
function wrap() {
	function foo(s: string): void;
	function foo(n: number): void;
	type bar = number;
	function foo(sn: string | number): void {}
}
`,
			snapshot: `
function wrap() {
	function foo(s: string): void;
	function foo(n: number): void;
	type bar = number;
	function foo(sn: string | number): void {}
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
if (true) {
	function foo(s: string): void;
	function foo(n: number): void;
	let a = 1;
	function foo(sn: string | number): void {}
	foo(a);
}
`,
			snapshot: `
if (true) {
	function foo(s: string): void;
	function foo(n: number): void;
	let a = 1;
	function foo(sn: string | number): void {}
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
	foo(a);
}
`,
		},
		{
			code: `
declare module 'Foo' {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function bar(): void;
	export function baz(): void;
	export function foo(sn: string | number): void;
}
`,
			snapshot: `
declare module 'Foo' {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function bar(): void;
	export function baz(): void;
	export function foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
		{
			code: `
declare module 'Foo' {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function foo(sn: string | number): void;
	function baz(s: string): void;
	export function bar(): void;
	function baz(n: number): void;
	function baz(sn: string | number): void;
}
`,
			snapshot: `
declare module 'Foo' {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function foo(sn: string | number): void;
	function baz(s: string): void;
	export function bar(): void;
	function baz(n: number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All baz signatures should be adjacent.
	function baz(sn: string | number): void;
}
`,
		},
		{
			code: `
declare namespace Foo {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function bar(): void;
	export function baz(): void;
	export function foo(sn: string | number): void;
}
`,
			snapshot: `
declare namespace Foo {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function bar(): void;
	export function baz(): void;
	export function foo(sn: string | number): void;
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	All foo signatures should be adjacent.
}
`,
		},
	],
	valid: [
		`
function foo(s: string): void;
function foo(n: number): void;
function foo(sn: string | number): void {}
`,
		`
export function foo(s: string): void;
export function foo(n: number): void;
export function foo(sn: string | number): void {}
export function bar(): void {}
export function baz(): void {}
`,
		`
function error(a: string): void;
function error(b: number): void;
function error(ab: string | number): void {}
export { error };
`,
		`
function foo(): void {}
function bar(): void {}
function baz(): void {}
`,
		`
function foo(s: string): void;
function foo(n: number): void;
function foo(sn: string | number): void {}

function bar(s: string): void;
function bar(n: number): void;
function bar(sn: string | number): void {}
`,
		`
interface Foo {
	foo(s: string): void;
	foo(n: number): void;
	foo(sn: string | number): void;
}
`,
		`
interface Foo {
	(s: string): void;
	(n: number): void;
	(sn: string | number): void;
	foo(): void;
}
`,
		`
interface Foo {
	new (s: string): Foo;
	new (n: number): Foo;
	new (sn: string | number): Foo;
	foo(): void;
}
`,
		`
type Foo = {
	foo(s: string): void;
	foo(n: number): void;
	foo(sn: string | number): void;
};
`,
		`
class Foo {
	constructor(s: string);
	constructor(n: number);
	constructor(sn: string | number) {}
}
`,
		`
class Foo {
	foo(s: string): void;
	foo(n: number): void;
	foo(sn: string | number): void {}
}
`,
		`
class Foo {
	static foo(s: string): void;
	static foo(n: number): void;
	static foo(sn: string | number): void {}
	foo(s: string): void;
	foo(n: number): void;
	foo(sn: string | number): void {}
}
`,
		`
export class Foo {}
export class Bar {}
export type FooBar = Foo | Bar;
`,
		`
export interface Foo {}
export class Foo {}
export class Bar {}
export type FooBar = Foo | Bar;
`,
		`
export const foo = 'a', bar = 'b';
export interface Foo {}
export class Foo {}
`,
		`
export interface Foo {}
export const foo = 'a', bar = 'b';
export class Foo {}
`,
		`
const foo = 'a', bar = 'b';
interface Foo {}
class Foo {}
`,
		`
import { connect } from 'react-redux';
export interface ErrorMessageModel {
	message: string;
}
function mapStateToProps() {}
function mapDispatchToProps() {}
export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage);
`,
		`
function wrap() {
	function foo(s: string): void;
	function foo(n: number): void;
	function foo(sn: string | number): void {}
}
`,
		`
if (true) {
	function foo(s: string): void;
	function foo(n: number): void;
	function foo(sn: string | number): void {}
}
`,
		`
declare module 'Foo' {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function foo(sn: string | number): void;
}
`,
		`
declare namespace Foo {
	export function foo(s: string): void;
	export function foo(n: number): void;
	export function foo(sn: string | number): void;
}
`,
	],
});
