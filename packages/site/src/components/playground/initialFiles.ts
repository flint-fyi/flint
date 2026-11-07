import type { PlaygroundFile } from "~/playground/types.ts";

export const initialFiles: PlaygroundFile[] = [
	{
		code: `import { campers } from "./campers";

const longStay = campers.filter((camper) => camper.nights > 1)[0];

debugger;

export { longStay };
`,
		name: "index.ts",
	},
	{
		code: `export interface Camper {
	name: string;
	nights: number;
}

export const campers: Camper[] = [
	{ name: "Aster", nights: 2 },
	{ name: "Birch", nights: "three" },
];
`,
		name: "campers.ts",
	},
	{
		code: `{
	"name": "Pine Hollow",
	"sites": 12,
	"sites": 14,
	"maxNights": 1e400
}
`,
		name: "campsite.json",
	},
];
