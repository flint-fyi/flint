import { isAbsolute, resolve } from "pathe";

export function makeAbsolute(filePath: string): string {
	return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
}
