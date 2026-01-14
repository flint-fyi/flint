import "./proxy-program.ts";

function replaceOrThrow(
	source: string,
	search: RegExp | string,
	replace: (substring: string, ...args: string[]) => string,
): string {
	const before = source;
	source = source.replace(search, replace);
	const after = source;
	if (after === before) {
		throw new Error("Flint bug: failed to replace: " + search.toString());
	}
	return after;
}

// https://github.com/volarjs/volar.js/blob/e08f2f449641e1c59686d3454d931a3c29ddd99c/packages/typescript/lib/quickstart/runTsc.ts
export function transformTscContent(source: string): string {
	source += `
function _flintDynamicProxy(getter) {
	return new Proxy(function () {}, new Proxy({}, {
		get(_, property) {
			return (_, ...args) => Reflect[property](getter(), ...args)
		}
	}))
}

function _flintGetExtraSupportedExtensions() {
	return Array.from(globalThis._flintExtraSupportedExtensions)
}
function _flintProxyCreateProgram(ts, original) {
	let proxied = original;
	for (const proxy of globalThis._flintCreateProgramProxies) {
		proxied = proxy(ts, proxied);
	}
	return proxied;
}
	`;
	injectExtraSupportedExtensions("supportedTSExtensions");
	injectExtraSupportedExtensions("supportedJSExtensions");
	injectExtraSupportedExtensions("allSupportedExtensions");

	injectDynamicProxy("supportedTSExtensionsFlat");
	injectDynamicProxy("supportedTSExtensionsWithJson");
	injectDynamicProxy("supportedJSExtensionsFlat");
	injectDynamicProxy("allSupportedExtensionsWithJson");

	source = replaceOrThrow(
		source,
		"function changeExtension(path, newExtension)",
		(s) => `${s} {
return _flintGetExtraSupportedExtensions().some(ext => path.endsWith(ext))
	? path + newExtension
	: _changeExtension(path, newExtension)
}

function _changeExtension(path, newExtension)`,
	);

	source = replaceOrThrow(
		source,
		/function createProgram\(/,
		() => `function createProgram(...args) {
	return _flintProxyCreateProgram(
		new Proxy({}, { get(_target, p, _receiver) { return eval(p); } } ),
		_createProgram,
	)(...args)
}

function _createProgram(`,
	);

	return source;

	function injectExtraSupportedExtensions(variable: string) {
		injectDynamicProxy(
			variable,
			(initializer) =>
				`${initializer}.map((group, i) => (i === 0 && group.push(..._flintGetExtraSupportedExtensions()), group))`,
		);
	}

	function injectDynamicProxy(
		variable: string,
		transformInitializer?: (initializer: string) => string,
	) {
		source = replaceOrThrow(
			source,
			new RegExp(`(${variable}) = (.*)(?=;)`),
			(match, decl, initializer) =>
				`${decl} = _flintDynamicProxy(() => ${transformInitializer?.(initializer) ?? initializer})`,
		);
	}
}
