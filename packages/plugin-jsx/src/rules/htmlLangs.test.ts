import rule from "./htmlLangs.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const el = <html></html>;
`,
			snapshot: `
const el = <html></html>;
            ~~~~
            This <html> element is missing a \`lang\` prop.
`,
		},
		{
			code: `
const el = <html className="root"></html>;
`,
			snapshot: `
const el = <html className="root"></html>;
            ~~~~
            This <html> element is missing a \`lang\` prop.
`,
		},
		{
			code: `
function App() { return <html><body>Content</body></html>; }
`,
			snapshot: `
function App() { return <html><body>Content</body></html>; }
                         ~~~~
                         This <html> element is missing a \`lang\` prop.
`,
		},
	],
	valid: [
		{ code: `const el = <html lang="en"></html>;` },
		{ code: `const el = <html lang="en-US"></html>;` },
		{ code: `const el = <html lang={language}></html>;` },
		{
			code: `const el = <html lang="fr" className="root"></html>;`,
		},
		{ code: `const el = <div></div>;` },
		{ code: `const el = <Html></Html>;` },
		{ code: `const el = <html LANG="en"></html>;` },
	],
});
