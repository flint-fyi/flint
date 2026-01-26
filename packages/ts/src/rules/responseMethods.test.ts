import rule from "./responseMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new Response(JSON.stringify(data))
`,
			snapshot: `
new Response(JSON.stringify(data))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
new Response(JSON.stringify({ value: 1 }))
`,
			snapshot: `
new Response(JSON.stringify({ value: 1 }))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
new Response(JSON.stringify(data), {})
`,
			snapshot: `
new Response(JSON.stringify(data), {})
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
`,
			snapshot: `
new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
`,
			snapshot: `
new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' } })
`,
			snapshot: `
new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' } })
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
		{
			code: `
const response = new Response(JSON.stringify({ message: 'ok' }))
`,
			snapshot: `
const response = new Response(JSON.stringify({ message: 'ok' }))
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Use Response.json() instead of new Response(JSON.stringify(...)).
`,
		},
	],
	valid: [
		`new Response(data)`,
		`new Response("text")`,
		`new Response(JSON.stringify(data, null, 2))`,
		`new Response(JSON.stringify(data, replacer))`,
		`new Response(JSON.stringify(data), { status: 200 })`,
		`new Response(JSON.stringify(data), { headers: { 'x-custom': 'value' } })`,
		`new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } })`,
		`Response.json(data)`,
		`Response.json({ value: 1 })`,
		`new Request(JSON.stringify(data))`,
	],
});
