import ts from "typescript";
import { describe, expect, it } from "vitest";

import { containsGlobalDeclarations } from "./containsGlobalDeclarations.ts";

describe(containsGlobalDeclarations, () => {
	it("returns true for declare global blocks", () => {
		const code = `
      import { Something } from 'some-module';
      declare global {
        interface Window {
          customProperty: string;
        }
      }
    `;
		const sourceFile = getSourceFile(code);
		expect(containsGlobalDeclarations(sourceFile)).toBe(true);
	});

	it("returns true for top-level ambient declarations in script files", () => {
		const code = `
      declare function initializeAnalytics(): void;
    `;
		const sourceFile = getSourceFile(code);
		expect(containsGlobalDeclarations(sourceFile)).toBe(true);
	});

	it("returns false for standard module code", () => {
		const code = `
      import axios from 'axios';

      export const fetchData = async () => {
        return axios.get('/api/data');
      };

      interface LocalUser {
        id: string;
      }
    `;
		const sourceFile = getSourceFile(code);
		expect(containsGlobalDeclarations(sourceFile)).toBe(false);
	});

	it("returns false for empty source files", () => {
		expect(containsGlobalDeclarations(getSourceFile(""))).toBe(false);
		expect(containsGlobalDeclarations(getSourceFile("\n  \n"))).toBe(false);
	});

	it("returns false for module files with top-level declare outside declare global", () => {
		const code = `
      import { foo } from './foo';
      declare function localHelper(): void;
      declare const config: { debug: boolean };
    `;
		const sourceFile = getSourceFile(code);
		expect(containsGlobalDeclarations(sourceFile)).toBe(false);
	});

	it('returns false for inline type annotations that reference "global" by name', () => {
		const code = `
      import { globalState } from './store';
      const myVar: typeof globalState = { active: true };
    `;
		const sourceFile = getSourceFile(code);
		expect(containsGlobalDeclarations(sourceFile)).toBe(false);
	});
});

function getSourceFile(rawFileContent: string) {
	return ts.createSourceFile(
		"mayContainGlobals.ts",
		rawFileContent,
		ts.ScriptTarget.ESNext,
		true,
	);
}
