export function createStandardTSConfigFile() {
	return {
		compilerOptions: {
			allowImportingTsExtensions: true,
			module: "NodeNext",
			noEmit: true,
			skipLibCheck: true,
			strict: true,
			target: "ESNext",
		},
		include: ["src"],
	};
}
