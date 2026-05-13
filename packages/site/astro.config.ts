import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { konamiEmojiBlast } from "@konami-emoji-blast/astro";
import { defineConfig } from "astro/config";
import { remarkAddTwoslash } from "remark-add-twoslash";
import { remarkHeadingId } from "remark-custom-heading-id";
import starlightBlog from "starlight-blog";
import starlightLinksValidator from "starlight-links-validator";
import starlightSidebarTopics from "starlight-sidebar-topics";
import type { Plugin } from "vite";

/**
 * Browser-side aliases for modules that Flint's lint pipeline pulls in but
 * which break in the playground's web worker. Applied only to the client
 * environment so the SSR build keeps using the original implementations.
 *
 * Add new entries here as the worker surfaces additional failures. Bare
 * specifiers route through Vite's optimizeDeps for CJS->ESM conversion;
 * relative paths starting with `./` are resolved against the site src.
 */
const browserPolyfillAlias: Record<string, string> = {
	"debug-for-file": "./src/playground/shims/debug-for-file.ts",
	"node:async_hooks": "./src/playground/shims/node-async-hooks.ts",
	"node:fs": "./src/playground/shims/node-fs.ts",
	"node:fs/promises": "./src/playground/shims/node-fs-promises.ts",
	"node:path": "path-browserify",
	"node:process": "./src/playground/shims/node-process.ts",
	"node:timers": "./src/playground/shims/node-timers.ts",
	path: "path-browserify",
};

export default defineConfig({
	integrations: [
		konamiEmojiBlast(),
		starlight({
			components: {
				Footer: "src/components/Footer.astro",
				Head: "src/components/Head.astro",
				Header: "src/components/Header.astro",
				PageFrame: "src/components/PageFrame.astro",
				PageSidebar: "src/components/PageSidebar.astro",
				ThemeSelect: "src/components/ThemeSelect.astro",
			},
			customCss: ["src/styles.css"],
			favicon: "/logo.png",
			logo: {
				src: "src/assets/logo.png",
			},
			plugins: [
				starlightBlog({
					authors: {
						joshuakgoldberg: {
							name: "Josh Goldberg",
							picture: "/team/joshuakgoldberg.webp",
							title: "Creator & Maintainer",
							url: "https://joshuakgoldberg.com",
						},
					},
					navigation: "none",
				}),
				starlightLinksValidator(),
				starlightSidebarTopics(
					[
						{
							icon: "open-book",
							id: "about",
							items: [
								{ label: "About Flint", link: "about" },
								{ label: "Playground", link: "playground" },
								{ label: "CLI", link: "cli" },
								{ label: "Configuration", link: "configuration" },
								{ label: "Glossary", link: "glossary" },
								{ label: "FAQs", link: "faqs" },
								{
									collapsed: true,
									items: [
										{
											label: "Code of Conduct",
											link: "project/code-of-conduct",
										},
										{ label: "Contributing", link: "project/contributing" },
										{
											label: "Contributing with AI",
											link: "project/contributing-with-ai",
										},
										{ label: "Development", link: "project/development" },
										{ label: "Maintenance", link: "project/maintenance" },
										{ label: "Team", link: "project/team" },
									],
									label: "Project",
								},
							],
							label: "About",
							link: "about",
						},
						{
							icon: "list-format",
							id: "rules",
							items: [
								{
									items: [
										{ label: "Implementing", link: "rules/implementing" },
										{
											label: "Not Implementing",
											link: "rules/not-implementing",
										},
									],
									label: "All Rules",
								},
								{
									items: [
										{ label: "JSON", link: "rules/json" },
										{ label: "Markdown", link: "rules/md" },
										{ label: "PackageJSON", link: "rules/package-json" },
										{ label: "TypeScript", link: "rules/ts" },
										{ label: "YAML", link: "rules/yaml" },
									],
									label: "Core Plugins",
								},
								{
									items: [
										{ label: "Browser", link: "rules/browser" },
										{ label: "Flint", link: "rules/flint" },
										{ label: "JSX", link: "rules/jsx" },
										{ label: "Node", link: "rules/node" },
										{ label: "Performance", link: "rules/performance" },
										{ label: "Spelling", link: "rules/spelling" },
									],
									label: "Focused Plugins",
								},
								{
									items: [
										{ label: "Astro", link: "rules/astro" },
										{ label: "Next", link: "rules/next" },
										{ label: "Nuxt", link: "rules/nuxt" },
										{ label: "React", link: "rules/react" },
										{ label: "SolidJS", link: "rules/solid" },
										{ label: "Svelte", link: "rules/svelte" },
										{ label: "Vitest", link: "rules/vitest" },
										{ label: "Vue", link: "rules/vue" },
									],
									label: "Incubator Plugins",
								},
							],
							label: "Rules",
							link: "rules",
						},
					],
					{
						exclude: ["/blog", "/blog/**/*"],
						topics: { about: ["/playground"] },
					},
				),
			],
			social: [
				{
					href: "https://flint.fyi/discord",
					icon: "discord",
					label: "Discord",
				},
				{
					href: "https://github.com/flint-fyi/flint",
					icon: "github",
					label: "Github",
				},
			],
			tableOfContents: {
				maxHeadingLevel: 4,
			},
			title: "Flint",
		}),
		react(),
	],
	markdown: {
		remarkPlugins: [
			remarkAddTwoslash({
				excludes: [/content\/docs\/blog/, /content\/docs\/rules\/\w+\/\w+/],
			}),
			remarkHeadingId,
		],
	},
	redirects: {
		"/discord": "https://discord.gg/cFK3RAUDhy",
		"/team": "/project/team",
	},
	site: "https://flint.fyi",
	vite: {
		define: {
			// @astrojs/ts-plugin is "type":"commonjs"
			// __filename is not defined in ES module scope
			//   Stack trace:
			//     at D (file:///home/runner/work/flint/flint/packages/site/dist/chunks/getRuleForPlugin_C5J7xdaO.mjs:68627:687)
			//     at requireAstro2tsx (file:///home/runner/work/flint/flint/packages/site/dist/chunks/getRuleForPlugin_C5J7xdaO.mjs:69379:17)
			__filename: "import.meta.filename",
		},
		optimizeDeps: {
			// Force CJS->ESM conversion of polyfill packages so named imports
			// like `import { join } from "node:path"` resolve to real exports.
			include: ["path-browserify"],
		},
		plugins: [playgroundBrowserShimsPlugin()],
		resolve: {
			// `worker` ranked above `browser` so packages like
			// `decode-named-character-reference` use their non-DOM entry — the
			// playground worker has no `document`.
			conditions: ["node", "import", "default", "worker", "browser"],
		},
		worker: {
			// `es` (vs. the default `iife`) lets the worker use dynamic
			// `import()`/code splitting — our worker lazy-loads Flint plugins
			// so it can post a meaningful error if a plugin fails to bundle.
			format: "es",
			// Vite builds workers with their own plugin pipeline in production,
			// so register a fresh instance for the worker environment too.
			plugins: () => [playgroundBrowserShimsPlugin()],
		},
	},
});

function playgroundBrowserShimsPlugin(): Plugin {
	return {
		enforce: "pre",
		name: "playground-browser-shims",
		async resolveId(source, importer, options) {
			// Only polyfill for the client bundle (and worker bundles, which
			// share the client environment). Astro's `ssr` and `prerender`
			// environments run in Node at build time and need the real
			// `node:*` modules — shimming them breaks content sync.
			const envName = this.environment.name;
			if (envName !== "client") {
				return undefined;
			}

			const target = browserPolyfillAlias[source];
			if (target) {
				if (target.startsWith("./")) {
					return new URL(target, import.meta.url).pathname;
				}
				// Resolve bare specifiers from the site package — the actual
				// importer might live deep in a workspace package whose own
				// `node_modules` doesn't carry our polyfill deps.
				const resolved = await this.resolve(target, import.meta.url, {
					...options,
					skipSelf: true,
				});
				return resolved ?? undefined;
			}

			// Re-route the typescript-language `language.ts` to our
			// project-service-bypassing browser implementation. Resolve
			// `source` through Vite first (so package/relative specifiers
			// turn into absolute paths) before matching by suffix.
			const resolved = await this.resolve(source, importer, {
				...options,
				skipSelf: true,
			});
			if (resolved?.id.endsWith("typescript-language/src/language.ts")) {
				return new URL(
					"./src/playground/shims/typescript-language-language.ts",
					import.meta.url,
				).pathname;
			}

			return undefined;
		},
		transform(code, id) {
			// Only polyfill for the client bundle (and worker bundles, which
			// share the client environment). Astro's `ssr` and `prerender`
			// environments run in Node at build time and need the real
			// `node:*` modules — shimming them breaks content sync.
			if (this.environment.name !== "client") {
				return undefined;
			}
			// `import.meta.filename` is undefined in browsers and Flint's
			// `isFileSystemCaseSensitive` calls `.slice` on it during host
			// construction. Replace the expression with a stable synthetic
			// path — but only in that single file; doing it globally would
			// also clobber the literal text inside rule message templates.
			if (!id.endsWith("/isFileSystemCaseSensitive.ts")) {
				return undefined;
			}
			if (!code.includes("import.meta.filename")) {
				return undefined;
			}
			return {
				code: code.replace(
					/import\.meta\.filename/g,
					JSON.stringify("/playground/__synthetic__.ts"),
				),
				map: null,
			};
		},
	};
}
