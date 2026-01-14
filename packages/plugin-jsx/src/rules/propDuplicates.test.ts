import rule from "./propDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div id="first" id="second">Content</div>
`,
			snapshot: `
<div id="first" id="second">Content</div>
                ~~
                Duplicate prop \`id\` found in JSX element. The last occurrence will override earlier ones.
`,
		},
		{
			code: `
<button className="btn" onClick={handleClick} className="btn-primary">
    Click me
</button>
`,
			snapshot: `
<button className="btn" onClick={handleClick} className="btn-primary">
                                              ~~~~~~~~~
                                              Duplicate prop \`className\` found in JSX element. The last occurrence will override earlier ones.
    Click me
</button>
`,
		},
		{
			code: `
<input type="text" name="field" type="email" />
`,
			snapshot: `
<input type="text" name="field" type="email" />
                                ~~~~
                                Duplicate prop \`type\` found in JSX element. The last occurrence will override earlier ones.
`,
		},
		{
			code: `
<Component
    value="first"
    disabled
    value="second"
    onClick={handler}
    value="third"
/>
`,
			snapshot: `
<Component
    value="first"
    disabled
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
		{ code: `<div id="unique">Content</div>` },
		{
			code: `<button className="btn" onClick={handleClick}>Click</button>`,
		},
		{
			code: `<input type="text" name="field" value="test" />`,
		},
		{ code: `<Component {...props} />` },
		{
			code: `<Element prop1="a" prop2="b" prop3="c" />`,
		},
	],
});
