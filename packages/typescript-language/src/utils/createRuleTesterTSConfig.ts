export function createRuleTesterTSConfig(
	defaultCompilerOptions?: Record<string, unknown>,
) {
	return {
		"tsconfig.base.json": JSON.stringify(
			{
				compilerOptions: {
					lib: ["esnext"],
					moduleResolution: "bundler",
					strict: true,
					target: "esnext",
					types: [],
					...defaultCompilerOptions,
				},
			},
			null,
			2,
		),
		"tsconfig.json": JSON.stringify(
			{ extends: "./tsconfig.base.json" },
			null,
			2,
		),
	};
}
