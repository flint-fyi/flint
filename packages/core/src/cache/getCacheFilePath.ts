import { join } from "node:path";

const defaultCacheFileDirectory = join("node_modules", ".cache");
const defaultCacheFileName = "flint.json";
const defaultCacheFilePath = join(
	defaultCacheFileDirectory,
	defaultCacheFileName,
);

export const getCacheFilePath = (userProvidedCacheLocation?: string) => {
	if (userProvidedCacheLocation) {
		if (userProvidedCacheLocation.toLocaleLowerCase().endsWith(".json")) {
			return userProvidedCacheLocation;
		}

		return join(userProvidedCacheLocation, defaultCacheFileName);
	}

	return defaultCacheFilePath;
};
