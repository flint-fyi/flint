import { ruleTester } from "./ruleTester.ts";
import rule from "./unescapedEntities.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div>Greater than > sign</div>
`,
			snapshot: `
<div>Greater than > sign</div>
                  ~
                  This unescaped entity \`>\` may not render properly.
`,
		},
		{
			code: `
<span>Double "quote" example</span>
`,
			snapshot: `
<span>Double "quote" example</span>
             ~
             This unescaped entity \`"\` may not render properly.
                   ~
                   This unescaped entity \`"\` may not render properly.
`,
		},
		{
			code: `
<p>Single 'quote' example</p>
`,
			snapshot: `
<p>Single 'quote' example</p>
          ~
          This unescaped entity \`'\` may not render properly.
                ~
                This unescaped entity \`'\` may not render properly.
`,
		},
		{
			code: `
<div>Closing } brace</div>
`,
			snapshot: `
<div>Closing } brace</div>
             ~
             This unescaped entity \`}\` may not render properly.
`,
		},
		{
			code: `
<Component>Text with > and "</Component>
`,
			snapshot: `
<Component>Text with > and "</Component>
                     ~
                     This unescaped entity \`>\` may not render properly.
                           ~
                           This unescaped entity \`"\` may not render properly.
`,
		},
		{
			code: `
<div>Multiple >> problems</div>
`,
			snapshot: `
<div>Multiple >> problems</div>
              ~
              This unescaped entity \`>\` may not render properly.
               ~
               This unescaped entity \`>\` may not render properly.
`,
		},
	],
	valid: [
		`<div>Regular text</div>`,
		`<div>Text with &gt; entity</div>`,
		`<div>Text with &quot; entity</div>`,
		`<div>Text with &#39; entity</div>`,
		`<div>Text with &#125; entity</div>`,
		`<div>{'>'}{'<'}</div>`,
		`<div>{'"'}</div>`,
		`<div>{"'"}</div>`,
		`<div>{'}'}</div>`,
		`<div>No special characters here</div>`,
		`<div>
    Regular text content
</div>`,
		`<a href="https://example.com">Link</a>`,
	],
});
