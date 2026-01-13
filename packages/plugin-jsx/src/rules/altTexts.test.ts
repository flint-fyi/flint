import rule from "./altTexts.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<img src="foo.jpg" />`,
			snapshot: `
<img src="foo.jpg" />
 ~~~
 img element is missing alt text for non-visual users.`,
		},
		{
			code: `
<img src="foo.jpg" alt />`,
			snapshot: `
<img src="foo.jpg" alt />
 ~~~
 img element is missing alt text for non-visual users.`,
		},
		{
			code: `
<img src="foo.jpg" alt={undefined} />`,
			snapshot: `
<img src="foo.jpg" alt={undefined} />
 ~~~
 img element is missing alt text for non-visual users.`,
		},
		{
			code: `
<area href="#" />`,
			snapshot: `
<area href="#" />
 ~~~~
 area element is missing alt text for non-visual users.`,
		},
		{
			code: `
<input type="image" src="submit.png" />`,
			snapshot: `
<input type="image" src="submit.png" />
 ~~~~~
 input[type='image'] element is missing alt text for non-visual users.`,
		},
		{
			code: `
<object data="movie.mp4" />`,
			snapshot: `
<object data="movie.mp4" />
 ~~~~~~
 object element is missing alt text for non-visual users.`,
		},
	],
	valid: [
		{ code: `<img src="foo.jpg" alt="A foo" />` },
		{ code: `<img src="foo.jpg" alt="" />` },
		{ code: `<img src="foo.jpg" alt={altTexts} />` },
		{ code: `<img src="foo.jpg" aria-label="Foo" />` },
		{ code: `<area alt="Click here" href="#" />` },
		{ code: `<input type="image" alt="Submit" />` },
		{ code: `<input type="text" />` },
		{ code: `<object aria-label="Video" />` },
		{ code: `<object title="Movie" />` },
		{ code: `<div>Not an image element</div>` },
	],
});
