import rule from "./linkFragments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[Invalid Link](#non-existent-heading)

# Some Heading
`,
			snapshot: `
[Invalid Link](#non-existent-heading)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This link fragment 'non-existent-heading' does not exist in the document.

# Some Heading
`,
		},
		{
			code: `
# Some Heading

[Case Mismatch](#other-heading)
`,
			snapshot: `
# Some Heading

[Case Mismatch](#other-heading)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This link fragment 'other-heading' does not exist in the document.
`,
		},
		{
			code: `
# Introduction

[Invalid Link](#introductions)
`,
			snapshot: `
# Introduction

[Invalid Link](#introductions)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This link fragment 'introductions' does not exist in the document.
`,
		},
		{
			code: `
# Test Heading

[Link 1](#test-heading)
[Link 2](#wrong-heading)
`,
			snapshot: `
# Test Heading

[Link 1](#test-heading)
[Link 2](#wrong-heading)
~~~~~~~~~~~~~~~~~~~~~~~~
This link fragment 'wrong-heading' does not exist in the document.
`,
		},
	],
	valid: [
		`
# Introduction

[Valid Link](#introduction)
`,
		`
# Another Section

[Link to section](#another-section)
`,
		`
<h1 id="html-anchor">HTML Anchor</h1>

[Link to HTML anchor](#html-anchor)
`,
		`
<a name="named-anchor">Named Anchor</a>

[Link to named anchor](#named-anchor)
`,
		`[Link to top of page](#top)`,
		`
# café

[Link to café](#café)
`,
		`
# café

[Link to café encoded](#caf%C3%A9)
`,
		`
# Introduction
# Getting Started
# API Reference

[Link 1](#introduction)
[Link 2](#getting-started)
[Link 3](#api-reference)
`,
		`
# Case Test

[Valid Link with different case](#CASE-TEST)
`,
		`
# Heading With Multiple Words

[Link](#heading-with-multiple-words)
`,
	],
});
