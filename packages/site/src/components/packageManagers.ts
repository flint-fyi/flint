import type { PackageManagersProps } from "starlight-package-managers";

export const packageManagers: NonNullable<PackageManagersProps["pkgManagers"]> =
	["npm", "bun", "deno", "pnpm", "yarn"];
