import rule from "./propDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<div id="first" id="second">Content</div>
`,
			snapshot: `
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<div id="first" id="second">Content</div>
                ~~
                Duplicate prop \`id\` found in JSX element. The last occurrence will override earlier ones.
`,
		},
		{
			code: `
declare const handleClick: (...args: unknown[]) => unknown;
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<button className="btn" onClick={handleClick} className="btn-primary">
    Click me
</button>
`,
			snapshot: `
declare const handleClick: (...args: unknown[]) => unknown;
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<button className="btn" onClick={handleClick} className="btn-primary">
                                              ~~~~~~~~~
                                              Duplicate prop \`className\` found in JSX element. The last occurrence will override earlier ones.
    Click me
</button>
`,
		},
		{
			code: `
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<input type="text" name="field" type="email" />
`,
			snapshot: `
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
<input type="text" name="field" type="email" />
                                ~~~~
                                Duplicate prop \`type\` found in JSX element. The last occurrence will override earlier ones.
`,
		},
		{
			code: `
declare const Component: (props: Record<string, unknown>) => unknown;
declare const handler: (...args: unknown[]) => unknown;
<Component
    value="first"
    disabled
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
    value="second"
    onClick={handler}
    value="third"
/>
`,
			snapshot: `
declare const Component: (props: Record<string, unknown>) => unknown;
declare const handler: (...args: unknown[]) => unknown;
<Component
    value="first"
    disabled
// @ts-expect-error: TS17001 because this fixture verifies Flint's duplicate-prop report.
    value="second"
    ~~~~~
    Duplicate prop \`value\` found in JSX element. The last occurrence will override earlier ones.
    onClick={handler}
    value="third"
    ~~~~~
    Duplicate prop \`value\` found in JSX element. The last occurrence will override earlier ones.
/>
`,
		},
	],
	valid: [
		`<div id="unique">Content</div>`,
		`
declare const handleClick: (...args: unknown[]) => unknown;
<button className="btn" onClick={handleClick}>Click</button>`,
		`<input type="text" name="field" value="test" />`,
		`
declare const Component: (props: Record<string, unknown>) => unknown;
declare const props: Record<string, unknown>;
<Component {...props} />`,
		`<Element prop1="a" prop2="b" prop3="c" />`,
	],
});
