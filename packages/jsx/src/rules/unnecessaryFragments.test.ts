import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryFragments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const element = <><div>Hello</div></>;
`,
			snapshot: `
const element = <><div>Hello</div></>;
                ~~~~~~~~~~~~~~~~~~~~~
                Unnecessary fragment wrapping a single child.
`,
		},
		{
			code: `
const element = <>Hello</>;
`,
			snapshot: `
const element = <>Hello</>;
                ~~~~~~~~~~
                Unnecessary fragment wrapping a single child.
`,
		},
		{
			code: `
const element = <></>;
`,
			snapshot: `
const element = <></>;
                ~~~~~
                Unnecessary fragment wrapping no children.
`,
		},
		{
			code: `
const element = <Fragment><div>Hello</div></Fragment>;
`,
			snapshot: `
const element = <Fragment><div>Hello</div></Fragment>;
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Unnecessary fragment wrapping a single child.
`,
		},
		{
			code: `
const element = <Fragment></Fragment>;
`,
			snapshot: `
const element = <Fragment></Fragment>;
                ~~~~~~~~~~~~~~~~~~~~~
                Unnecessary fragment wrapping no children.
`,
		},
		{
			code: `
const element = <>
    <div>Hello</div>
</>;
`,
			snapshot: `
const element = <>
                ~~
                Unnecessary fragment wrapping a single child.
    <div>Hello</div>
    ~~~~~~~~~~~~~~~~
</>;
~~~
`,
		},
		{
			code: `
return (
    <>
        <Component />
    </>
);
`,
			snapshot: `
return (
    <>
    ~~
    Unnecessary fragment wrapping a single child.
        <Component />
        ~~~~~~~~~~~~~
    </>
    ~~~
);
`,
		},
		{
			code: `
const element = <Fragment>
    Text content
</Fragment>;
`,
			snapshot: `
const element = <Fragment>
                ~~~~~~~~~~
                Unnecessary fragment wrapping a single child.
    Text content
    ~~~~~~~~~~~~
</Fragment>;
~~~~~~~~~~~
`,
		},
	],
	valid: [
		`const element = <><div>First</div><div>Second</div></>;`,
		`const element = <Fragment><div>First</div><div>Second</div></Fragment>;`,
		`const element = <Fragment key="item"><div>Hello</div></Fragment>;`,
		`const element = <><div>A</div><div>B</div><div>C</div></>;`,
		`const element = <div>Hello</div>;`,
		`
return (
    <>
        <div>First</div>
        <div>Second</div>
    </>
);
`,
		`const element = <Fragment key={item.id}><span>{item.text}</span></Fragment>;`,
		`
const element = <>
    <div>First</div>
    Text between
    <div>Second</div>
</>;
`,
	],
});
