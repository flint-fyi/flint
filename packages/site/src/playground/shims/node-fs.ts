/**
 * Minimal browser shim for `node:fs`. The playground worker only ever runs
 * Flint against the in-memory VFS host, so most operations on this stub
 * should be unreachable. We intentionally throw rather than silently no-op so
 * unexpected calls surface immediately.
 *
 * `Dirent` is the one constructor the TS server host actually instantiates.
 */

import * as fsPromises from "./node-fs-promises.ts";

export class Dirent {
	name: string;
	#type: number;
	parentPath: string;

	constructor(name: string, type: number, parentPath: string) {
		this.name = name;
		this.#type = type;
		this.parentPath = parentPath;
	}

	isFile(): boolean {
		return this.#type === 1;
	}

	isDirectory(): boolean {
		return this.#type === 2;
	}

	isBlockDevice(): boolean {
		return false;
	}

	isCharacterDevice(): boolean {
		return false;
	}

	isSymbolicLink(): boolean {
		return false;
	}

	isFIFO(): boolean {
		return false;
	}

	isSocket(): boolean {
		return false;
	}
}

function unsupported(name: string): never {
	throw new Error(
		`node:fs.${name} is not implemented in the playground worker.`,
	);
}

const sentinel: unknown = new Proxy(() => undefined, {
	apply(_target, _this, _args) {
		unsupported("<call>");
	},
	get(_target, prop) {
		unsupported(String(prop));
	},
});

export const readFileSync = sentinel as never;
export const writeFileSync = sentinel as never;
export const readdirSync = sentinel as never;
export const statSync = sentinel as never;
export const lstatSync = sentinel as never;
export const existsSync = (() => false) as (path: string) => boolean;
export const realpathSync = sentinel as never;
export const watchFile = sentinel as never;
export const unwatchFile = sentinel as never;
export const watch = sentinel as never;
export const accessSync = sentinel as never;
export const mkdirSync = sentinel as never;
export const rmSync = sentinel as never;
export const rmdirSync = sentinel as never;
export const unlinkSync = sentinel as never;
export const renameSync = sentinel as never;
export const copyFileSync = sentinel as never;
export const chmodSync = sentinel as never;
export const chownSync = sentinel as never;
export const linkSync = sentinel as never;
export const symlinkSync = sentinel as never;
export const readlinkSync = sentinel as never;
export const truncateSync = sentinel as never;
export const utimesSync = sentinel as never;
export const appendFileSync = sentinel as never;
export const opendirSync = sentinel as never;
export const openSync = sentinel as never;
export const closeSync = sentinel as never;
export const fstatSync = sentinel as never;
export const createReadStream = sentinel as never;
export const createWriteStream = sentinel as never;
export const ReadStream = sentinel as never;
export const WriteStream = sentinel as never;
export const Stats = sentinel as never;
export const promises = fsPromises;

const fs: Record<string, unknown> = {
	Dirent,
	Stats,
	accessSync,
	appendFileSync,
	chmodSync,
	chownSync,
	closeSync,
	copyFileSync,
	createReadStream,
	createWriteStream,
	existsSync,
	fstatSync,
	linkSync,
	lstatSync,
	mkdirSync,
	openSync,
	opendirSync,
	promises,
	readFileSync,
	readdirSync,
	readlinkSync,
	realpathSync,
	renameSync,
	rmSync,
	rmdirSync,
	statSync,
	symlinkSync,
	truncateSync,
	unlinkSync,
	unwatchFile,
	utimesSync,
	watch,
	watchFile,
	writeFileSync,
};

export default fs;
