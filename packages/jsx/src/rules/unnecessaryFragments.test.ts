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
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment><div>Hello</div></Fragment>;
`,
			snapshot: `
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment><div>Hello</div></Fragment>;
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Unnecessary fragment wrapping a single child.
`,
		},
		{
			code: `
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment></Fragment>;
`,
			snapshot: `
declare const Fragment: (props: Record<string, unknown>) => unknown;
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
declare const Component: (props: Record<string, unknown>) => unknown;
const element = (
    <>
        <Component />
    </>
);
`,
			snapshot: `
declare const Component: (props: Record<string, unknown>) => unknown;
const element = (
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
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment>
    Text content
</Fragment>;
`,
			snapshot: `
declare const Fragment: (props: Record<string, unknown>) => unknown;
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
		`
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment><div>First</div><div>Second</div></Fragment>;`,
		`
declare const Fragment: (props: Record<string, unknown>) => unknown;
const element = <Fragment key="item"><div>Hello</div></Fragment>;`,
		`const element = <><div>A</div><div>B</div><div>C</div></>;`,
		`const element = <div>Hello</div>;`,
		`
const element = (
    <>
        <div>First</div>
        <div>Second</div>
    </>
);
`,
		`
declare const Fragment: (props: Record<string, unknown>) => unknown;
declare const item: Record<string, unknown>;
const element = <Fragment key={item.id}><span>{item.text}</span></Fragment>;`,
		`
const element = <>
    <div>First</div>
    Text between
    <div>Second</div>
</>;
`,
	],
});
