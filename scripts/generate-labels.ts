import { glob, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { parse, parseDocument } from "yaml";

const root = path.join(import.meta.dirname, "..");

const {
	values: { check },
} = parseArgs({
	options: { check: { default: false, type: "boolean" } },
});

const labels = parse(
	await readFile(path.join(root, ".github/labels-manual.yaml"), "utf8"),
) as {
	color: string;
	description: string;
	name: string;
}[];

const labelColors = parse(
	await readFile(path.join(root, ".github/label-colors.yaml"), "utf8"),
) as Partial<Record<string, string>>;

const selections = {
	Package: {} as Record<string, string>,
	Plugin: {} as Record<string, string>,
};

const pluginNames = new Map<string, string>();
const pluginPaths = await Array.fromAsync(
	glob("packages/*/src/plugin.ts", { cwd: root }),
);

await Promise.all(
	pluginPaths.map(async (pluginPath) => {
		const plugins = (await import(
			pathToFileURL(path.join(root, pluginPath)).href
		)) as Record<string, { name: string }>;

		for (const plugin of Object.values(plugins)) {
			pluginNames.set(
				path.basename(path.dirname(path.dirname(pluginPath))),
				plugin.name,
			);
		}
	}),
);

const manifestPaths = await Array.fromAsync(
	glob("packages/*/package.json", { cwd: root }),
);

await Promise.all(
	manifestPaths.map(async (manifestPath) => {
		const directory = path.basename(path.dirname(manifestPath));
		const manifest = JSON.parse(
			await readFile(path.join(root, manifestPath), "utf8"),
		) as {
			description: string;
			name: string;
		};

		const pluginName = pluginNames.get(directory);

		if (pluginName) {
			const plugin = directory.replace(/^plugin-/u, "");
			selections.Plugin[pluginName] = `plugin: ${plugin}`;
			labels.push({
				color: labelColors[`plugin: ${plugin}`] ?? "0052cc",
				description: manifest.description
					.replace(/^\[Experimental\] /u, "")
					.slice(0, 100),
				name: `plugin: ${plugin}`,
			});
			return;
		}

		selections.Package[manifest.name] = `package: ${directory}`;
		labels.push({
			color: labelColors[`package: ${directory}`] ?? "c5def5",
			description: manifest.description
				.replace(/^\[Experimental\] /u, "")
				.slice(0, 100),
			name: `package: ${directory}`,
		});
	}),
);

const labelNames = new Set<string>();

for (const label of labels) {
	const name = label.name.toLowerCase();
	if (labelNames.has(name)) {
		throw new Error(`Duplicate label name: ${label.name}`);
	}
	labelNames.add(name);
}

labels.sort((first, second) => first.name.localeCompare(second.name, "en-US"));
await updateFile(
	".github/labels.json",
	`${JSON.stringify(labels, undefined, "\t")}\n`,
);

for (const field of ["Package", "Plugin"] as const) {
	selections[field] = Object.fromEntries(
		Object.entries(selections[field]).toSorted(([first], [second]) =>
			first < second ? -1 : first > second ? 1 : 0,
		),
	);
}

const templateFiles = await readdir(path.join(root, ".github/ISSUE_TEMPLATE"));

await Promise.all(
	templateFiles.map(async (file) => {
		if (!file.endsWith(".yaml")) {
			return;
		}

		const filePath = `.github/ISSUE_TEMPLATE/${file}`;
		const document = parseDocument(
			await readFile(path.join(root, filePath), "utf8"),
		);
		const form = document.toJS() as { body: { id?: string }[] };

		const pluginIndex = form.body.findIndex((field) => field.id === "plugin");
		const packageIndex = form.body.findIndex((field) => field.id === "package");
		if (pluginIndex === -1 && packageIndex === -1) {
			return;
		}

		const options = Object.keys(
			pluginIndex === -1 ? selections.Package : selections.Plugin,
		);
		document.setIn(
			["body", Math.max(pluginIndex, packageIndex), "attributes", "options"],
			options,
		);
		await updateFile(filePath, document.toString({ lineWidth: 0 }));
	}),
);

async function updateFile(filePath: string, content: string): Promise<void> {
	const absolutePath = path.join(root, filePath);

	if (check) {
		const original = await readFile(absolutePath, "utf8").catch(
			(error: unknown) => {
				if (
					error instanceof Error &&
					"code" in error &&
					error.code === "ENOENT"
				) {
					return;
				}
				throw error;
			},
		);
		if (original !== content) {
			console.error(
				`Outdated generated file: ${filePath}. Run pnpm generate:labels.`,
			);
			process.exitCode = 1;
		}
		return;
	}
	await writeFile(absolutePath, content);
}
