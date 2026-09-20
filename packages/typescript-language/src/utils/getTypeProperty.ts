import type { Symbol, Type } from "typescript-native/unstable/sync";

// Type objects are handed out once per snapshot by the native API's registry,
// so answers keyed by them never outlive the snapshot they came from.
const propertiesByType = new WeakMap<Type, Map<string, Symbol | undefined>>();

/**
 * `type.getProperty(name)`, answered from the first lookup of that property
 * on that type within a snapshot. The native API caches a type's full
 * property list but not single lookups, and each of those is a round trip.
 */
export function getTypeProperty(type: Type, name: string): Symbol | undefined {
	let properties = propertiesByType.get(type);
	if (!properties) {
		properties = new Map();
		propertiesByType.set(type, properties);
	}
	if (properties.has(name)) {
		return properties.get(name);
	}
	const property = type.getProperty(name);
	properties.set(name, property);
	return property;
}
