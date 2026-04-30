import rule from "./enumInitializers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
enum Direction {
    Up,
}
`,
			snapshot: `
enum Direction {
    Up,
    ~~
    Enum member 'Up' has an implicit initializer that may change if the enum is reordered.
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
enum Direction {
    Up = 0,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Direction {
    Up = 1,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Direction {
    Up = 'Up',
}
`,
				},
			],
		},
		{
			code: `
enum Direction {
    Up,
    Down,
}
`,
			snapshot: `
enum Direction {
    Up,
    ~~
    Enum member 'Up' has an implicit initializer that may change if the enum is reordered.
    Down,
    ~~~~
    Enum member 'Down' has an implicit initializer that may change if the enum is reordered.
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
enum Direction {
    Up = 0,
    Down,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Direction {
    Up = 1,
    Down,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Direction {
    Up = 'Up',
    Down,
}
`,
				},
				{
					id: "assignIndex",
					updated: `
enum Direction {
    Up,
    Down = 1,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Direction {
    Up,
    Down = 2,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Direction {
    Up,
    Down = 'Down',
}
`,
				},
			],
		},
		{
			code: `
enum Direction {
    Up = 'Up',
    Down,
}
`,
			snapshot: `
enum Direction {
    Up = 'Up',
    Down,
    ~~~~
    Enum member 'Down' has an implicit initializer that may change if the enum is reordered.
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
enum Direction {
    Up = 'Up',
    Down = 1,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Direction {
    Up = 'Up',
    Down = 2,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Direction {
    Up = 'Up',
    Down = 'Down',
}
`,
				},
			],
		},
		{
			code: `
enum Direction {
    Up,
    Down = 'Down',
}
`,
			snapshot: `
enum Direction {
    Up,
    ~~
    Enum member 'Up' has an implicit initializer that may change if the enum is reordered.
    Down = 'Down',
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
enum Direction {
    Up = 0,
    Down = 'Down',
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Direction {
    Up = 1,
    Down = 'Down',
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Direction {
    Up = 'Up',
    Down = 'Down',
}
`,
				},
			],
		},
		{
			code: `
enum Numbers {
    First,
    Second,
    Third,
}
`,
			snapshot: `
enum Numbers {
    First,
    ~~~~~
    Enum member 'First' has an implicit initializer that may change if the enum is reordered.
    Second,
    ~~~~~~
    Enum member 'Second' has an implicit initializer that may change if the enum is reordered.
    Third,
    ~~~~~
    Enum member 'Third' has an implicit initializer that may change if the enum is reordered.
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
enum Numbers {
    First = 0,
    Second,
    Third,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Numbers {
    First = 1,
    Second,
    Third,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Numbers {
    First = 'First',
    Second,
    Third,
}
`,
				},
				{
					id: "assignIndex",
					updated: `
enum Numbers {
    First,
    Second = 1,
    Third,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Numbers {
    First,
    Second = 2,
    Third,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Numbers {
    First,
    Second = 'Second',
    Third,
}
`,
				},
				{
					id: "assignIndex",
					updated: `
enum Numbers {
    First,
    Second,
    Third = 2,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
enum Numbers {
    First,
    Second,
    Third = 3,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
enum Numbers {
    First,
    Second,
    Third = 'Third',
}
`,
				},
			],
		},
		{
			code: `
const enum Status {
    Pending,
    Active,
}
`,
			snapshot: `
const enum Status {
    Pending,
    ~~~~~~~
    Enum member 'Pending' has an implicit initializer that may change if the enum is reordered.
    Active,
    ~~~~~~
    Enum member 'Active' has an implicit initializer that may change if the enum is reordered.
}
`,
			suggestions: [
				{
					id: "assignIndex",
					updated: `
const enum Status {
    Pending = 0,
    Active,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
const enum Status {
    Pending = 1,
    Active,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
const enum Status {
    Pending = 'Pending',
    Active,
}
`,
				},
				{
					id: "assignIndex",
					updated: `
const enum Status {
    Pending,
    Active = 1,
}
`,
				},
				{
					id: "assignIncrementedIndex",
					updated: `
const enum Status {
    Pending,
    Active = 2,
}
`,
				},
				{
					id: "assignStringValue",
					updated: `
const enum Status {
    Pending,
    Active = 'Active',
}
`,
				},
			],
		},
	],
	valid: [
		`enum Direction {}`,
		`enum Direction { Up = 1 }`,
		`enum Direction { Up = 1, Down = 2 }`,
		`enum Direction { Up = 'Up', Down = 'Down' }`,
		`enum Mixed { A = 0, B = 'B', C = 2 }`,
		`const enum Status { Active = 1, Inactive = 0 }`,
		`declare enum External { Value = 1 }`,
	],
});
