import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { konamiEmojiBlast } from "@konami-emoji-blast/astro";
import { defineConfig } from "astro/config";
import { remarkAddTwoslash } from "remark-add-twoslash";
import { remarkHeadingId } from "remark-custom-heading-id";
import starlightBlog from "starlight-blog";
import starlightLinksValidator from "starlight-links-validator";
import starlightSidebarTopics from "starlight-sidebar-topics";

export default defineConfig({
	integrations: [
		konamiEmojiBlast(),
		starlight({
			components: {
				Footer: "src/components/Footer.astro",
				Head: "src/components/Head.astro",
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
				}),
				starlightLinksValidator(),
				starlightSidebarTopics(
					[
						{
							icon: "open-book",
							id: "about",
							items: [
								{ label: "About Flint", link: "about" },
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
					{ exclude: ["/blog", "/blog/**/*"] },
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
		resolve: {
			conditions: ["node", "import", "default", "browser"],
		},
		ssr: {
			// https://github.com/withastro/astro/issues/14117
			noExternal: ["zod"],
		},
	},
});
