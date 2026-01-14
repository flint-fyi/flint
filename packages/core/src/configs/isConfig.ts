import type { Config } from "../types/configs.ts";

export function isConfig(value: unknown): value is Config {
	return (
		typeof value === "object" && value !== null && "isFlintConfig" in value
	);
}
