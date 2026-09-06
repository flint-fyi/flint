import {
	createDirectPropertyValidityRule,
	type PresenceRule,
	type PresenceRuleName,
} from "./createDirectPropertyPresenceRule.ts";

const properties = [
	["author"],
	["bin"],
	["browser"],
	["bugs"],
	["bundleDependencies"],
	["config"],
	["contributors"],
	["cpu"],
	["dependencies"],
	["directories"],
	["description", { logical: true }],
	["devDependencies"],
	["devEngines"],
	["engines"],
	["exports"],
	["files"],
	["funding"],
	["gypfile"],
	["homepage"],
	["keywords"],
	["libc"],
	["license", { ignorePrivateDefault: true, logical: true }],
	["main"],
	["man"],
	["module"],
	["name", { ignorePrivateDefault: true, logical: true }],
	["optionalDependencies"],
	["os"],
	["packageManager"],
	["peerDependencies"],
	["peerDependenciesMeta"],
	["publishConfig"],
	["repository"],
	["scripts"],
	["sideEffects"],
	["type", { logical: true }],
	["types"],
	["version", { ignorePrivateDefault: true, logical: true }],
	["workspaces"],
] as const;

type PresenceProperty = (typeof properties)[number][0];

export const directPropertyPresenceRules = Object.fromEntries(
	properties.map(([propertyName, options]) => {
		const { id, rule } = createDirectPropertyValidityRule(
			propertyName,
			options,
		);
		return [id, rule] as const;
	}),
) as {
	[PropertyName in PresenceProperty as PresenceRuleName<PropertyName>]: PresenceRule<PropertyName>;
};
