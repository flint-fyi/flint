import { ruleTester } from "./ruleTester.ts";
import rule from "./unescapedEntities.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div>Greater than > sign</div>`,
			snapshot: `
<div>Greater than > sign</div>
                  ~
                  This unescaped entity \`>\` may not render properly.`,
		},
		{
			code: `
<span>Double "quote" example</span>`,
			snapshot: `
<span>Double "quote" example</span>
             ~
             This unescaped entity \`"\` may not render properly.
                   ~
                   This unescaped entity \`"\` may not render properly.`,
		},
		{
			code: `
<p>Single 'quote' example</p>`,
			snapshot: `
<p>Single 'quote' example</p>
          ~
          This unescaped entity \`'\` may not render properly.
                ~
                This unescaped entity \`'\` may not render properly.`,
		},
		{
			code: `
<div>Closing } brace</div>`,
			snapshot: `
<div>Closing } brace</div>
             ~
             This unescaped entity \`}\` may not render properly.`,
		},
		{
			code: `
<Component>Text with > and "</Component>`,
			snapshot: `
<Component>Text with > and "</Component>
                     ~
                     This unescaped entity \`>\` may not render properly.
                           ~
                           This unescaped entity \`"\` may not render properly.`,
		},
		{
			code: `
<div>Multiple >> problems</div>`,
			snapshot: `
<div>Multiple >> problems</div>
              ~
              This unescaped entity \`>\` may not render properly.
               ~
               This unescaped entity \`>\` may not render properly.`,
		},
	],
	valid: [
		{ code: `<div>Regular text</div>` },
		{ code: `<div>Text with &gt; entity</div>` },
		{ code: `<div>Text with &quot; entity</div>` },
		{ code: `<div>Text with &#39; entity</div>` },
		{ code: `<div>Text with &#125; entity</div>` },
		{ code: `<div>{'>'}{'<'}</div>` },
		{ code: `<div>{'"'}</div>` },
		{ code: `<div>{"'"}</div>` },
		{ code: `<div>{'}'}</div>` },
		{ code: `<div>No special characters here</div>` },
		{
			code: `<div>
    Regular text content
</div>`,
		},
		{
			code: `<a href="https://example.com">Link</a>`,
		},
	],
});
