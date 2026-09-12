import rule from "./restrictedTypes.ts";
import { ruleTester } from "./ruleTester.ts";

const restrictedFile = {
	restrictions: [
		{
			specifier: {
				from: "file" as const,
				name: "Restricted",
				path: "./restricted.ts",
			},
		},
	],
};

const restrictedFiles = {
	"restricted.ts": `
export interface Restricted {}
export class RestrictedBase {}
export const restrictedValue = 1;
export namespace Space { export interface Restricted {} }
`,
};

const restrictedPackageFiles = {
	"legacy-package.d.ts": `
declare module "legacy-package" {
    export interface Dangerous {}
    export const dangerousValue: number;
}
`,
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import type { Restricted } from "./restricted";
type Result = Restricted;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
import type { Restricted } from "./restricted";
type Result = Restricted;
              ~~~~~~~~~~
              Type reference 'Restricted' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type { Restricted as Local } from "./restricted";
type Result = Local;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
import type { Restricted as Local } from "./restricted";
type Result = Local;
              ~~~~~
              Type reference 'Local' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type * as Types from "./restricted";
type Result = Types.Restricted;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
import type * as Types from "./restricted";
type Result = Types.Restricted;
              ~~~~~~~~~~~~~~~~
              Type reference 'Types.Restricted' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type { Restricted } from "./restricted";
type Result = Restricted<Array<Restricted>>;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
import type { Restricted } from "./restricted";
type Result = Restricted<Array<Restricted>>;
              ~~~~~~~~~~
              Type reference 'Restricted' resolves to a restricted declaration.
                               ~~~~~~~~~~
                               Type reference 'Restricted' resolves to a restricted declaration.
`,
		},
		{
			code: `
import { RestrictedBase } from "./restricted";
import type { Restricted } from "./restricted";
class Derived extends RestrictedBase implements Restricted {}
interface Extended extends RestrictedBase {}
`,
			files: restrictedFiles,
			options: {
				restrictions: [
					{ specifier: { from: "file", path: "./restricted.ts" } },
				],
			},
			snapshot: `
import { RestrictedBase } from "./restricted";
import type { Restricted } from "./restricted";
class Derived extends RestrictedBase implements Restricted {}
                      ~~~~~~~~~~~~~~
                      Type reference 'RestrictedBase' resolves to a restricted declaration.
                                                ~~~~~~~~~~
                                                Type reference 'Restricted' resolves to a restricted declaration.
interface Extended extends RestrictedBase {}
                           ~~~~~~~~~~~~~~
                           Type reference 'RestrictedBase' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type { Dangerous as LocalType } from "legacy-package";
type Result = LocalType;
`,
			files: restrictedPackageFiles,
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: ["Dangerous", "OtherType"],
							package: "legacy-package",
						},
					},
				],
			},
			snapshot: `
import type { Dangerous as LocalType } from "legacy-package";
type Result = LocalType;
              ~~~~~~~~~
              Type reference 'LocalType' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type { PublicType as LocalType } from "./barrel";
type Result = LocalType;
`,
			files: {
				...restrictedPackageFiles,
				"barrel.ts": `export type { Dangerous as PublicType } from "legacy-package";`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "Dangerous",
							package: "legacy-package",
						},
					},
				],
			},
			snapshot: `
import type { PublicType as LocalType } from "./barrel";
type Result = LocalType;
              ~~~~~~~~~
              Type reference 'LocalType' resolves to a restricted declaration.
`,
		},
		{
			code: `
type Module = import("./restricted");
`,
			files: restrictedFiles,
			options: {
				restrictions: [
					{ specifier: { from: "file", path: "./restricted.ts" } },
				],
			},
			snapshot: `
type Module = import("./restricted");
              ~~~~~~~~~~~~~~~~~~~~~~
              Type reference 'import("./restricted")' resolves to a restricted declaration.
`,
		},
		{
			code: `
type Result = import("./restricted").Space.Restricted;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
type Result = import("./restricted").Space.Restricted;
                                     ~~~~~~~~~~~~~~~~
                                     Type reference 'Space.Restricted' resolves to a restricted declaration.
`,
		},
		{
			code: `
type Module = typeof import("legacy-package");
`,
			files: restrictedPackageFiles,
			options: {
				restrictions: [
					{
						specifier: { from: "package", package: "legacy-package" },
					},
				],
			},
			snapshot: `
type Module = typeof import("legacy-package");
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Type reference 'typeof import("legacy-package")' resolves to a restricted declaration.
`,
		},
		{
			code: `
import * as Values from "./restricted";
type Result = typeof Values.restrictedValue;
`,
			files: restrictedFiles,
			options: {
				restrictions: [
					{
						message: "Choose the public value.",
						specifier: {
							from: "file",
							name: "restrictedValue",
							path: "./restricted.ts",
						},
					},
					{ specifier: { from: "file", path: "./restricted.ts" } },
				],
			},
			snapshot: `
import * as Values from "./restricted";
type Result = typeof Values.restrictedValue;
                     ~~~~~~~~~~~~~~~~~~~~~~
                     Type reference 'Values.restrictedValue' resolves to a restricted declaration. Choose the public value.
`,
		},
		{
			code: `
type Result = Date;
type Qualified = globalThis.Date;
`,
			options: {
				restrictions: [{ specifier: { from: "lib", name: ["Date", "Other"] } }],
			},
			snapshot: `
type Result = Date;
              ~~~~
              Type reference 'Date' resolves to a restricted declaration.
type Qualified = globalThis.Date;
                 ~~~~~~~~~~~~~~~
                 Type reference 'globalThis.Date' resolves to a restricted declaration.
`,
		},
		{
			code: `
interface Merged { value: string }
namespace Merged { export const value = ""; }
type Result = Merged;
`,
			options: {
				restrictions: [{ specifier: { from: "file", name: "Merged" } }],
			},
			snapshot: `
interface Merged { value: string }
namespace Merged { export const value = ""; }
type Result = Merged;
              ~~~~~~
              Type reference 'Merged' resolves to a restricted declaration.
`,
		},
		{
			code: `
import type { Restricted } from "./restricted";
type Alias = Restricted;
type Result = Alias;
`,
			files: restrictedFiles,
			options: restrictedFile,
			snapshot: `
import type { Restricted } from "./restricted";
type Alias = Restricted;
             ~~~~~~~~~~
             Type reference 'Restricted' resolves to a restricted declaration.
type Result = Alias;
`,
		},
	],
	valid: [
		`type Result = Date;`,
		{ code: `type Result = Date;`, options: { restrictions: [] } },
		{
			code: `interface Restricted {}; type Result = Restricted;`,
			options: restrictedFile,
		},
		{
			code: `import type { Restricted } from "./restricted";`,
			files: restrictedFiles,
			options: restrictedFile,
		},
		{
			code: `import { restrictedValue } from "./restricted"; console.log(restrictedValue);`,
			files: restrictedFiles,
			options: {
				restrictions: [
					{ specifier: { from: "file", path: "./restricted.ts" } },
				],
			},
		},
		{
			code: `import type { Dangerous } from "allowed-package"; type Result = Dangerous;`,
			files: {
				...restrictedPackageFiles,
				"allowed-package.d.ts": `declare module "allowed-package" { export interface Dangerous {} }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "Dangerous",
							package: "legacy-package",
						},
					},
				],
			},
		},
		{
			code: `type Values = string | number | {} | [];`,
			options: {
				restrictions: [{ specifier: { from: "lib" } }],
			},
		},
		{
			code: `type Missing = Unknown; type Module = import("./missing"); type InvalidModule = import(Unknown); class Derived extends unknownCall() {}`,
			options: {
				restrictions: [{ specifier: { from: "file" } }],
			},
		},
		{
			code: `type Module = import("./restricted");`,
			files: restrictedFiles,
			options: restrictedFile,
		},
	],
});
