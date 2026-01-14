/**
 * Version support data for Node.js built-in APIs.
 *
 * This curated dataset covers high-impact APIs that are commonly used but
 * weren't available in older Node.js versions. Keys are dotted paths:
 * - Module specifiers: "fs/promises", "timers/promises"
 * - Properties on modules: "fs.promises", "fs.rm", "crypto.webcrypto"
 * - Global identifiers: "globalThis", "Blob", "fetch"
 *
 * To add new APIs, add entries here with their first supported version.
 */

export interface NodeBuiltinAPISupport {
	addedIn: string;
	removedIn?: string;
}

/**
 * Module specifiers (import/require paths) that were added in specific Node.js versions.
 * Only includes modules that are NOT available in all Node.js versions.
 */
export const nodeBuiltinModules: Record<string, NodeBuiltinAPISupport> = {
	// Subpath imports
	"assert/strict": { addedIn: "15.0.0" },
	"dns/promises": { addedIn: "10.6.0" },
	"fs/promises": { addedIn: "10.0.0" },
	"inspector/promises": { addedIn: "19.0.0" },
	"readline/promises": { addedIn: "17.0.0" },
	"stream/consumers": { addedIn: "16.7.0" },
	"stream/promises": { addedIn: "15.0.0" },
	"stream/web": { addedIn: "16.5.0" },
	"timers/promises": { addedIn: "15.0.0" },
	"util/types": { addedIn: "10.0.0" },
	// New top-level modules
	sea: { addedIn: "21.7.0" },
	sqlite: { addedIn: "22.5.0" },
	test: { addedIn: "18.0.0" },
};

export const nodeBuiltinAPIs: Record<string, NodeBuiltinAPISupport> = {
	// fs module APIs
	"fs.cp": { addedIn: "16.7.0" },
	"fs.cpSync": { addedIn: "16.7.0" },
	"fs.glob": { addedIn: "22.0.0" },
	"fs.globSync": { addedIn: "22.0.0" },
	"fs.openAsBlob": { addedIn: "19.8.0" },
	"fs.promises": { addedIn: "10.0.0" },
	"fs.promises.cp": { addedIn: "16.7.0" },
	"fs.promises.glob": { addedIn: "22.0.0" },
	"fs.promises.rm": { addedIn: "14.14.0" },
	"fs.promises.watch": { addedIn: "15.9.0" },
	"fs.rm": { addedIn: "14.14.0" },
	"fs.rmSync": { addedIn: "14.14.0" },

	// crypto module APIs
	"crypto.diffieHellman": { addedIn: "13.9.0" },
	"crypto.generateKey": { addedIn: "15.0.0" },
	"crypto.generateKeyPair": { addedIn: "10.12.0" },
	"crypto.generateKeyPairSync": { addedIn: "10.12.0" },
	"crypto.generateKeySync": { addedIn: "15.0.0" },
	"crypto.generatePrime": { addedIn: "15.8.0" },
	"crypto.generatePrimeSync": { addedIn: "15.8.0" },
	"crypto.getRandomValues": { addedIn: "17.4.0" },
	"crypto.hash": { addedIn: "21.7.0" },
	"crypto.hkdf": { addedIn: "15.0.0" },
	"crypto.hkdfSync": { addedIn: "15.0.0" },
	"crypto.randomUUID": { addedIn: "15.6.0" },
	"crypto.secureHeapUsed": { addedIn: "15.6.0" },
	"crypto.subtle": { addedIn: "15.0.0" },
	"crypto.webcrypto": { addedIn: "15.0.0" },

	// stream module APIs
	"stream.addAbortSignal": { addedIn: "15.4.0" },
	"stream.compose": { addedIn: "16.9.0" },
	"stream.consumers": { addedIn: "16.7.0" },
	"stream.getDefaultHighWaterMark": { addedIn: "19.9.0" },
	"stream.promises": { addedIn: "15.0.0" },
	"stream.Readable.from": { addedIn: "12.3.0" },
	"stream.Readable.fromWeb": { addedIn: "17.0.0" },
	"stream.Readable.toWeb": { addedIn: "17.0.0" },
	"stream.setDefaultHighWaterMark": { addedIn: "19.9.0" },
	"stream.Writable.fromWeb": { addedIn: "17.0.0" },
	"stream.Writable.toWeb": { addedIn: "17.0.0" },

	// timers module APIs
	"timers.promises": { addedIn: "15.0.0" },

	// util module APIs
	"util.aborted": { addedIn: "19.7.0" },
	"util.getSystemErrorMap": { addedIn: "16.0.0" },
	"util.getSystemErrorName": { addedIn: "9.7.0" },
	"util.MIMEParams": { addedIn: "19.1.0" },
	"util.MIMEType": { addedIn: "19.1.0" },
	"util.parseArgs": { addedIn: "18.3.0" },
	"util.parseEnv": { addedIn: "21.7.0" },
	"util.stripVTControlCharacters": { addedIn: "16.11.0" },
	"util.styleText": { addedIn: "21.7.0" },
	"util.toUSVString": { addedIn: "16.8.0" },
	"util.transferableAbortController": { addedIn: "18.11.0" },
	"util.transferableAbortSignal": { addedIn: "18.11.0" },
	"util.types": { addedIn: "10.0.0" },

	// buffer module APIs
	"buffer.atob": { addedIn: "15.13.0" },
	"buffer.Blob": { addedIn: "15.7.0" },
	"buffer.btoa": { addedIn: "15.13.0" },
	"buffer.File": { addedIn: "19.2.0" },
	"buffer.isAscii": { addedIn: "19.6.0" },
	"buffer.isUtf8": { addedIn: "19.4.0" },
	"buffer.resolveObjectURL": { addedIn: "16.7.0" },
	"buffer.transcode": { addedIn: "7.1.0" },

	// process module APIs
	"process.abort": { addedIn: "0.7.0" },
	"process.availableMemory": { addedIn: "22.0.0" },
	"process.constrainedMemory": { addedIn: "19.6.0" },
	"process.finalization": { addedIn: "22.5.0" },
	"process.getActiveResourcesInfo": { addedIn: "17.3.0" },
	"process.getBuiltinModule": { addedIn: "22.3.0" },
	"process.loadEnvFile": { addedIn: "21.7.0" },
	"process.permission": { addedIn: "20.0.0" },
	"process.sourceMapsEnabled": { addedIn: "20.7.0" },

	// Global identifiers
	atob: { addedIn: "16.0.0" },
	Blob: { addedIn: "15.7.0" },
	BroadcastChannel: { addedIn: "15.4.0" },
	btoa: { addedIn: "16.0.0" },
	ByteLengthQueuingStrategy: { addedIn: "18.0.0" },
	CloseEvent: { addedIn: "23.0.0" },
	CompressionStream: { addedIn: "18.0.0" },
	CountQueuingStrategy: { addedIn: "18.0.0" },
	Crypto: { addedIn: "17.6.0" },
	crypto: { addedIn: "17.6.0" },
	CryptoKey: { addedIn: "15.0.0" },
	CustomEvent: { addedIn: "18.7.0" },
	DecompressionStream: { addedIn: "18.0.0" },
	DOMException: { addedIn: "17.0.0" },
	Event: { addedIn: "15.0.0" },
	EventTarget: { addedIn: "15.0.0" },
	fetch: { addedIn: "18.0.0" },
	File: { addedIn: "20.0.0" },
	FormData: { addedIn: "18.0.0" },
	globalThis: { addedIn: "12.0.0" },
	Headers: { addedIn: "18.0.0" },
	Iterator: { addedIn: "23.0.0" },
	MessageChannel: { addedIn: "15.0.0" },
	MessageEvent: { addedIn: "15.0.0" },
	MessagePort: { addedIn: "15.0.0" },
	Navigator: { addedIn: "21.0.0" },
	navigator: { addedIn: "21.0.0" },
	performance: { addedIn: "16.0.0" },
	PerformanceEntry: { addedIn: "19.0.0" },
	PerformanceMark: { addedIn: "19.0.0" },
	PerformanceMeasure: { addedIn: "19.0.0" },
	PerformanceObserver: { addedIn: "19.0.0" },
	PerformanceObserverEntryList: { addedIn: "19.0.0" },
	PerformanceResourceTiming: { addedIn: "18.2.0" },
	ReadableByteStreamController: { addedIn: "18.0.0" },
	ReadableStream: { addedIn: "18.0.0" },
	ReadableStreamBYOBReader: { addedIn: "18.0.0" },
	ReadableStreamBYOBRequest: { addedIn: "18.0.0" },
	ReadableStreamDefaultController: { addedIn: "18.0.0" },
	ReadableStreamDefaultReader: { addedIn: "18.0.0" },
	Request: { addedIn: "18.0.0" },
	Response: { addedIn: "18.0.0" },
	structuredClone: { addedIn: "17.0.0" },
	SubtleCrypto: { addedIn: "15.0.0" },
	TextDecoderStream: { addedIn: "18.0.0" },
	TextEncoderStream: { addedIn: "18.0.0" },
	TransformStream: { addedIn: "18.0.0" },
	TransformStreamDefaultController: { addedIn: "18.0.0" },
	URL: { addedIn: "10.0.0" },
	URLSearchParams: { addedIn: "10.0.0" },
	WebSocket: { addedIn: "22.4.0" },
	WritableStream: { addedIn: "18.0.0" },
	WritableStreamDefaultController: { addedIn: "18.0.0" },
	WritableStreamDefaultWriter: { addedIn: "18.0.0" },
};
