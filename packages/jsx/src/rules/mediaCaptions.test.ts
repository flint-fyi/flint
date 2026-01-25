import rule from "./mediaCaptions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<audio src="audio.mp3" />
`,
			snapshot: `
<audio src="audio.mp3" />
 ~~~~~
 This media element is missing <track> element captions.
`,
		},
		{
			code: `
<video src="video.mp4" />
`,
			snapshot: `
<video src="video.mp4" />
 ~~~~~
 This media element is missing <track> element captions.
`,
		},
		{
			code: `
<audio><source src="audio.mp3" /></audio>
`,
			snapshot: `
<audio><source src="audio.mp3" /></audio>
 ~~~~~
 This media element is missing <track> element captions.
`,
		},
		{
			code: `
<video><track kind="subtitles" /></video>
`,
			snapshot: `
<video><track kind="subtitles" /></video>
 ~~~~~
 This media element is missing <track> element captions.
`,
		},
	],
	valid: [
		`<audio><track kind="captions" /></audio>`,
		`<video><track kind="captions" /></video>`,
		`<video muted />`,
		`<div>Not media</div>`,
		`<audio muted src="audio.mp3" />`,
	],
});
