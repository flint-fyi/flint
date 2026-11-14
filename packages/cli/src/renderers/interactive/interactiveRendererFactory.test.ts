import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import type { Presenter } from "../../presenters/types.ts";
import type { Renderer, RendererContext } from "../types.ts";
import { interactiveRendererFactory } from "./interactiveRendererFactory.ts";

vi.mock("cli-cursor", () => ({
	default: {
		hide: vi.fn(),
		show: vi.fn(),
	},
}));

const presenter: Presenter = {
	header: [],
	renderFile: vi.fn(),
	summarize: vi.fn(),
};

const context: RendererContext = {
	duration: 0,
	formattingResults: undefined,
	ignoreCache: false,
	lintResults: {
		allFilePaths: new Set(),
		allFileResults: new Map(),
		cached: undefined,
		ruleCount: 0,
	},
};

function createRenderer(): Renderer {
	return interactiveRendererFactory.initialize(
		createVFSLinterHost({ caseSensitive: true, cwd: "/root" }),
		presenter,
	);
}

describe("interactiveRendererFactory", () => {
	beforeEach(() => {
		vi.spyOn(console, "clear").mockReturnValue();
		vi.spyOn(console, "log").mockReturnValue();
		vi.spyOn(process.stdin, "pause").mockReturnThis();
		vi.spyOn(process.stdin, "resume").mockReturnThis();
		// Vitest workers don't run with a TTY stdin, so setRawMode doesn't exist.
		Object.defineProperty(process.stdin, "setRawMode", {
			configurable: true,
			value: vi.fn(),
		});
	});

	afterEach(() => {
		process.stdin.removeAllListeners("keypress");
		Reflect.deleteProperty(process.stdin, "setRawMode");
		vi.restoreAllMocks();
	});

	it("resolves render without waiting for a key press", async () => {
		const renderer = createRenderer();

		await expect(renderer.render(context)).resolves.toBeUndefined();
	});

	it.each([
		["q", { name: "q" }],
		["\u{3}", { name: "c" }],
	])(
		"calls onQuit callbacks when %j is pressed",
		async (chunk: string, key: { name: string }) => {
			const renderer = createRenderer();
			const onQuit = vi.fn();
			renderer.onQuit?.(onQuit);

			await renderer.render(context);
			process.stdin.emit("keypress", chunk, key);

			expect(onQuit).toHaveBeenCalledOnce();
			expect(process.stdin.listenerCount("keypress")).toBe(0);
		},
	);

	it("does not call onQuit callbacks for other key presses", async () => {
		const renderer = createRenderer();
		const onQuit = vi.fn();
		renderer.onQuit?.(onQuit);

		await renderer.render(context);
		process.stdin.emit("keypress", "x", { name: "x" });

		expect(onQuit).not.toHaveBeenCalled();
	});
});
