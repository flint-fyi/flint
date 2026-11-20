<h1 align="center"><code>@flint.fyi/expressive-code-ansi-links</code></h1>

<p align="center">
	An Expressive Code plugin that renders terminal hyperlinks in ANSI code blocks.
	❤️‍🔥
</p>

Terminals display [OSC 8 hyperlinks](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) as clickable text.
Expressive Code's `ansi` language shows their text but doesn't link it.
This plugin turns each hyperlink in an `ansi` code block into an `<a>` element around the same text, keeping its colors.

This is internal to our repo and not published.
