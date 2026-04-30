import { ruleTester } from "./ruleTester.ts";
import rule from "./tableColumnCounts.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
| Head1 | Head2 |
| ----- | ----- |
| R1C1  | R1C2  | R1C3  |
`,
			snapshot: `
| Head1 | Head2 |
| ----- | ----- |
| R1C1  | R1C2  | R1C3  |
~~~~~~~~~~~~~~~~~~~~~~~~~
This table row has 3 cells but the header has 2.
`,
		},
		{
			code: `
| A |
| - |
| 1 | 2 |
`,
			snapshot: `
| A |
| - |
| 1 | 2 |
~~~~~~~~~
This table row has 2 cells but the header has 1.
`,
		},
		{
			code: `
| Col A | Col B |
| ----- | ----- |
| 1     | 2     |
| 3     | 4     | 5     |
`,
			snapshot: `
| Col A | Col B |
| ----- | ----- |
| 1     | 2     |
| 3     | 4     | 5     |
~~~~~~~~~~~~~~~~~~~~~~~~~
This table row has 3 cells but the header has 2.
`,
		},
		{
			code: `
| Header | Header | Header |
| ------ | ------ | ------ |
| Cell   | Cell   | Cell   | Extra |
`,
			snapshot: `
| Header | Header | Header |
| ------ | ------ | ------ |
| Cell   | Cell   | Cell   | Extra |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This table row has 4 cells but the header has 3.
`,
		},
		{
			code: `
| A | B | C |
| - | - | - |
| 1 | 2 | 3 | 4 | 5 |
`,
			snapshot: `
| A | B | C |
| - | - | - |
| 1 | 2 | 3 | 4 | 5 |
~~~~~~~~~~~~~~~~~~~~~
This table row has 5 cells but the header has 3.
`,
		},
	],
	valid: [
		`
| Header | Header |
| ------ | ------ |
| Cell   | Cell   |
| Cell   | Cell   |
`,
		`
| Header | Header | Header |
| ------ | ------ | ------ |
| Cell   | Cell   |        |
`,
		`
| Col A | Col B | Col C |
| ----- | ----- | ----- |
| 1     |       | 3     |
| 4     | 5     |
`,
		`
| Single Header |
| ------------- |
| Single Cell   |
`,
		`
| A | B | C |
| - | - | - |
| 1 | 2 | 3 |
| 4 | 5 | 6 |
`,
		`
| Header |
| ------ |
| Data   |
|        |
`,
	],
});
