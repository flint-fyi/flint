// flint-disable-file ts/escapeSequenceCasing
import rule from "./regexGraphemeStringLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\q{abc}]/v;
`,
			snapshot: `
/[\\q{abc}]/v;
~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
`,
		},
		{
			code: String.raw`
/[\q{a|bc|}]/v;
`,
			snapshot: `
/[\\q{a|bc|}]/v;
~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
`,
		},
		{
			code: String.raw`
/[\q{abc|def|ghi|j|k|lm|n}]/v;
`,
			snapshot: `
/[\\q{abc|def|ghi|j|k|lm|n}]/v;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
`,
		},
		{
			code: String.raw`
/[\q{🇦🇨🇦🇩}]/v;
`,
			snapshot: `
/[\\q{🇦🇨🇦🇩}]/v;
~~~~~~~~~~~~~~~~~
This literal contains multiple graphemes in the \`\\q{}\` matcher intended for single graphemes.
`,
		},
	],
	valid: [
		String.raw`/[\q{\u{1f1e6}\u{1f1e8}|\u{1f1e6}\u{1f1e9}|\u{1f1e6}\u{1f1ea}|\u{1f1e6}\u{1f1eb}}]/v`,
		String.raw`/[\q{\u{1f1fa}\u{1f1f8}|\u{1f1fa}\u{1f1fe}|\u{1f1fa}\u{1f1ff}|\u{1f1fb}\u{1f1e6}}]/v`,
		String.raw`/[\q{\u{2122}\u{fe0f}|\u{2139}\u{fe0f}|\u{2194}\u{fe0f}|\u{2195}\u{fe0f}}]/v`,
		String.raw`/[\q{\u{a9}\u{fe0f}|\u{ae}\u{fe0f}|\u{203c}\u{fe0f}|\u{2049}\u{fe0f}}]/v`,
		String.raw`/[\q{#️⃣|*️⃣|0️⃣|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣|9️⃣}]/v`,
		String.raw`/[\q{©️}]/v;`,
		String.raw`/[\q{©️|®️|‼️|⁉️|™️|ℹ️|↔️|↕️|↖️|↗️|↘️|↙️|↩️|↪️|⌨️|⏏️|⏭️|⏮️|⏯️|⏱️}]/v`,
		String.raw`/[\q{⏲️|⏸️|⏹️|⏺️|Ⓜ️|▪️|▫️|▶️|◀️|◻️|◼️|☀️|☁️|☂️|☃️|☄️|☎️|☑️|☘️|☝️}]/v`,
		String.raw`/[\q{☝🏻|☝🏼|☝🏽|☝🏾|☝🏿|⛹🏻|⛹🏼|⛹🏽|⛹🏾|⛹🏿|✊🏻|✊🏼|✊🏽|✊🏾|✊🏿|✋🏻|✋🏼|✋🏽|✋🏾|✋🏿}]/v`,
		String.raw`/[\q{☠️|☢️|☣️|☦️|☪️|☮️|☯️|☸️|☹️|☺️|♀️|♂️|♟️|♠️|♣️|♥️|♦️|♨️|♻️|♾️}]/v`,
		String.raw`/[\q{⚒️|⚔️|⚕️|⚖️|⚗️|⚙️|⚛️|⚜️|⚠️|⚧️|⚰️|⚱️|⛈️|⛏️|⛑️|⛓️|⛩️|⛰️|⛱️|⛴️}]/v`,
		String.raw`/[\q{⛷️|⛸️|⛹️|✂️|✈️|✉️|✌️|✍️|✏️|✒️|✔️|✖️|✝️|✡️|✳️|✴️|❄️|❇️|❣️|❤️}]/v`,
		String.raw`/[\q{🇦🇨}]/v;`,
		String.raw`/[\q{🇦🇨|🇦🇩|🇦🇪|🇦🇫|🇦🇬|🇦🇮|🇦🇱|🇦🇲|🇦🇴|🇦🇶|🇦🇷|🇦🇸|🇦🇹|🇦🇺|🇦🇼|🇦🇽|🇦🇿|🇧🇦|🇧🇧|🇧🇩}]/v`,
		String.raw`/[\q{🇧🇪|🇧🇫|🇧🇬|🇧🇭|🇧🇮|🇧🇯|🇧🇱|🇧🇲|🇧🇳|🇧🇴|🇧🇶|🇧🇷|🇧🇸|🇧🇹|🇧🇻|🇧🇼|🇧🇾|🇧🇿|🇨🇦|🇨🇨}]/v`,
		String.raw`/[\q{🇨🇩|🇨🇫|🇨🇬|🇨🇭|🇨🇮|🇨🇰|🇨🇱|🇨🇲|🇨🇳|🇨🇴|🇨🇵|🇨🇷|🇨🇺|🇨🇻|🇨🇼|🇨🇽|🇨🇾|🇨🇿|🇩🇪|🇩🇬}]/v`,
		String.raw`/[\q{🇺🇸|🇺🇾|🇺🇿|🇻🇦|🇻🇨|🇻🇪|🇻🇬|🇻🇮|🇻🇳|🇻🇺|🇼🇫|🇼🇸|🇽🇰|🇾🇪|🇾🇹|🇿🇦|🇿🇲|🇿🇼}]/v`,
		String.raw`/[\q{✌🏻|✌🏼|✌🏽|✌🏾|✌🏿|✍🏻|✍🏼|✍🏽|✍🏾|✍🏿|🎅🏻|🎅🏼|🎅🏽|🎅🏾|🎅🏿|🏂🏻|🏂🏼|🏂🏽|🏂🏾|🏂🏿}]/v`,
		String.raw`/[\q{➡️|⤴️|⤵️|⬅️|⬆️|⬇️|〰️|〽️|㊗️|㊙️|🅰️|🅱️|🅾️|🅿️|🈂️|🈷️|🌡️|🌤️|🌥️|🌦️}]/v`,
		String.raw`/[\q{🌧️|🌨️|🌩️|🌪️|🌫️|🌬️|🌶️|🍽️|🎖️|🎗️|🎙️|🎚️|🎛️|🎞️|🎟️|🏋️|🏌️|🏍️|🏎️|🏔️}]/v`,
		String.raw`/[\q{🏃🏻|🏃🏼|🏃🏽|🏃🏾|🏃🏿|🏄🏻|🏄🏼|🏄🏽|🏄🏾|🏄🏿|🏇🏻|🏇🏼|🏇🏽|🏇🏾|🏇🏿|🏊🏻|🏊🏼|🏊🏽|🏊🏾|🏊🏿}]/v`,
		String.raw`/[\q{🏊‍♂️|🏳️‍🌈|🏴‍☠️|🐻‍❄️|👨‍⚕️|👨‍⚖️|👨‍✈️}]/v`,
		String.raw`/[\q{🏕️|🏖️|🏗️|🏘️|🏙️|🏚️|🏛️|🏜️|🏝️|🏞️|🏟️|🏳️|🏵️|🏷️|🐿️|👁️|📽️|🕉️|🕊️|🕯️}]/v`,
		String.raw`/[\q{🐈‍⬛|🐕‍🦺|🐦‍⬛|👨‍🌾|👨‍🍳|👨‍🍼|👨‍🎓|👨‍🎤|👨‍🎨|👨‍🏫|👨‍🏭|👨‍👦|👨‍👧|👨‍💻|👨‍💼|👨‍🔧|👨‍🔬|👨‍🚀|👨‍🚒|👨‍🦯}]/v`,
		String.raw`/[\q{👦🏻|👦🏼|👦🏽|👦🏾|👦🏿|👧🏻|👧🏼|👧🏽|👧🏾|👧🏿|👨🏻|👨🏼|👨🏽|👨🏾|👨🏿|👩🏻|👩🏼|👩🏽|👩🏾|👩🏿}]/v`,
		String.raw`/[\q{👨‍❤️‍👨|👩‍❤️‍👨|👩‍❤️‍👩}]/v`,
		String.raw`/[\q{👨🏻‍🤝‍👨🏼|👨🏻‍🤝‍👨🏽|👨🏻‍🤝‍👨🏾|👨🏻‍🤝‍👨🏿}]/v`,
		String.raw`/[\q{👨‍👦|👨‍👧|👨‍👨‍👦|👨‍👨‍👧|👨‍👩‍👦|👨‍👩‍👧}]/v`,
		String.raw`/[\q{👨‍👨‍👦‍👦|👨‍👨‍👧‍👦|👨‍👨‍👧‍👧|👨‍👩‍👦‍👦|👨‍👩‍👧‍👦|👨‍👩‍👧‍👧}]/v`,
		String.raw`/[\q{👨‍👩‍👧‍👦}]/v;`,
		String.raw`/[\q{👨‍🦰|👨‍🦱|👨‍🦲|👨‍🦳|👨‍🦼|👨‍🦽|👩‍🌾|👩‍🍳|👩‍🍼|👩‍🎓|👩‍🎤|👩‍🎨|👩‍🏫|👩‍🏭|👩‍👦|👩‍👧|👩‍💻|👩‍💼|👩‍🔧|👩‍🔬}]/v`,
		String.raw`/[\q{👩‍👦|👩‍👧|👩‍👦‍👦|👩‍👧‍👦|👩‍👧‍👧|👩‍👩‍👦|👩‍👩‍👧}]/v`,
		String.raw`/[\q{👩‍👩‍👦‍👦|👩‍👩‍👧‍👦|👩‍👩‍👧‍👧}]/v`,
		String.raw`/[\q{👩‍🚀|👩‍🚒|👩‍🦯|👩‍🦰|👩‍🦱|👩‍🦲|👩‍🦳|👩‍🦼|👩‍🦽|😮‍💨|😵‍💫|🧑‍🌾|🧑‍🍳|🧑‍🍼|🧑‍🎄|🧑‍🎓|🧑‍🎤|🧑‍🎨|🧑‍🏫|🧑‍🏭}]/v`,
		String.raw`/[\q{👮‍♀️|👮‍♂️|👯‍♀️|👯‍♂️|👰‍♀️|👰‍♂️|👱‍♀️|👱‍♂️|👳‍♀️|👳‍♂️|👷‍♀️|👷‍♂️|💁‍♀️|💁‍♂️|💂‍♀️|💂‍♂️|💆‍♀️|💆‍♂️|💇‍♀️|💇‍♂️}]/v`,
		String.raw`/[\q{🕰️|🕳️|🕴️|🕵️|🕶️|🕷️|🕸️|🕹️|🖇️|🖊️|🖋️|🖌️|🖍️|🖐️|🖥️|🖨️|🖱️|🖲️|🖼️|🗂️}]/v`,
		String.raw`/[\q{🗃️|🗄️|🗑️|🗒️|🗓️|🗜️|🗝️|🗞️|🗡️|🗣️|🗨️|🗯️|🗳️|🗺️|🛋️|🛍️|🛎️|🛏️|🛠️|🛡️}]/v`,
		String.raw`/[\q{🧑🏻‍🤝‍🧑🏻|🧑🏻‍🤝‍🧑🏼|🧑🏻‍🤝‍🧑🏽|🧑🏻‍🤝‍🧑🏾|🧑🏻‍🤝‍🧑🏿}]/v`,
		String.raw`/[\q{🫱🏻‍🫲🏼|🫱🏻‍🫲🏽|🫱🏻‍🫲🏾|🫱🏻‍🫲🏿|🫱🏼‍🫲🏻|🫱🏼‍🫲🏽|🫱🏼‍🫲🏾|🫱🏼‍🫲🏿}]/v`,
		String.raw`/[\q{🛢️|🛣️|🛤️|🛥️|🛩️|🛰️|🛳️}]/v`,
		String.raw`/[\q{a}]/v;`,
		String.raw`/[\q{a|b|c}]/v;`,
		String.raw`/[\q{a|b|c|}]/v;`,
		String.raw`/[\q{竈|門|禰󠄀|豆|子}\q{煉󠄁|獄|杏|寿|郎}]/v`,
		String.raw`/[abc]/;`,
		String.raw`/a|b|c/;`,
		String.raw`/abc/u;`,
	],
});
