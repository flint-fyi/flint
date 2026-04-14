<h1 align="center">Flint</h1>

<p align="center">
	[Experimental] A fast, friendly linter for JavaScript, TypeScript, and more.
	❤️‍🔥
</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 21" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-21-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/flint-fyi/flint/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://github.com/flint-fyi/flint/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/flint" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/flint?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

<img align="right" alt="A flaming heart atop a brown linter-style squiggly line" height="128" src="docs/flint.png" width="105">

**Flint** is an experimental new _"hybrid"_ linter: one that combines...

- **Ergonomics**: the ease of writing rules in JavaScript or TypeScript
- **Performance**: much of the speed of native linters with intelligent caching and native code for bottlenecking operations

It also brings in several improvements over traditional linter paradigms:

- **Streamlined configuration**: flexible configuration files that still preserve readability
- **Type-aware caching**: significantly improving performance when linting changes to large repositories
- **Unified core**: promoting popular rules to the core project for easier, more reliable inclusion

For deep dives into Flint, see:

- **[Introducing Flint](https://www.flint.fyi/blog/introducing-flint)**: the core hypotheses Flint is testing out, with why we hope they succeed.
- **[What Flint Does Differently](https://www.flint.fyi/blog/what-flint-does-differently)**: a full list of the core, developer, and end-user design differences in Flint compared to other linters.

## Usage

Coming soon.

![Terminal screenshot of a colored linter output. Light mode view of the Flint terminal in --interactive --watch mode, showing 1 file's ts/forInArrays violation with details out of 4 files.](./packages/site/public/screenshots/flint-interactive-light.webp)

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! ❤️‍🔥

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ArnaudBarre"><img src="https://avatars.githubusercontent.com/u/14235743?v=4?s=100" width="100px;" alt="Arnaud Barré"/><br /><sub><b>Arnaud Barré</b></sub></a><br /><a href="#ideas-ArnaudBarre" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://barrymichaeldoyle.com"><img src="https://avatars.githubusercontent.com/u/4674486?v=4?s=100" width="100px;" alt="Barry Michael Doyle"/><br /><sub><b>Barry Michael Doyle</b></sub></a><br /><a href="#infra-barrymichaeldoyle" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-barrymichaeldoyle" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jasik.xyz"><img src="https://avatars.githubusercontent.com/u/10626596?v=4?s=100" width="100px;" alt="Caleb Jasik"/><br /><sub><b>Caleb Jasik</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/issues?q=author%3Ajasikpark" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://christopher-buss.gitbook.io/portfolio"><img src="https://avatars.githubusercontent.com/u/32301681?v=4?s=100" width="100px;" alt="Christopher Buss"/><br /><sub><b>Christopher Buss</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=christopher-buss" title="Code">💻</a> <a href="https://github.com/flint-fyi/flint/issues?q=author%3Achristopher-buss" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://donisaac.dev"><img src="https://avatars.githubusercontent.com/u/22823424?v=4?s=100" width="100px;" alt="Don Isaac"/><br /><sub><b>Don Isaac</b></sub></a><br /><a href="#maintenance-donisaac" title="Maintenance">🚧</a> <a href="https://github.com/flint-fyi/flint/commits?author=donisaac" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://lishaduck.github.io"><img src="https://avatars.githubusercontent.com/u/88557639?v=4?s=100" width="100px;" alt="Eli"/><br /><sub><b>Eli</b></sub></a><br /><a href="#ideas-lishaduck" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/flint-fyi/flint/commits?author=lishaduck" title="Code">💻</a> <a href="#tool-lishaduck" title="Tools">🔧</a> <a href="#maintenance-lishaduck" title="Maintenance">🚧</a> <a href="https://github.com/flint-fyi/flint/issues?q=author%3Alishaduck" title="Bug reports">🐛</a> <a href="#infra-lishaduck" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/flint-fyi/flint/commits?author=lishaduck" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jaybell.me/"><img src="https://avatars.githubusercontent.com/u/9469090?v=4?s=100" width="100px;" alt="Jay Bell"/><br /><sub><b>Jay Bell</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=yharaskrik" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg ✨"/><br /><sub><b>Josh Goldberg ✨</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=JoshuaKGoldberg" title="Code">💻</a> <a href="#content-JoshuaKGoldberg" title="Content">🖋</a> <a href="https://github.com/flint-fyi/flint/commits?author=JoshuaKGoldberg" title="Documentation">📖</a> <a href="#ideas-JoshuaKGoldberg" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-JoshuaKGoldberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-JoshuaKGoldberg" title="Maintenance">🚧</a> <a href="#projectManagement-JoshuaKGoldberg" title="Project Management">📆</a> <a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a> <a href="https://github.com/flint-fyi/flint/issues?q=author%3AJoshuaKGoldberg" title="Bug reports">🐛</a> <a href="https://github.com/flint-fyi/flint/commits?author=JoshuaKGoldberg" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kirkwaiblinger"><img src="https://avatars.githubusercontent.com/u/53019676?v=4?s=100" width="100px;" alt="Kirk Waiblinger"/><br /><sub><b>Kirk Waiblinger</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=kirkwaiblinger" title="Code">💻</a> <a href="#maintenance-kirkwaiblinger" title="Maintenance">🚧</a> <a href="#ideas-kirkwaiblinger" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/flint-fyi/flint/commits?author=kirkwaiblinger" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kovsu"><img src="https://avatars.githubusercontent.com/u/82451257?v=4?s=100" width="100px;" alt="Konv Suu"/><br /><sub><b>Konv Suu</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=kovsu" title="Documentation">📖</a> <a href="https://github.com/flint-fyi/flint/commits?author=kovsu" title="Code">💻</a> <a href="#maintenance-kovsu" title="Maintenance">🚧</a> <a href="https://github.com/flint-fyi/flint/issues?q=author%3Akovsu" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://techmannih.me"><img src="https://avatars.githubusercontent.com/u/125847751?v=4?s=100" width="100px;" alt="Manish chaudhary "/><br /><sub><b>Manish chaudhary </b></sub></a><br /><a href="#ideas-techmannih" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lo1tuma"><img src="https://avatars.githubusercontent.com/u/169170?v=4?s=100" width="100px;" alt="Mathias Schreck"/><br /><sub><b>Mathias Schreck</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/issues?q=author%3Alo1tuma" title="Bug reports">🐛</a> <a href="#ideas-lo1tuma" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.kolharsam.net"><img src="https://avatars.githubusercontent.com/u/6604943?v=4?s=100" width="100px;" alt="Sameer Kolhar"/><br /><sub><b>Sameer Kolhar</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=kolharsam" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Sigmabrogz"><img src="https://avatars.githubusercontent.com/u/122412346?v=4?s=100" width="100px;" alt="Sigmabro"/><br /><sub><b>Sigmabro</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=sigmabrogz" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tibisabau"><img src="https://avatars.githubusercontent.com/u/96194994?v=4?s=100" width="100px;" alt="Tiberiu Sabău"/><br /><sub><b>Tiberiu Sabău</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=tibisabau" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.irrationalmindsthinkalike.com"><img src="https://avatars.githubusercontent.com/u/5475199?v=4?s=100" width="100px;" alt="Tyler C Laprade, CFA"/><br /><sub><b>Tyler C Laprade, CFA</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=tylerlaprade" title="Documentation">📖</a> <a href="#ideas-tylerlaprade" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/flint-fyi/flint/commits?author=tylerlaprade" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Yonava"><img src="https://avatars.githubusercontent.com/u/76519301?v=4?s=100" width="100px;" alt="Yona Alexander Voss-Andreae"/><br /><sub><b>Yona Alexander Voss-Andreae</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=yonava" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/auvred"><img src="https://avatars.githubusercontent.com/u/61150013?v=4?s=100" width="100px;" alt="auvred"/><br /><sub><b>auvred</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/issues?q=author%3Aauvred" title="Bug reports">🐛</a> <a href="#maintenance-auvred" title="Maintenance">🚧</a> <a href="#ideas-auvred" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/flint-fyi/flint/commits?author=auvred" title="Tests">⚠️</a> <a href="https://github.com/flint-fyi/flint/commits?author=auvred" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bmclear"><img src="https://avatars.githubusercontent.com/u/7715393?v=4?s=100" width="100px;" alt="bmclear"/><br /><sub><b>bmclear</b></sub></a><br /><a href="#maintenance-bmclear" title="Maintenance">🚧</a> <a href="https://github.com/flint-fyi/flint/commits?author=bmclear" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cylewaitforit"><img src="https://avatars.githubusercontent.com/u/54253392?v=4?s=100" width="100px;" alt="cylewaitforit"/><br /><sub><b>cylewaitforit</b></sub></a><br /><a href="https://github.com/flint-fyi/flint/commits?author=cylewaitforit" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/michaelfaith"><img src="https://avatars.githubusercontent.com/u/8071845?v=4?s=100" width="100px;" alt="michael faith"/><br /><sub><b>michael faith</b></sub></a><br /><a href="#ideas-michaelfaith" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/flint-fyi/flint/commits?author=michaelfaith" title="Documentation">📖</a> <a href="https://github.com/flint-fyi/flint/issues?q=author%3Amichaelfaith" title="Bug reports">🐛</a> <a href="#maintenance-michaelfaith" title="Maintenance">🚧</a> <a href="#tool-michaelfaith" title="Tools">🔧</a> <a href="https://github.com/flint-fyi/flint/commits?author=michaelfaith" title="Code">💻</a> <a href="#infra-michaelfaith" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

> ❤️‍🔥 This package was templated with [`create-typescript-app`](https://github.com/JoshuaKGoldberg/create-typescript-app) using the [Bingo framework](https://create.bingo).
