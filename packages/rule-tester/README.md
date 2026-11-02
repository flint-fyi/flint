<h1 align="center"><code>@flint.fyi/rule-tester</code></h1>

<p align="center">
	[Experimental] Rule unit tests for Flint.
	❤️‍🔥
</p>

This is an internal package for Flint.

## Test inputs

A string or an object with `code` tests one file using `defaults.fileName` (or `file.ts`).
An object with `code` may also provide `files` containing supporting files that are available to the rule but are not linted.

To specify file names or test multiple files together, use a `files` object without `code`:

```ts
{
	files: {
		"src/first.ts": "export const first = 1;",
		"src/second.ts": "export const second = 2;",
	},
}
```

Every entry in this form is linted using the tested rule's language.
Files in `defaults.files` remain supporting files unless the test case also includes them in its linted inputs.
All files are available before the rule is set up, and its teardown runs after all files have been visited.

For an invalid test with one linted file, `snapshot` and `output` may be strings.
They may also be objects keyed by the input file names, and must use that form when more than one file is linted.
A snapshot object contains only files with reports, and an output object contains only files with fixes.
Omit `output` when no fixes are reported.

For a test with multiple linted files, own-file suggestions use the existing `files` form, with the original and updated contents under the originating input file's name.
Single-file tests continue to use `{ id, updated }` for own-file suggestions.
