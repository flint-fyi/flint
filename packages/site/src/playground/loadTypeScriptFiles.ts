import {
	getDefaultLibFileName,
	getDefaultLibFilePath,
	ScriptTarget,
	sys,
	type System,
} from "typescript";

import { loadLibFiles } from "./loadLibFiles.ts";

let libFilesPromise: Promise<Map<string, string>> | undefined;

/**
 * Loads the TypeScript lib files and tsconfig.json that type-aware linting needs.
 */
export async function loadTypeScriptFiles(
	directory: string,
): Promise<Map<string, string>> {
	libFilesPromise ??= loadLibFiles(
		getDefaultLibFileName({
			target: ScriptTarget.ESNext,
		}),
	).catch((error: unknown) => {
		// Lets a later lint retry, such as after a network error.
		libFilesPromise = undefined;
		throw error;
	});

	// Matches where Flint's TypeScript server host looks for lib files,
	// which is under the current directory when ts.sys is unavailable.
	const libDirectory =
		(sys as System | undefined) === undefined
			? `${directory}/node_modules/typescript/lib`
			: getDefaultLibFilePath({}).replace(/[/\\][^/\\]+$/, "");

	const files = new Map(
		[...(await libFilesPromise)].map(([fileName, text]) => [
			`${libDirectory}/${fileName}`,
			text,
		]),
	);

	// Lets JSX type check without a framework's types, such as React's.
	files.set(
		`${directory}/jsx.d.ts`,
		"declare namespace JSX { interface Element {} interface IntrinsicElements { [name: string]: unknown } }",
	);

	files.set(
		`${directory}/tsconfig.json`,
		JSON.stringify({
			compilerOptions: {
				allowJs: true,
				jsx: "preserve",
				module: "esnext",
				moduleResolution: "bundler",
				noEmit: true,
				strict: true,
				target: "esnext",
			},
		}),
	);

	return files;
}
