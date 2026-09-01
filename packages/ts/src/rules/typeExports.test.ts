import { ruleTester } from "./ruleTester.ts";
import rule from "./typeExports.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface Account { name: string }
export { Account };
`,
			output: `
interface Account { name: string }
export type { Account };
`,
			snapshot: `
interface Account { name: string }
export { Account };
~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
type Account = { name: string };
const account = { name: "" };
export { Account, account };
`,
			output: `
type Account = { name: string };
const account = { name: "" };
export { type Account, account };
`,
			snapshot: `
type Account = { name: string };
const account = { name: "" };
export { Account, account };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Exports “Account” are types. Use inline \`type\` modifiers for them.
`,
		},
		{
			code: `
type Account = { name: string };
interface Permission { level: number }
const createAccount = () => ({ name: "" });
export { Account as "customer", Permission, createAccount };
`,
			output: `
type Account = { name: string };
interface Permission { level: number }
const createAccount = () => ({ name: "" });
export { type Account as "customer", type Permission, createAccount };
`,
			snapshot: `
type Account = { name: string };
interface Permission { level: number }
const createAccount = () => ({ name: "" });
export { Account as "customer", Permission, createAccount };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Exports “customer” and “Permission” are types. Use inline \`type\` modifiers for them.
`,
		},
		{
			code: `
type Account = { name: string };
interface Permission { level: number }
export /* declaration */ { type/* account */ Account, Permission /* permission */ };
`,
			output: `
type Account = { name: string };
interface Permission { level: number }
export type /* declaration */ { /* account */ Account, Permission /* permission */ };
`,
			snapshot: `
type Account = { name: string };
interface Permission { level: number }
export /* declaration */ { type/* account */ Account, Permission /* permission */ };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
type Account = { name: string };
interface Permission { level: number }
export { type Account, Permission };
`,
			output: `
type Account = { name: string };
interface Permission { level: number }
export type { Account, Permission };
`,
			snapshot: `
type Account = { name: string };
interface Permission { level: number }
export { type Account, Permission };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
import { Account as Customer } from "./models";
export { Customer };
`,
			files: {
				"models.ts": "export interface Account { name: string }",
			},
			output: `
import { Account as Customer } from "./models";
export type { Customer };
`,
			snapshot: `
import { Account as Customer } from "./models";
export { Customer };
~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
import type { Account } from "./models";
export { Account };
`,
			files: {
				"models.ts": "export class Account {}",
			},
			output: `
import type { Account } from "./models";
export type { Account };
`,
			snapshot: `
import type { Account } from "./models";
export { Account };
~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
export { Account as Customer } from "./barrel";
`,
			files: {
				"barrel.ts": 'export { Account } from "./models";',
				"models.ts":
					"export default interface DefaultAccount {}\nexport interface Account {}",
			},
			output: `
export type { Account as Customer } from "./barrel";
`,
			snapshot: `
export { Account as Customer } from "./barrel";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
export { default as Account } from "./models";
`,
			files: {
				"models.ts": "export default interface Account {}",
			},
			output: `
export type { default as Account } from "./models";
`,
			snapshot: `
export { default as Account } from "./models";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
export /* before star */ * from "./models";
export * as Models from "./models";
`,
			files: {
				"models.ts": "export interface Account {}",
			},
			output: `
export type /* before star */ * from "./models";
export type * as Models from "./models";
`,
			snapshot: `
export /* before star */ * from "./models";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
export * as Models from "./models";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
`,
		},
		{
			code: `
export * from "./barrel";
`,
			files: {
				"barrel.ts": 'export type * from "./models";',
				"models.ts": "export interface Account {}\nexport const account = {};",
			},
			output: `
export type * from "./barrel";
`,
			snapshot: `
export * from "./barrel";
~~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
`,
		},
		{
			code: `
export * from "./models";
`,
			files: {
				"models.ts":
					"export default class RuntimeAccount {}\nexport interface Account {}",
			},
			output: `
export type * from "./models";
`,
			snapshot: `
export * from "./models";
~~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
`,
		},
		{
			code: `
export * from "./first";
`,
			files: {
				"first.ts": 'export interface Account {}\nexport * from "./second";',
				"second.ts": 'export interface Permission {}\nexport * from "./first";',
			},
			output: `
export type * from "./first";
`,
			snapshot: `
export * from "./first";
~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
`,
		},
		{
			code: `
interface Account {}
export { Account } from "./models" with { type: "json" };
`,
			files: {
				"models.ts": "export interface Account {}",
			},
			snapshot: `
interface Account {}
export { Account } from "./models" with { type: "json" };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
		{
			code: `
export * from "./models" with { type: "json" };
`,
			files: {
				"models.ts": "export interface Account {}",
			},
			snapshot: `
export * from "./models" with { type: "json" };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This module exports only types. Use \`export type\`.
`,
		},
		{
			code: `
interface Account {}
export { Account };
`,
			fileName: "models.d.ts",
			output: `
interface Account {}
export type { Account };
`,
			snapshot: `
interface Account {}
export { Account };
~~~~~~~~~~~~~~~~~~~
All exports in this declaration are types. Use \`export type\`.
`,
		},
	],
	valid: [
		"export type { Account } from './models';",
		"export type * from './models';",
		"export type * as Models from './models';",
		"class Account {} export { type Account };",
		"class Account {} export { Account };",
		"enum Permission {} export { Permission };",
		"function createAccount() {} export { createAccount };",
		"const account = {}; export { account };",
		"namespace Accounts { export const count = 1; } export { Accounts };",
		"namespace Accounts { export interface Account {} } export { type Accounts };",
		"interface Account {} class Account {} export { Account };",
		"type Account = {}; const Account = {}; export { Account };",
		"declare class Account {} export { Account };",
		"declare function createAccount(): void; export { createAccount };",
		"declare enum Permission {} export { Permission };",
		"declare const account: {}; export { account };",
		"export default interface Account { name: string }",
		"export default class Account {}",
		"export default function createAccount() {}",
		"const account = {}; export default account;",
		"const account = {}; export = account;",
		"export as namespace Accounts;",
		"export { Account } from './missing';",
		"export * from './missing';",
		{
			code: "export * from './empty';",
			files: { "empty.ts": "export {};" },
		},
		{
			code: "export * from './values';\nexport * from './values';",
			files: {
				"values.ts": "export interface Account {}\nexport const account = {};",
			},
		},
		{
			code: "export * from './barrel';",
			files: {
				"barrel.ts": 'export * from "./values";',
				"values.ts": "export const account = {};",
			},
		},
		{
			code: "export * from './barrel';",
			files: {
				"barrel.ts":
					'export interface Account {}\nexport {};\nexport * from "./generated";',
			},
		},
		{
			code: "export * from './models';",
			files: { "models.ts": "export default interface Account {}" },
		},
		{
			code: "export * as Models from './models';",
			files: {
				"models.ts":
					"export default class RuntimeAccount {}\nexport interface Account {}",
			},
		},
		{
			code: `
import type { Account } from "./models";
const Account = {};
export { Account };
`,
			files: { "models.ts": "export interface Account {}" },
		},
		{
			code: `
import type { Accounts } from "./models";
namespace Accounts { export const count = 1; }
export { Accounts };
`,
			files: { "models.ts": "export namespace Accounts {}" },
		},
		{
			code: "interface Account {} export { Account };",
			fileName: "file.js",
		},
		{
			code: "declare class Account {} export { Account };",
			fileName: "models.d.ts",
		},
	],
});
