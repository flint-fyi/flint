import rule from "./emptyModuleAttributes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import data from "./data.json" with {};
`,
			files: {
				"data.json": `{
    "enabled": true
}`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext",
        "resolveJsonModule": true
    }
}`,
			},
			output: `
import data from "./data.json" ;
`,
			snapshot: `
import data from "./data.json" with {};
                               ~~~~~~~
                               Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
import { x } from "./module" with {};
`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
			output: `
import { x } from "./module" ;
`,
			snapshot: `
import { x } from "./module" with {};
                             ~~~~~~~
                             Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
export { x } from "./module" with {};
`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
			output: `
export { x } from "./module" ;
`,
			snapshot: `
export { x } from "./module" with {};
                             ~~~~~~~
                             Empty import attributes serve no purpose and should be removed.
`,
		},
		{
			code: `
export * from "./module" with {};
`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
			output: `
export * from "./module" ;
`,
			snapshot: `
export * from "./module" with {};
                         ~~~~~~~
                         Empty import attributes serve no purpose and should be removed.
`,
		},
	],
	valid: [
		{
			code: `import data from "./data.json" with { type: "json" };`,
			files: {
				"data.json": `{
    "enabled": true
}`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext",
        "resolveJsonModule": true
    }
}`,
			},
		},
		{
			code: `
import { x } from "./module";
x;
`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
		},
		{
			code: `export { x } from "./module";`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
		},
		{
			code: `export * from "./module";`,
			files: {
				"module.ts": `export const x = 1;`,
				"tsconfig.json": `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "module": "esnext"
    }
}`,
			},
		},
		{
			code: `import styles from "./styles.css" with { type: "css" };`,
			files: {
				"styles.css.d.ts": `declare const styles: string;
export default styles;`,
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
