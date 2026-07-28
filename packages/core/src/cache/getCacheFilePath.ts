import path from "node:path";

const defaultCacheFileDirectory = path.join("node_modules", ".cache");
const defaultCacheFileName = "flint.json";
const defaultCacheFilePath = path.join(
	defaultCacheFileDirectory,
	defaultCacheFileName,
);

export const getCacheFilePath = (userProvidedCacheLocation?: string) => {
	if (userProvidedCacheLocation) {
		if (userProvidedCacheLocation.toLocaleLowerCase().endsWith(".json")) {
			return userProvidedCacheLocation;
		}

		return path.join(userProvidedCacheLocation, defaultCacheFileName);
	}

	return defaultCacheFilePath;
};
