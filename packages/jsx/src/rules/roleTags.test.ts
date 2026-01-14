import rule from "./roleTags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div role="button" />
`,
			snapshot: `
<div role="button" />
     ~~~~~~~~~~~~~
     <div> with role='button' is a less-accessible equivalent to <button>.
`,
		},
		{
			code: `
<div role="img" />
`,
			snapshot: `
<div role="img" />
     ~~~~~~~~~~
     <div> with role='img' is a less-accessible equivalent to <img>.
`,
		},
		{
			code: `
<span role="link" />
`,
			snapshot: `
<span role="link" />
      ~~~~~~~~~~~
      <span> with role='link' is a less-accessible equivalent to <a>.
`,
		},
		{
			code: `
<div role="navigation" />
`,
			snapshot: `
<div role="navigation" />
     ~~~~~~~~~~~~~~~~~
     <div> with role='navigation' is a less-accessible equivalent to <nav>.
`,
		},
	],
	valid: [
		{ code: `<button />` },
		{ code: `<img />` },
		{ code: `<a href="#" />` },
		{ code: `<nav />` },
		{ code: `<div />` },
		{ code: `<div role="presentation" />` },
	],
});
