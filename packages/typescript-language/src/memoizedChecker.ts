import type { Checker } from "typescript-native/unstable/sync";

// The native checker runs out-of-process, so every query (`getTypeAtLocation`,
// `getSymbolAtLocation`, and friends) is an IPC round-trip. Many type-aware
// rules query the same node/type/symbol, so memoizing each query by its
// argument identity collapses those repeats to a single round-trip. Results are
// stable while the snapshot is unchanged, which it is for the whole visitor
// phase, so the caches live as long as the checker they wrap.
const memoizedCheckerCache = new WeakMap<Checker, Checker>();

// Queries that are deterministic given a single object argument (a Node, Type,
// or Symbol) for a stable snapshot. Memoized by that argument's identity. Only
// memoized when called with exactly one argument, so overloads that take extra
// options (e.g. `typeToString(type, enclosingDeclaration, flags)`) fall through
// to the raw checker rather than returning a wrongly-cached result.
const SINGLE_ARG_IDENTITY_METHODS: readonly string[] = [
	"getAliasedSymbol",
	"getApparentType",
	"getBaseConstraintOfType",
	"getContextualType",
	"getImmediateAliasedSymbol",
	"getResolvedSignature",
	"getShorthandAssignmentValueSymbol",
	"getSymbolAtLocation",
	"getTypeArguments",
	"getTypeAtLocation",
	"getTypeFromTypeNode",
	"getTypeOfSymbol",
	"isArrayType",
	"isTupleType",
	"typeToString",
];

// Queries deterministic given two object arguments, memoized by the identity of
// both (a nested map). Only memoized when called with exactly two arguments.
const PAIR_IDENTITY_METHODS: readonly string[] = [
	"getTypeOfSymbolAtLocation",
	"isTypeAssignableTo",
];

function buildMemoizedMethods(
	checker: Checker,
): Map<string, (...args: unknown[]) => unknown> {
	const methods = new Map<string, (...args: unknown[]) => unknown>();
	const source = checker as unknown as Record<string, unknown>;

	for (const name of SINGLE_ARG_IDENTITY_METHODS) {
		const raw = source[name];
		if (typeof raw !== "function") {
			continue;
		}
		const rawFn = raw as (...args: unknown[]) => unknown;
		const cache = new WeakMap<object, unknown>();
		methods.set(name, function memoizedSingleArg(this: unknown, ...args) {
			if (args.length !== 1 || !isObject(args[0])) {
				return rawFn.apply(this, args);
			}
			const key = args[0];
			if (cache.has(key)) {
				return cache.get(key);
			}
			const result = rawFn.apply(this, args);
			cache.set(key, result);
			return result;
		});
	}

	for (const name of PAIR_IDENTITY_METHODS) {
		const raw = source[name];
		if (typeof raw !== "function") {
			continue;
		}
		const rawFn = raw as (...args: unknown[]) => unknown;
		const outer = new WeakMap<object, WeakMap<object, unknown>>();
		methods.set(name, function memoizedPair(this: unknown, ...args) {
			if (args.length !== 2 || !isObject(args[0]) || !isObject(args[1])) {
				return rawFn.apply(this, args);
			}
			let inner = outer.get(args[0]);
			if (!inner) {
				inner = new WeakMap();
				outer.set(args[0], inner);
			}
			if (inner.has(args[1])) {
				return inner.get(args[1]);
			}
			const result = rawFn.apply(this, args);
			inner.set(args[1], result);
			return result;
		});
	}

	return methods;
}

function isObject(value: unknown): value is object {
	return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Wraps `checker` so its deterministic queries are memoized by argument identity
 * for the life of the (stable) snapshot. The same wrapper is returned for a
 * given checker, so caches are shared across every rule that runs on the file.
 */
export function getMemoizedChecker(checker: Checker): Checker {
	const existing = memoizedCheckerCache.get(checker);
	if (existing) {
		return existing;
	}

	const methods = buildMemoizedMethods(checker);
	const wrapped = new Proxy(checker, {
		get(target, property, receiver) {
			const override = methods.get(property as string);
			if (override) {
				return override;
			}
			return Reflect.get(target, property, receiver) as unknown;
		},
	});
	memoizedCheckerCache.set(checker, wrapped);
	return wrapped;
}
