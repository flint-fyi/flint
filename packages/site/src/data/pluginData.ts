export interface PluginData {
	colors: PluginLogoColors;
	description: string;
	id: string;
	name: string;
}

export interface PluginLogoColors {
	flame: string;
	heart: string;
	squiggly: string;
}

const pluginDataById = {
	astro: {
		colors: {
			flame: "#D83333",
			heart: "#F041FF",
			squiggly: "#17191E",
		},
		description:
			"Rules for Astro, the web framework for content-driven websites.",
		id: "astro",
		name: "Astro",
	},
	browser: {
		colors: {
			flame: "#E85D0D",
			heart: "#2CA6E0",
			squiggly: "#031E4C",
		},
		description:
			"Rules for code that runs in browsers and other environments with DOM (Document Object Model) elements.",
		id: "browser",
		name: "Browser",
	},
	flint: {
		colors: {
			flame: "#F2BF80",
			heart: "#AB1B1B",
			squiggly: "#886035",
		},
		description:
			"Rules for writing third-party Flint plugins and custom rules. Meta!",
		id: "flint",
		name: "Flint",
	},
	json: {
		colors: {
			flame: "#636363",
			heart: "#FAF0E6",
			squiggly: "#000080",
		},
		description:
			"Rules for linting `.json` files containing arbitrary data in the JavaScript Object Notation (JSON) format.",
		id: "json",
		name: "JSON",
	},
	jsx: {
		colors: {
			flame: "#61DBFB",
			heart: "#F3DF49",
			squiggly: "#1F80A3",
		},
		description:
			'Rules for code that describes UI with the "JSX" markup language, commonly in `.jsx` and/or `.tsx` files.',
		id: "jsx",
		name: "JSX",
	},
	md: {
		colors: {
			flame: "#ffffff",
			heart: "#2BA4E0",
			squiggly: "#343A40",
		},
		description:
			"Rules for linting `.md` files containing Markdown, the lightweight markup language.",
		id: "markdown",
		name: "Markdown",
	},
	next: {
		colors: {
			flame: "#404040",
			heart: "#FFFFFF",
			squiggly: "#000000",
		},
		description:
			"Rules for Next.js, the React meta-framework for high-quality web applications.",
		id: "next",
		name: "Next.js",
	},
	node: {
		colors: {
			flame: "#3C873A",
			heart: "#6BC045",
			squiggly: "#303030",
		},
		description:
			"Rules for code that runs in Node.js and other server runtimes that include Node.js-like APIs.",
		id: "node",
		name: "Node.js",
	},
	nuxt: {
		colors: {
			flame: "#34495E",
			heart: "#00DC81",
			squiggly: "#020618",
		},
		description:
			"Rules for Nuxt, the progressive web framework that makes full-stack development with Vue.js intuitive.",
		id: "nuxt",
		name: "Nuxt",
	},
	"package-json": {
		colors: {
			flame: "#F98717",
			heart: "#DF2AFC",
			squiggly: "#333333",
		},
		description:
			"Rules for linting Node.js `package.json` manifest files in repositories and workspaces.",
		id: "package-json",
		name: "PackageJSON",
	},
	performance: {
		colors: {
			flame: "#fadd03ff",
			heart: "#fff2eeff",
			squiggly: "#F05756",
		},
		description:
			'Rules for specialized code designed specifically to be run in performance-critical "hot paths".',
		id: "performance",
		name: "Performance",
	},
	react: {
		colors: {
			flame: "#0A7EA5",
			heart: "#57C4DC",
			squiggly: "#23272F",
		},
		description:
			"Rules for React, the library for web and native user interfaces.",
		id: "react",
		name: "React",
	},
	solid: {
		colors: {
			flame: "#90C3E8",
			heart: "#446B9E",
			squiggly: "#222222",
		},
		description:
			"Rules for SolidJS, the library for building effortless UIs with reactive precision.",
		id: "solid",
		name: "SolidJS",
	},
	sorting: {
		colors: {
			flame: "#4B32C3",
			heart: "#FFFFFF",
			squiggly: "#232327",
		},
		description:
			"Rules that automatically sort any and all possible aspects of code alphabetically, such as imports and properties.",
		id: "sorting",
		name: "Sorting",
	},
	spelling: {
		colors: {
			flame: "#B51A00",
			heart: "#F5EC02",
			squiggly: "#010100",
		},
		description:
			'Rules that detect misspelling typos in source files using the code-optimized "CSpell" spell-checker.',
		id: "spelling",
		name: "Spelling",
	},
	ts: {
		colors: {
			flame: "#2D78C7",
			heart: "#FFFFFF",
			squiggly: "#235A97",
		},
		description:
			"Rules for linting JavaScript and TypeScript code, including the latest and greatest powerful typed linting rules.",
		id: "ts",
		name: "TypeScript (and JavaScript)",
	},
	vitest: {
		colors: {
			flame: "#729B1B",
			heart: "#FCC72B",
			squiggly: "#516E11",
		},
		description:
			"Rules for Vitest, a next generation testing framework built on Vite. It's fast!",
		id: "vitest",
		name: "Vitest",
	},
	vue: {
		colors: {
			flame: "#3FB984",
			heart: "#5F87F2",
			squiggly: "#31475E",
		},
		description:
			"Rules for Vue, the Progressive JavaScript framework for building web user interfaces.",
		id: "vue",
		name: "Vue",
	},
	yaml: {
		colors: {
			flame: "#CC1718",
			heart: "#40e0d0",
			squiggly: "#008000",
		},
		description:
			"Rules for linting `.yaml`/`.yml` files containing arbitrary data in the Yet Another Markup Language (YAML) format.",
		id: "yaml",
		name: "YAML",
	},
} satisfies Record<string, PluginData>;

export const pluginDataByGroup: Record<string, Record<string, PluginData>> = {
	core: {
		json: pluginDataById.json,
		md: pluginDataById.md,
		"package-json": pluginDataById["package-json"],
		ts: pluginDataById.ts,
		yaml: pluginDataById.yaml,
	},
	focused: {
		browser: pluginDataById.browser,
		flint: pluginDataById.flint,
		jsx: pluginDataById.jsx,
		node: pluginDataById.node,
		performance: pluginDataById.performance,
		sorting: pluginDataById.sorting,
		spelling: pluginDataById.spelling,
	},
	incubator: {
		astro: pluginDataById.astro,
		next: pluginDataById.next,
		nuxt: pluginDataById.nuxt,
		react: pluginDataById.react,
		solid: pluginDataById.solid,
		vitest: pluginDataById.vitest,
		vue: pluginDataById.vue,
	},
};

export function getPluginData(pluginId: string) {
	for (const group of Object.keys(pluginDataByGroup)) {
		if (pluginId in pluginDataByGroup[group]) {
			return { group, plugin: pluginDataByGroup[group][pluginId] };
		}
	}

	console.log(new Error().stack);
	throw new Error(`Unknown pluginId: ${pluginId}`);
}
